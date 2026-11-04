'use server'

import { redirect } from 'next/navigation'
import type Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/items'
import { getAppUrl, getStripe, isStripeConfigured } from '@/lib/stripe'
import type { Plan } from '@/lib/types'

export type CheckoutResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Creates a Stripe Checkout session (mode=payment, one-time $5) and redirects.
 * Auth required. Already-pro users get a friendly error (UI shows “You’re Pro”).
 */
export async function startProCheckout(): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    }
  }

  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        'Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to .env.local.',
    }
  }

  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return { ok: false, error: 'STRIPE_PRICE_ID is not set.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { ok: false, error: 'You must be signed in to upgrade.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  const plan = (profile?.plan as Plan | undefined) ?? 'free'
  if (plan === 'pro') {
    return { ok: false, error: 'You’re already on Pro.' }
  }

  const stripe = getStripe()
  const appUrl = getAppUrl()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    client_reference_id: user.id,
    metadata: { user_id: user.id },
  }

  if (profile?.stripe_customer_id) {
    sessionParams.customer = profile.stripe_customer_id
  } else if (user.email) {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    return { ok: false, error: 'Stripe did not return a Checkout URL.' }
  }

  redirect(session.url)
}
