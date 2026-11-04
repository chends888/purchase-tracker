import Link from 'next/link'

export default function PricingPage() {
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
        <p style={{ color: '#666', fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>
          Stripe billing lands in Phase 2. Until then, every account is on the free
          plan.
        </p>

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
              Pro — coming soon
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
              $5<span style={{ fontSize: 16, color: '#888' }}>/mo</span>
            </div>
            <p style={{ color: '#666', fontSize: 14, margin: 0 }}>
              Unlimited items. Checkout via Stripe in a later release.
            </p>
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
