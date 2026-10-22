'use client'

import { useActionState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { AuthResult } from '@/lib/actions/auth'

const initial: AuthResult = { error: null }

const fieldStyle: CSSProperties = {
  width: '100%',
  border: '1.5px solid #EDE9E0',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  color: '#1A1208',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FAFAF8',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: "'DM Mono', monospace",
  fontSize: 11,
  color: '#888',
  letterSpacing: 0.5,
  marginBottom: 6,
  textTransform: 'uppercase',
}

export function AuthForm({
  mode,
  action,
  configured,
}: {
  mode: 'login' | 'signup'
  action: (prev: AuthResult, formData: FormData) => Promise<AuthResult>
  configured: boolean
}) {
  const [state, formAction, pending] = useActionState(action, initial)
  const isLogin = mode === 'login'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F4',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 20,
          padding: '36px 32px',
          border: '1px solid #F0EDE8',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 28,
            fontWeight: 900,
            color: '#F5A623',
            letterSpacing: -0.5,
            marginBottom: 4,
          }}
        >
          🛍 Purchase tracker
        </div>
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: '#999',
            marginBottom: 28,
          }}
        >
          {isLogin ? 'Sign in to your account' : 'Create a free account'}
        </div>

        {!configured && (
          <div
            style={{
              background: '#FFF5F5',
              border: '1.5px solid #FBDADA',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 20,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: '#A04040',
              lineHeight: 1.45,
            }}
          >
            Supabase env vars are missing. Copy{' '}
            <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              .env.example
            </code>{' '}
            to{' '}
            <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              .env.local
            </code>{' '}
            and add your project URL + anon key, then restart{' '}
            <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
              npm run dev
            </code>
            .
          </div>
        )}

        <form action={formAction}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={!configured || pending}
              style={fieldStyle}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              disabled={!configured || pending}
              style={fieldStyle}
            />
          </div>

          {state.error && (
            <div
              style={{
                background: '#FFF5F5',
                border: '1.5px solid #FBDADA',
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 16,
                fontSize: 13,
                color: '#E05050',
              }}
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={!configured || pending}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 12,
              border: 'none',
              background:
                !configured || pending
                  ? '#E8DFD0'
                  : 'linear-gradient(135deg, #F5A623 0%, #E8851A 100%)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#fff',
              cursor: !configured || pending ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              boxShadow:
                !configured || pending
                  ? 'none'
                  : '0 4px 12px rgba(245,166,35,0.35)',
            }}
          >
            {pending
              ? isLogin
                ? 'Signing in…'
                : 'Creating account…'
              : isLogin
                ? 'Sign in'
                : 'Sign up'}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 13,
            color: '#888',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {isLogin ? (
            <>
              No account?{' '}
              <Link href="/signup" style={{ color: '#B07800', fontWeight: 600 }}>
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#B07800', fontWeight: 600 }}>
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
