export type Status = 'Want' | 'Ordered' | 'Delivered'

export type Store =
  | 'Amazon'
  | 'Target'
  | 'IKEA'
  | 'Etsy'
  | 'eBay'
  | 'Other'

export type Plan = 'free' | 'pro'

export interface PurchaseItem {
  id: string
  name: string
  store: Store
  price: string
  url: string
  notes: string
  image: string
  status: Status
  shippedTo: string
  shippingCost: string
  handlingFee: string
  category: string
}

export interface ItemInsert {
  name: string
  store: Store
  price?: string
  url?: string
  notes?: string
  image?: string
  status?: Status
  shippedTo?: string
  shippingCost?: string
  handlingFee?: string
  category?: string
}

export interface ItemUpdate {
  id: string
  name?: string
  store?: Store
  price?: string
  url?: string
  notes?: string
  image?: string
  status?: Status
  shippedTo?: string
  shippingCost?: string
  handlingFee?: string
  category?: string
}

/** Row shape from Supabase `items` table */
export interface ItemRow {
  id: string
  user_id: string
  name: string
  store: string
  price: string | null
  url: string | null
  notes: string | null
  image: string | null
  status: string
  shipped_to: string | null
  shipping_cost: string | null
  handling_fee: string | null
  category: string | null
  created_at: string
  updated_at: string
}
