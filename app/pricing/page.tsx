import Link from 'next/link'
import { UpgradeButton } from '@/components/pricing/UpgradeButton'
import { isSupabaseConfigured } from '@/lib/items'
import { createClient } from '@/lib/supabase/server'
import type { Plan } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const params = await searchParams
  const checkout = params.checkout

  let plan: Plan = 'free'
  let signedIn = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        signedIn = true
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.plan === 'pro' || profile?.plan === 'free') {
          plan = profile.plan
        }
      }
    } catch {
      // Pricing still renders without auth/env
    }
  }

  const isPro = plan === 'pro'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F4',
        fontFamily: "'DM Sans', sans-serif",
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 32,
            fontWeight: 900,
            color: '#1A1208',
            marginBottom: 8,
          }}
        >
          Pricing
        </div>
        <p style={{ color: '#666', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
          Free accounts track up to 10 items. Pro is a one-time $5 unlock —
          unlimited items for life. No subscription.
        </p>

        {checkout === 'success' && (
          <div
            style={{
              background: '#DCFFF0',
              border: '1.5px solid #A8E6C3',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#007A40',
            }}
          >
            {isPro
              ? 'Payment received — you’re on Pro. Unlimited items are unlocked.'
              : 'Payment received. Pro unlocks when the Stripe webhook finishes (usually a few seconds). Refresh this page if it still says Free.'}
          </div>
        )}

        {checkout === 'canceled' && (
          <div
            style={{
              background: '#FFF8EC',
              border: '1.5px solid #F5D9A0',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#8A5A00',
            }}
          >
            Checkout canceled. You can upgrade anytime.
          </div>
        )}

        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              background: '#fff',
              border: '1.5px solid #EDE9E0',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Free
            </div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 28,
                fontWeight: 800,
                color: '#1A1208',
                marginBottom: 8,
              }}
            >
              $0
            </div>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              Up to 10 purchase items. Full tracker UX.
            </p>
          </div>

          <div
            style={{
              background: '#FFF8EC',
              border: '1.5px solid #F5D9A0',
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: '#B07800',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {isPro ? 'Pro — active' : 'Pro — lifetime'}
            </div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 28,
                fontWeight: 800,
                color: '#1A1208',
                marginBottom: 8,
              }}
            >
              $5
              <span style={{ fontSize: 16, color: '#888' }}> once</span>
            </div>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              Unlimited items. One Stripe Checkout payment — no recurring charge.
            </p>

            {isPro ? (
              <div
                style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#DCFFF0',
                  border: '1.5px solid #A8E6C3',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#007A40',
                  textAlign: 'center',
                }}
              >
                You’re Pro
              </div>
            ) : signedIn ? (
              <UpgradeButton />
            ) : (
              <Link
                href="/login?next=/pricing"
                style={{
                  display: 'block',
                  marginTop: 16,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#1A1208',
                  color: '#FFF8EC',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Sign in to upgrade
              </Link>
            )}
          </div>
        </div>

        <Link
          href="/tracker"
          style={{
            display: 'inline-block',
            marginTop: 28,
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: '#B07800',
            textDecoration: 'underline',
          }}
        >
          ← Back to tracker
        </Link>
      </div>
    </div>
  )
}
