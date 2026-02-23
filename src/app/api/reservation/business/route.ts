import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const businessSchema = z.object({
  sessionId: z.string().uuid(),
  monthly_lead_spend: z.string().min(1),
  leads_per_month: z.string().min(1),
  transactions_closed: z.string().min(1),
  buys_online_leads: z.union([z.string().min(1), z.boolean()]).transform((v) =>
    typeof v === "boolean" ? (v ? "yes" : "no") : v
  ),
});

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = businessSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Please fill out all fields before continuing." },
      { status: 400 }
    );
  }

  const {
    sessionId,
    monthly_lead_spend,
    leads_per_month,
    transactions_closed,
    buys_online_leads,
  } = result.data;

  // Verify application exists with matching session_id and status='draft'
  const { data, error } = await supabaseAdmin
    .from("applications")
    .update({
      monthly_lead_spend,
      leads_per_month,
      transactions_closed,
      buys_online_leads,
      step_completed: 2,
      step2_completed_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId)
    .eq("status", "draft")
    .select("id")
    .single();

  if (error || !data) {
    console.error("Business update error:", error);
    return NextResponse.json(
      { error: "Application not found or already submitted" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
