'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured, itemToRowPatch, rowToItem } from '@/lib/items'
import type { ItemInsert, ItemRow, PurchaseItem, ItemUpdate } from '@/lib/types'

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

  // Phase 1 will enforce FREE_ITEM_LIMIT here for free-plan users.

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
