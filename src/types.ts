export type Status = 'Want' | 'Ordered' | 'Delivered'

export type Store =
  | 'Amazon'
  | 'Target'
  | 'IKEA'
  | 'Etsy'
  | 'eBay'
  | 'Other'

export interface PurchaseItem {
  id: number
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
