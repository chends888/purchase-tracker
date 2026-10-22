import type { Status, Store } from './types'

export const STORES: Store[] = ['Amazon', 'Target', 'IKEA', 'Etsy', 'eBay', 'Other']
export const STATUS: Status[] = ['Want', 'Ordered', 'Delivered']
export const DEFAULT_CATEGORIES = [
  'TCG Card',
  'Action Figure',
  'Clothing',
  'Electronics',
  'Books',
  'Home',
  'Other',
]

export const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> = {
  Want: { bg: '#FFF3DC', text: '#B07800', dot: '#F5A623' },
  Ordered: { bg: '#DCF0FF', text: '#005FA3', dot: '#3B9EE8' },
  Delivered: { bg: '#DCFFF0', text: '#007A40', dot: '#2CC97A' },
}

export const STORE_EMOJIS: Record<Store, string> = {
  Amazon: '📦',
  Target: '🎯',
  IKEA: '🏠',
  Etsy: '🎨',
  eBay: '🏷️',
  Other: '🛒',
}

export const CAT_COLORS = [
  '#F5A623',
  '#3B9EE8',
  '#2CC97A',
  '#E05080',
  '#6B4FCE',
  '#E8851A',
  '#888',
]

// Phase 1: enforce this server-side + in the UI.
// export const FREE_ITEM_LIMIT = 10
