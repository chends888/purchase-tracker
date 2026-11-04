import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not set.' },
      { status: 500 },
    )
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header.' },
      { status: 400 },
    )
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId =
      session.client_reference_id ||
      session.metadata?.user_id ||
      null

    if (!userId) {
      console.error(
        '[stripe webhook] checkout.session.completed missing user id',
        session.id,
      )
      // Ack so Stripe does not retry forever for a misconfigured session
      return NextResponse.json({ received: true, skipped: 'no_user_id' })
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null

    try {
      const admin = createAdminClient()
      const patch: {
        plan: 'pro'
        plan_status: string
        stripe_customer_id?: string
      } = {
        plan: 'pro',
        plan_status: 'lifetime',
      }
      if (customerId) {
        patch.stripe_customer_id = customerId
      }

      const { error } = await admin
        .from('profiles')
        .update(patch)
        .eq('id', userId)

      if (error) {
        console.error('[stripe webhook] profile update failed', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 },
        )
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Admin client error'
      console.error('[stripe webhook]', message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
