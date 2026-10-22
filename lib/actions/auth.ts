'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/items'

export type AuthResult = { error: string | null }

export async function signUp(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        'Supabase is not configured. Copy .env.example to .env.local and add your project keys.',
    }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/tracker')
}

export async function signIn(
  _prev: AuthResult,
  formData: FormData,
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        'Supabase is not configured. Copy .env.example to .env.local and add your project keys.',
    }
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/tracker')
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    redirect('/login')
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
