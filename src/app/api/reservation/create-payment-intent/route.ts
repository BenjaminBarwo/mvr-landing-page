import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

const paymentSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = paymentSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 400 }
    );
  }

  const { sessionId } = result.data;

  // Verify application: session_id matches, status='draft', step_completed >= 2
  const { data: app, error: appError } = await supabaseAdmin
    .from("applications")
    .select("id, email, role, primary_zip, stripe_payment_intent_id")
    .eq("session_id", sessionId)
    .eq("status", "draft")
    .gte("step_completed", 2)
    .single();

  if (appError || !app) {
    return NextResponse.json(
      { error: "Application not found or not ready for payment" },
      { status: 404 }
    );
  }

  // Idempotent: if PI already exists, retrieve and return same clientSecret
  if (app.stripe_payment_intent_id) {
    try {
      const existingPI = await stripe.paymentIntents.retrieve(
        app.stripe_payment_intent_id
      );
      return NextResponse.json({ clientSecret: existingPI.client_secret });
    } catch {
      // PI retrieval failed — create a new one
    }
  }

  // Create new PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 10000, // $100.00
    currency: "usd",
    metadata: {
      application_id: app.id,
      session_id: sessionId,
      email: app.email,
      role: app.role,
      zip_code: app.primary_zip ?? "",
    },
  });

  // Update application with PI ID
  await supabaseAdmin
    .from("applications")
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      payment_amount_cents: 10000,
    })
    .eq("id", app.id);

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
