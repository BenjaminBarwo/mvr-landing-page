import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const { data: app, error } = await supabaseAdmin
    .from("applications")
    .select(
      "id, name, email, phone, role, primary_zip, step_completed, monthly_lead_spend, leads_per_month, transactions_closed, buys_online_leads, stripe_payment_intent_id, status"
    )
    .eq("session_id", sessionId)
    .eq("status", "draft")
    .single();

  if (error || !app) {
    return NextResponse.json({ found: false });
  }

  let clientSecret: string | null = null;

  // If payment intent exists, retrieve fresh clientSecret
  if (app.stripe_payment_intent_id) {
    try {
      const pi = await stripe.paymentIntents.retrieve(
        app.stripe_payment_intent_id
      );
      clientSecret = pi.client_secret ?? null;
    } catch {
      // PI retrieval failed — user will need to create a new one
    }
  }

  return NextResponse.json({
    found: true,
    applicationId: app.id,
    stepCompleted: app.step_completed,
    firstName: app.name,
    email: app.email,
    phone: app.phone,
    role: app.role,
    zipCode: app.primary_zip,
    monthlyLeadSpend: app.monthly_lead_spend,
    leadsPerMonth: app.leads_per_month,
    transactionsClosed: app.transactions_closed,
    buysOnlineLeads: app.buys_online_leads,
    clientSecret,
  });
}
