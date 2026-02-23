import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

const confirmSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = confirmSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 400 }
    );
  }

  const { sessionId } = result.data;

  // Find application by session
  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .select("id, primary_zip, stripe_payment_intent_id, status")
    .eq("session_id", sessionId)
    .single();

  if (appError || !app || !app.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  // Already submitted (webhook beat us) — no-op
  if (app.status === "submitted") {
    return NextResponse.json({ success: true, alreadyConfirmed: true });
  }

  // Verify with Stripe directly
  const pi = await stripe.paymentIntents.retrieve(app.stripe_payment_intent_id);

  if (pi.status !== "succeeded") {
    return NextResponse.json(
      { error: "Payment has not succeeded yet." },
      { status: 400 }
    );
  }

  // Update application
  const { error: updateError } = await supabaseAdmin
    .from("applications")
    .update({
      status: "submitted",
      stripe_payment_status: "succeeded",
      paid_at: new Date().toISOString(),
      step_completed: 3,
    })
    .eq("id", app.id);

  if (updateError) {
    console.error("Confirm update error:", updateError);
    return NextResponse.json(
      { error: "Failed to confirm reservation." },
      { status: 500 }
    );
  }

  // Insert application_zips
  if (app.primary_zip) {
    await supabaseAdmin
      .from("application_zips")
      .upsert(
        {
          application_id: app.id,
          zip_code: app.primary_zip,
          is_primary: true,
        },
        { onConflict: "application_id,zip_code" }
      );
  }

  return NextResponse.json({ success: true });
}
