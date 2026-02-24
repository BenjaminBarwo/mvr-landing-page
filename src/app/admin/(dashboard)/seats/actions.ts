"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

// ─── Schemas ────────────────────────────────────────────────────────────────

const updateZipSeatSchema = z.object({
  id: z.string().min(1),
  field: z.enum(["total_cap", "phantom_count"]),
  value: z.number().int().min(0),
})

const bulkSetPhantomFillSchema = z.object({
  role: z.string().min(1),
  phantomCount: z.number().int().min(0),
})

const resetCapsByTierSchema = z.object({
  role: z.string().min(1),
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

// ─── Default caps by role and tier ────────────────────────────────────────────
// Base caps: Agent:5, Lender:3, Inspector:2, Title:2, Appraiser:2, Contractor:3
// Multipliers: Premium 1x, Standard 1.5x (rounded up), Suburban 2x

const DEFAULT_CAPS: Record<string, Record<string, number>> = {
  agent:        { premium: 5, standard: 8,  suburban: 10 },
  lender:       { premium: 3, standard: 5,  suburban: 6  },
  inspector:    { premium: 2, standard: 3,  suburban: 4  },
  title_company:{ premium: 2, standard: 3,  suburban: 4  },
  appraiser:    { premium: 2, standard: 3,  suburban: 4  },
  contractor:   { premium: 3, standard: 5,  suburban: 6  },
}

// ─── Result interfaces ────────────────────────────────────────────────────────

export interface UpdateZipSeatResult {
  success?: boolean
  error?: string
}

export interface BulkSetPhantomFillResult {
  success?: boolean
  error?: string
  updatedCount?: number
}

export interface ResetCapsByTierResult {
  success?: boolean
  error?: string
}

// ─── ZipSeatRow type ──────────────────────────────────────────────────────────

export interface ZipSeatRow {
  id: string
  zip_code: string
  tier: string
  neighborhood: string | null
  total_cap: number
  phantom_count: number
  claimed_count: number
  total_displayed: number
}

// ─── updateZipSeat ────────────────────────────────────────────────────────────

export async function updateZipSeat(
  input: z.infer<typeof updateZipSeatSchema>
): Promise<UpdateZipSeatResult> {
  const { user, error: authError } = await requireApprover()
  if (authError || !user) {
    return { error: authError ?? "Unauthorized" }
  }

  const parsed = updateZipSeatSchema.safeParse(input)
  if (!parsed.success) {
    return { error: "Invalid input: " + parsed.error.issues[0]?.message }
  }

  const { id, field, value } = parsed.data

  const { error: updateError } = await supabaseAdmin
    .from("zip_seats")
    .update({ [field]: value })
    .eq("id", id)

  if (updateError) {
    console.error("[admin/seats] Failed to update zip_seat:", updateError)
    return { error: "Failed to update seat data" }
  }

  revalidatePath("/admin/seats")

  return { success: true }
}

// ─── bulkSetPhantomFill ───────────────────────────────────────────────────────

export async function bulkSetPhantomFill(
  input: z.infer<typeof bulkSetPhantomFillSchema>
): Promise<BulkSetPhantomFillResult> {
  const { user, error: authError } = await requireApprover()
  if (authError || !user) {
    return { error: authError ?? "Unauthorized" }
  }

  const parsed = bulkSetPhantomFillSchema.safeParse(input)
  if (!parsed.success) {
    return { error: "Invalid input: " + parsed.error.issues[0]?.message }
  }

  const { role, phantomCount } = parsed.data

  const { data, error: updateError } = await supabaseAdmin
    .from("zip_seats")
    .update({ phantom_count: phantomCount })
    .eq("role", role)
    .select("id")

  if (updateError) {
    console.error("[admin/seats] Failed to bulk set phantom fill:", updateError)
    return { error: "Failed to update phantom fill" }
  }

  const updatedCount = data?.length ?? 0

  revalidatePath("/admin/seats")

  return { success: true, updatedCount }
}

// ─── resetCapsByTier ──────────────────────────────────────────────────────────

export async function resetCapsByTier(
  input: z.infer<typeof resetCapsByTierSchema>
): Promise<ResetCapsByTierResult> {
  const { user, error: authError } = await requireApprover()
  if (authError || !user) {
    return { error: authError ?? "Unauthorized" }
  }

  const parsed = resetCapsByTierSchema.safeParse(input)
  if (!parsed.success) {
    return { error: "Invalid input: " + parsed.error.issues[0]?.message }
  }

  const { role } = parsed.data

  const caps = DEFAULT_CAPS[role]
  if (!caps) {
    return { error: `Unknown role: ${role}` }
  }

  // Fetch all zip_seats for this role to reset caps per tier
  const { data: rows, error: fetchError } = await supabaseAdmin
    .from("zip_seats")
    .select("id, tier")
    .eq("role", role)

  if (fetchError || !rows) {
    console.error("[admin/seats] Failed to fetch zip_seats for reset:", fetchError)
    return { error: "Failed to fetch seat rows" }
  }

  // Update each row with the default cap for its tier
  const updates = rows.map((row) => ({
    id: row.id,
    total_cap: caps[row.tier as keyof typeof caps] ?? caps.standard,
  }))

  // Batch update in chunks of 50 to avoid payload limits
  const chunkSize = 50
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize)

    // Upsert with update only (no insert needed, rows already exist)
    const { error: upsertError } = await supabaseAdmin
      .from("zip_seats")
      .upsert(chunk, { onConflict: "id" })

    if (upsertError) {
      console.error("[admin/seats] Failed to reset caps for chunk:", upsertError)
      return { error: "Failed to reset seat caps" }
    }
  }

  revalidatePath("/admin/seats")

  return { success: true }
}

// ─── fetchSeatsForRole ────────────────────────────────────────────────────────

export async function fetchSeatsForRole(role: string): Promise<ZipSeatRow[]> {
  // Fetch all zip_seats for this role
  const { data: seats, error: seatsError } = await supabaseAdmin
    .from("zip_seats")
    .select("id, zip_code, tier, neighborhood, total_cap, phantom_count")
    .eq("role", role)
    .order("zip_code", { ascending: true })

  if (seatsError || !seats) {
    console.error("[admin/seats] Failed to fetch seats:", seatsError)
    return []
  }

  if (seats.length === 0) return []

  // For each ZIP, count applications with status NOT IN (draft, rejected)
  // Use a single query with IN clause on zip_codes for efficiency
  const zipCodes = seats.map((s) => s.zip_code)

  // Count claimed seats per ZIP: applications joined with application_zips
  // Status = submitted, approved, waitlisted (not draft, not rejected)
  const { data: claimedRows, error: claimedError } = await supabaseAdmin
    .from("application_zips")
    .select("zip_code, applications!inner(status, role)", { count: "exact" })
    .in("zip_code", zipCodes)
    .in("applications.status", ["submitted", "approved", "waitlisted"])
    .eq("applications.role", role)

  if (claimedError) {
    console.error("[admin/seats] Failed to fetch claimed counts:", claimedError)
  }

  // Build a map of zip_code -> claimed count
  const claimedByZip: Record<string, number> = {}
  for (const row of claimedRows ?? []) {
    const zip = row.zip_code
    claimedByZip[zip] = (claimedByZip[zip] ?? 0) + 1
  }

  return seats.map((seat) => {
    const claimed = claimedByZip[seat.zip_code] ?? 0
    return {
      id: seat.id,
      zip_code: seat.zip_code,
      tier: seat.tier,
      neighborhood: seat.neighborhood ?? null,
      total_cap: seat.total_cap,
      phantom_count: seat.phantom_count,
      claimed_count: claimed,
      total_displayed: claimed + seat.phantom_count,
    }
  })
}
