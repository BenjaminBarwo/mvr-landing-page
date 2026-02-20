import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

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

  let event

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
    case 'payment_intent.succeeded':
      // Phase 4: update application status, trigger confirmation email
      console.log('Payment succeeded:', event.data.object.id)
      break

    case 'payment_intent.payment_failed':
      // Phase 4: update payment status
      console.log('Payment failed:', event.data.object.id)
      break

    case 'checkout.session.completed':
      // Phase 4: alternative payment flow
      console.log('Checkout session completed:', event.data.object.id)
      break

    default:
      console.log('Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}
