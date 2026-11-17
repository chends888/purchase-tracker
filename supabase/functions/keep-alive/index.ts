/**
 * keep-alive — cheap Postgres ping so free-tier Supabase projects stay active.
 *
 * Auth: Authorization: Bearer ${KEEP_ALIVE_SECRET}
 *   or: x-keep-alive-secret: ${KEEP_ALIVE_SECRET}
 *
 * Secrets (set via `supabase secrets set`):
 *   KEEP_ALIVE_SECRET — required shared secret for callers (Cron / GitHub Action)
 *
 * Auto-injected by the Edge runtime (do not set manually in most setups):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  if (aBytes.length !== bBytes.length) return false
  return crypto.subtle.timingSafeEqual(aBytes, bBytes)
}

function extractProvidedSecret(req: Request): string | null {
  const auth = req.headers.get('Authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim()
    if (token) return token
  }
  const header = req.headers.get('x-keep-alive-secret')?.trim()
  return header || null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const expected = Deno.env.get('KEEP_ALIVE_SECRET')
  const provided = extractProvidedSecret(req)

  if (!expected || !provided || !timingSafeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in function env',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Cheap read against an existing table (same client pattern as lib/supabase/admin.ts).
  const { error } = await supabase.from('profiles').select('id').limit(1)

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, at: new Date().toISOString() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
