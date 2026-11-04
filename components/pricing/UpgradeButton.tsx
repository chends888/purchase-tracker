'use client'

import { useState, useTransition } from 'react'
import { startProCheckout } from '@/lib/actions/stripe'

export function UpgradeButton({ disabled }: { disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await startProCheckout()
      // redirect() throws; only errors return
      if (result && !result.ok) {
        setError(result.error)
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '12px 16px',
          borderRadius: 10,
          border: 'none',
          background: disabled || pending ? '#E8E0D0' : '#1A1208',
          color: disabled || pending ? '#999' : '#FFF8EC',
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          cursor: disabled || pending ? 'not-allowed' : 'pointer',
        }}
      >
        {pending ? 'Redirecting to Stripe…' : 'Upgrade — $5 lifetime'}
      </button>
      {error && (
        <p
          style={{
            marginTop: 10,
            marginBottom: 0,
            fontSize: 13,
            color: '#E05050',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
