import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import Stripe from 'stripe'
import { env } from '@/env'

const webhookSecret = env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // CRITICAL: Read body as text — NEVER use request.json() (destroys signature verification)
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const applicationId = pi.metadata.application_id
      const primaryZip = pi.metadata.zip_code

      if (!applicationId) {
        console.error('payment_intent.succeeded: missing application_id in metadata')
        break
      }

      const now = new Date().toISOString()

      // Update application status
      const { error: updateError } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'submitted',
          stripe_payment_status: 'succeeded',
          paid_at: now,
          step_completed: 3,
          step3_completed_at: now,
        })
        .eq('id', applicationId)

      if (updateError) {
        console.error('Failed to update application on payment success:', updateError)
        break
      }

      // Insert status history record: draft -> submitted (changed_by null = system/webhook)
      await supabaseAdmin
        .from('application_status_history')
        .insert({
          application_id: applicationId,
          from_status: 'draft',
          to_status: 'submitted',
          changed_by: null,
          reason: 'Payment confirmed via Stripe webhook',
        })

      // Resolve ZIP code and fetch applicant details for confirmation email
      let resolvedZip = primaryZip
      let appFirstName = ''
      let appEmail = ''
      let appRole = ''

      const { data: app } = await supabaseAdmin
        .from('applications')
        .select('primary_zip, name, email, role')
        .eq('id', applicationId)
        .single()

      if (app) {
        resolvedZip = resolvedZip || app.primary_zip || ''
        appFirstName = app.name || ''
        appEmail = app.email || ''
        appRole = app.role || ''
      }

      // Insert application_zips record for primary ZIP
      if (resolvedZip) {
        await supabaseAdmin
          .from('application_zips')
          .insert({
            application_id: applicationId,
            zip_code: resolvedZip,
            is_primary: true,
          })
          .then(({ error }) => {
            // Ignore duplicate inserts (idempotent webhook retries)
            if (error && error.code !== '23505') {
              console.error('Failed to insert application_zip:', error)
            }
          })
      }

      // Send confirmation email — failure must NOT prevent 200 response to Stripe
      if (appEmail) {
        try {
          await sendEmail({
            applicationId,
            emailType: 'confirmation',
            application: {
              firstName: appFirstName,
              email: appEmail,
              role: appRole,
              primary_zip: resolvedZip || '',
              amountPaid: '$100',
            },
          })
        } catch (emailErr) {
          console.error('Confirmation email failed (non-fatal):', emailErr)
        }
      }

      console.log('Payment succeeded for application:', applicationId)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const applicationId = pi.metadata.application_id

      if (!applicationId) {
        console.error('payment_intent.payment_failed: missing application_id in metadata')
        break
      }

      await supabaseAdmin
        .from('applications')
        .update({ stripe_payment_status: 'failed' })
        .eq('id', applicationId)

      console.log('Payment failed for application:', applicationId)
      break
    }

    default:
      console.log('Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}
