"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { sendEmail, type EmailType } from "@/lib/email"

// ─── Schemas ────────────────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["approved", "rejected", "waitlisted", "submitted"]),
  reason: z.string().optional(),
})

const noteSchema = z.object({
  applicationId: z.string().min(1),
  note: z.string().min(1),
})

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireApprover() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: "Unauthorized: not authenticated" }
  }

  const role = (user.app_metadata?.role as string) ?? ""
  if (role !== "approver") {
    return { user: null, error: "Unauthorized: approver role required" }
  }

  return { user, error: null }
}

// ─── updateApplicationStatus ─────────────────────────────────────────────────

interface UpdateStatusResult {
  success?: boolean
  error?: string
}

export async function updateApplicationStatus(
  input: z.infer<typeof updateStatusSchema>
): Promise<UpdateStatusResult> {
  // 1. Verify approver role
  const { user, error: authError } = await requireApprover()
  if (authError || !user) {
    return { error: authError ?? "Unauthorized" }
  }

  // 2. Validate input
  const parsed = updateStatusSchema.safeParse(input)
  if (!parsed.success) {
    return { error: "Invalid input: " + parsed.error.issues[0]?.message }
  }

  const { applicationId, status, reason } = parsed.data

  // Rejection requires a reason
  if (status === "rejected" && (!reason || reason.trim().length === 0)) {
    return { error: "Rejection reason is required" }
  }

  // 3. Fetch application
  const { data: app, error: fetchError } = await supabaseAdmin
    .from("applications")
    .select("name, email, role, primary_zip, status")
    .eq("id", applicationId)
    .single()

  if (fetchError || !app) {
    return { error: "Application not found" }
  }

  const previousStatus = app.status

  // 4. Update application status
  const { error: updateError } = await supabaseAdmin
    .from("applications")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", applicationId)

  if (updateError) {
    console.error("[admin] Failed to update application status:", updateError)
    return { error: "Failed to update application status" }
  }

  // 5. Insert status history record
  const { error: historyError } = await supabaseAdmin
    .from("application_status_history")
    .insert({
      application_id: applicationId,
      from_status: previousStatus,
      to_status: status,
      changed_by: user.id,
      reason: reason?.trim() ?? null,
    })

  if (historyError) {
    console.error("[admin] Failed to insert status history:", historyError)
    // Non-fatal — status was already updated
  }

  // 6. Determine email type
  let emailType: EmailType
  if (previousStatus === "waitlisted" && status === "approved") {
    emailType = "waitlist_approved"
  } else {
    emailType = status as EmailType
  }

  // 7. Send email (non-throwing — email failure must not prevent status update)
  try {
    await sendEmail({
      applicationId,
      emailType,
      application: {
        firstName: app.name,
        email: app.email,
        role: app.role,
        primary_zip: app.primary_zip ?? "",
      },
    })
  } catch (emailErr) {
    console.error("[admin] Email send exception (non-fatal):", emailErr)
  }

  // 8. Revalidate the applications page
  revalidatePath("/admin/applications")

  return { success: true }
}

// ─── addOutreachNote ──────────────────────────────────────────────────────────

interface AddNoteResult {
  success?: boolean
  error?: string
}

export async function addOutreachNote(
  input: z.infer<typeof noteSchema>
): Promise<AddNoteResult> {
  const { user, error: authError } = await requireApprover()
  if (authError || !user) {
    return { error: authError ?? "Unauthorized" }
  }

  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: "Invalid input: " + parsed.error.issues[0]?.message }
  }

  const { applicationId, note } = parsed.data

  const { error: updateError } = await supabaseAdmin
    .from("applications")
    .update({ outreach_notes: note.trim() })
    .eq("id", applicationId)

  if (updateError) {
    console.error("[admin] Failed to save outreach note:", updateError)
    return { error: "Failed to save note" }
  }

  revalidatePath("/admin/applications")

  return { success: true }
}

// ─── getApplicationDetail ─────────────────────────────────────────────────────

export interface StatusHistoryEntry {
  id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  changed_by_email: string | null
  reason: string | null
  created_at: string
}

export interface ApplicationDetail {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  primary_zip: string | null
  status: string
  stripe_payment_status: string | null
  step_completed: number
  created_at: string
  step1_completed_at: string | null
  step2_completed_at: string | null
  step3_completed_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  outreach_notes: string | null
  monthly_lead_spend: string | null
  leads_per_month: string | null
  transactions_closed: string | null
  buys_online_leads: boolean | null
  wtp_amount: string | null
  paid_at: string | null
  payment_amount_cents: number | null
  admin_notes: string | null
  // Seat context
  total_cap: number | null
  phantom_count: number | null
  claimed_count: number | null
  // Status history
  statusHistory: StatusHistoryEntry[]
  // Current admin role (for action visibility)
  callerRole: string
}

interface GetDetailResult {
  data?: ApplicationDetail
  error?: string
}

export async function getApplicationDetail(
  applicationId: string
): Promise<GetDetailResult> {
  if (!applicationId) return { error: "applicationId is required" }

  // Verify caller is authenticated admin
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Unauthorized" }
  }

  const callerRole = (user.app_metadata?.role as string) ?? "viewer"

  // Fetch application
  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single()

  if (appError || !app) {
    return { error: "Application not found" }
  }

  // Fetch status history
  const { data: historyRows } = await supabaseAdmin
    .from("application_status_history")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true })

  // Resolve admin emails for changed_by UUIDs
  const adminEmailCache: Record<string, string> = {}
  const historyWithEmails: StatusHistoryEntry[] = []

  for (const row of historyRows ?? []) {
    let changedByEmail: string | null = null
    if (row.changed_by) {
      if (adminEmailCache[row.changed_by]) {
        changedByEmail = adminEmailCache[row.changed_by]
      } else {
        try {
          const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(
            row.changed_by
          )
          changedByEmail = adminUser?.user?.email ?? null
          if (changedByEmail) adminEmailCache[row.changed_by] = changedByEmail
        } catch {
          // Non-fatal — just show UUID if lookup fails
        }
      }
    }
    historyWithEmails.push({
      id: row.id,
      from_status: row.from_status,
      to_status: row.to_status,
      changed_by: row.changed_by,
      changed_by_email: changedByEmail,
      reason: row.reason,
      created_at: row.created_at,
    })
  }

  // Fetch seat context
  let totalCap: number | null = null
  let phantomCount: number | null = null
  let claimedCount: number | null = null

  if (app.primary_zip && app.role) {
    const { data: seatRow } = await supabaseAdmin
      .from("zip_seats")
      .select("total_cap, phantom_count")
      .eq("zip_code", app.primary_zip)
      .eq("role", app.role)
      .single()

    if (seatRow) {
      totalCap = seatRow.total_cap
      phantomCount = seatRow.phantom_count ?? 0
    }

    // Count claimed seats (submitted + approved + waitlisted)
    const { count } = await supabaseAdmin
      .from("application_zips")
      .select("*, applications!inner(status, role)", { count: "exact", head: true })
      .eq("zip_code", app.primary_zip)
      .in("applications.status", ["submitted", "approved", "waitlisted"])
      .eq("applications.role", app.role)

    claimedCount = count ?? 0
  }

  return {
    data: {
      id: app.id,
      name: app.name,
      email: app.email,
      phone: app.phone ?? null,
      role: app.role,
      primary_zip: app.primary_zip ?? null,
      status: app.status,
      stripe_payment_status: app.stripe_payment_status ?? null,
      step_completed: app.step_completed ?? 0,
      created_at: app.created_at,
      step1_completed_at: app.step1_completed_at ?? null,
      step2_completed_at: app.step2_completed_at ?? null,
      step3_completed_at: app.step3_completed_at ?? null,
      reviewed_by: app.reviewed_by ?? null,
      reviewed_at: app.reviewed_at ?? null,
      outreach_notes: app.outreach_notes ?? null,
      monthly_lead_spend: app.monthly_lead_spend ?? null,
      leads_per_month: app.leads_per_month ?? null,
      transactions_closed: app.transactions_closed ?? null,
      buys_online_leads: app.buys_online_leads ?? null,
      wtp_amount: app.wtp_amount ?? null,
      paid_at: app.paid_at ?? null,
      payment_amount_cents: app.payment_amount_cents ?? null,
      admin_notes: app.admin_notes ?? null,
      total_cap: totalCap,
      phantom_count: phantomCount,
      claimed_count: claimedCount,
      statusHistory: historyWithEmails,
      callerRole,
    },
  }
}
