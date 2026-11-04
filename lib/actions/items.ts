'use server'

import { revalidatePath } from 'next/cache'
import { FREE_ITEM_LIMIT } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, itemToRowPatch, rowToItem } from '@/lib/items'
import type { ItemInsert, ItemRow, Plan, PurchaseItem, ItemUpdate } from '@/lib/types'

function freeItemLimit(): number {
  const fromEnv = Number(process.env.FREE_ITEM_LIMIT)
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : FREE_ITEM_LIMIT
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type Authed =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string } }
  | { ok: false; error: string }

async function requireUser(): Promise<Authed> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error:
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  return { ok: true, supabase, user }
}

export async function listItems(): Promise<ActionResult<PurchaseItem[]>> {
  const auth = await requireUser()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { data, error } = await auth.supabase
    .from('items')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    data: ((data ?? []) as ItemRow[]).map(rowToItem),
  }
}

export async function createItem(
  input: ItemInsert,
): Promise<ActionResult<PurchaseItem>> {
  const auth = await requireUser()
  if (!auth.ok) return { ok: false, error: auth.error }

  const name = input.name?.trim()
  if (!name) {
    return { ok: false, error: 'Item name is required.' }
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from('profiles')
    .select('plan')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, error: profileError.message }
  }

  const plan = (profile?.plan as Plan | undefined) ?? 'free'
  if (plan !== 'pro') {
    const limit = freeItemLimit()
    const { count, error: countError } = await auth.supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id)

    if (countError) {
      return { ok: false, error: countError.message }
    }

    if ((count ?? 0) >= limit) {
      return {
        ok: false,
        error: `Free plan is limited to ${limit} items. Upgrade to Pro for unlimited items.`,
      }
    }
  }

  const { data, error } = await auth.supabase
    .from('items')
    .insert({
      user_id: auth.user.id,
      name,
      store: input.store || 'Other',
      price: input.price || null,
      url: input.url || null,
      notes: input.notes || null,
      image: input.image || null,
      status: input.status || 'Want',
      shipped_to: input.shippedTo || null,
      shipping_cost: input.shippingCost || null,
      handling_fee: input.handlingFee || null,
      category: input.category || null,
    })
    .select('*')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/tracker')
  return { ok: true, data: rowToItem(data as ItemRow) }
}

export async function updateItem(
  input: ItemUpdate,
): Promise<ActionResult<PurchaseItem>> {
  const auth = await requireUser()
  if (!auth.ok) return { ok: false, error: auth.error }

  if (!input.id) {
    return { ok: false, error: 'Item id is required.' }
  }

  const patch = itemToRowPatch(input)
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Nothing to update.' }
  }

  const { data, error } = await auth.supabase
    .from('items')
    .update(patch)
    .eq('id', input.id)
    .eq('user_id', auth.user.id)
    .select('*')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/tracker')
  return { ok: true, data: rowToItem(data as ItemRow) }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const auth = await requireUser()
  if (!auth.ok) return { ok: false, error: auth.error }

  const { error } = await auth.supabase
    .from('items')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/tracker')
  return { ok: true, data: undefined }
}
