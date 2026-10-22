import type { ItemRow, PurchaseItem, Status, Store } from './types'
import { STORES, STATUS } from './constants'

export function totalCost(
  item: Pick<PurchaseItem, 'price' | 'shippingCost' | 'handlingFee'>,
) {
  return (
    (parseFloat(item.price) || 0) +
    (parseFloat(item.shippingCost) || 0) +
    (parseFloat(item.handlingFee) || 0)
  )
}

export function catColor(cat: string, allCats: string[], colors: string[]) {
  const i = allCats.indexOf(cat)
  return colors[i % colors.length] || '#888'
}

function asStore(value: string): Store {
  return (STORES.includes(value as Store) ? value : 'Other') as Store
}

function asStatus(value: string): Status {
  return (STATUS.includes(value as Status) ? value : 'Want') as Status
}

export function rowToItem(row: ItemRow): PurchaseItem {
  return {
    id: row.id,
    name: row.name,
    store: asStore(row.store),
    price: row.price ?? '',
    url: row.url ?? '',
    notes: row.notes ?? '',
    image: row.image ?? '',
    status: asStatus(row.status),
    shippedTo: row.shipped_to ?? '',
    shippingCost: row.shipping_cost ?? '',
    handlingFee: row.handling_fee ?? '',
    category: row.category ?? '',
  }
}

export function itemToRowPatch(item: Partial<PurchaseItem>) {
  const patch: Record<string, string | null> = {}
  if (item.name !== undefined) patch.name = item.name
  if (item.store !== undefined) patch.store = item.store
  if (item.price !== undefined) patch.price = item.price || null
  if (item.url !== undefined) patch.url = item.url || null
  if (item.notes !== undefined) patch.notes = item.notes || null
  if (item.image !== undefined) patch.image = item.image || null
  if (item.status !== undefined) patch.status = item.status
  if (item.shippedTo !== undefined) patch.shipped_to = item.shippedTo || null
  if (item.shippingCost !== undefined)
    patch.shipping_cost = item.shippingCost || null
  if (item.handlingFee !== undefined)
    patch.handling_fee = item.handlingFee || null
  if (item.category !== undefined) patch.category = item.category || null
  return patch
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
