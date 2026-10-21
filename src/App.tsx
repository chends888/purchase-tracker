import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { PurchaseItem, Status, Store } from './types'

const STORES: Store[] = ['Amazon', 'Target', 'IKEA', 'Etsy', 'eBay', 'Other']
const STATUS: Status[] = ['Want', 'Ordered', 'Delivered']
const DEFAULT_CATEGORIES = [
  'TCG Card',
  'Action Figure',
  'Clothing',
  'Electronics',
  'Books',
  'Home',
  'Other',
]

const STATUS_COLORS: Record<Status, { bg: string; text: string; dot: string }> = {
  Want: { bg: '#FFF3DC', text: '#B07800', dot: '#F5A623' },
  Ordered: { bg: '#DCF0FF', text: '#005FA3', dot: '#3B9EE8' },
  Delivered: { bg: '#DCFFF0', text: '#007A40', dot: '#2CC97A' },
}

const STORE_EMOJIS: Record<Store, string> = {
  Amazon: '📦',
  Target: '🎯',
  IKEA: '🏠',
  Etsy: '🎨',
  eBay: '🏷️',
  Other: '🛒',
}

const CAT_COLORS = [
  '#F5A623',
  '#3B9EE8',
  '#2CC97A',
  '#E05080',
  '#6B4FCE',
  '#E8851A',
  '#888',
]

const LS_KEY = 'purchase-tracker.items.v1'

const SEED_ITEMS: PurchaseItem[] = [
  {
    id: 1,
    name: 'Ergonomic Desk Chair',
    store: 'Amazon',
    price: '289.99',
    url: 'https://amazon.com',
    notes: 'Black, lumbar support',
    image: '',
    status: 'Ordered',
    shippedTo: 'Miami Box',
    shippingCost: '35.00',
    handlingFee: '5.00',
    category: 'Home',
  },
  {
    id: 2,
    name: 'Charizard VMAX PSA 10',
    store: 'eBay',
    price: '180.00',
    url: '',
    notes: 'CGC graded',
    image: '',
    status: 'Want',
    shippedTo: '',
    shippingCost: '',
    handlingFee: '',
    category: 'TCG Card',
  },
  {
    id: 3,
    name: 'KALLAX Shelf Unit',
    store: 'IKEA',
    price: '139.00',
    url: '',
    notes: '4x4, white',
    image: '',
    status: 'Delivered',
    shippedTo: 'John',
    shippingCost: '28.00',
    handlingFee: '',
    category: 'Home',
  },
  {
    id: 4,
    name: 'Neon Genesis Evangelion Unit-01',
    store: 'Etsy',
    price: '65.00',
    url: '',
    notes: 'Limited edition resin',
    image: '',
    status: 'Ordered',
    shippedTo: 'Miami Box',
    shippingCost: '12.00',
    handlingFee: '3.00',
    category: 'Action Figure',
  },
]

function loadItems(): PurchaseItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return SEED_ITEMS
    const parsed = JSON.parse(raw) as PurchaseItem[]
    if (!Array.isArray(parsed)) return SEED_ITEMS
    return parsed
  } catch {
    return SEED_ITEMS
  }
}

function totalCost(item: Pick<PurchaseItem, 'price' | 'shippingCost' | 'handlingFee'>) {
  return (
    (parseFloat(item.price) || 0) +
    (parseFloat(item.shippingCost) || 0) +
    (parseFloat(item.handlingFee) || 0)
  )
}

function catColor(cat: string, allCats: string[]) {
  const i = allCats.indexOf(cat)
  return CAT_COLORS[i % CAT_COLORS.length] || '#888'
}

const IS = (extra: CSSProperties = {}): CSSProperties => ({
  width: '100%',
  border: '1.5px solid #EDE9E0',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  color: '#1A1208',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FAFAF8',
  transition: 'border-color 0.15s',
  ...extra,
})

const LS: CSSProperties = {
  display: 'block',
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  color: '#AAA',
  letterSpacing: 0.5,
  marginBottom: 4,
  textTransform: 'uppercase',
}

function fi(el: HTMLElement, color = '#F5A623') {
  el.style.borderColor = color
}
function fo(el: HTMLElement) {
  el.style.borderColor = '#EDE9E0'
}

async function fetchOgImage(url: string) {
  if (!url || !url.startsWith('http')) return null
  try {
    const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`
    const res = await fetch(proxy, { signal: AbortSignal.timeout(6000) })
    const html = await res.text()
    const match =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      )
    return match ? match[1] : null
  } catch {
    return null
  }
}

function ItemCard({
  item,
  onDelete,
  onUpdate,
  allCategories,
}: {
  item: PurchaseItem
  onDelete: (id: number) => void
  onUpdate: (item: PurchaseItem) => void
  allCategories: string[]
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)
  const [fetchingImg, setFetchingImg] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef(draft)

  draftRef.current = draft

  const set = <K extends keyof PurchaseItem>(k: K, v: PurchaseItem[K]) => {
    const next = { ...draftRef.current, [k]: v }
    draftRef.current = next
    setDraft(next)
    onUpdate(next)
  }

  const closeEdit = () => setEditing(false)

  useEffect(() => {
    if (!editing) return
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) closeEdit()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing])

  useEffect(() => {
    if (!editing) setDraft(item)
  }, [item, editing])

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('image', String(ev.target?.result ?? ''))
    reader.readAsDataURL(file)
  }

  const handleUrlBlur = async (url: string) => {
    if (!url || draft.image) return
    setFetchingImg(true)
    const img = await fetchOgImage(url)
    setFetchingImg(false)
    if (img) set('image', img)
  }

  const cur = editing ? draft : item
  const total = totalCost(cur)
  const cc = catColor(cur.category, allCategories)

  return (
    <div
      ref={cardRef}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: editing ? 'column' : 'row',
        border: editing ? '2px solid #F5A623' : '1px solid #F0EDE8',
        boxShadow: editing
          ? '0 8px 32px rgba(0,0,0,0.13)'
          : '0 1px 6px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
      }}
    >
      {editing ? (
        draft.image ? (
          <div
            style={{
              width: '100%',
              height: 120,
              overflow: 'hidden',
              background: '#F7F5F2',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <img
              src={draft.image}
              alt={draft.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0,0,0,0.55)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 11,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              📷 Change
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%',
              height: 70,
              background: 'linear-gradient(135deg, #FFF8F0 0%, #F7F2E8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              cursor: 'pointer',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {fetchingImg ? (
              <span
                style={{
                  fontSize: 12,
                  color: '#CCC',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                fetching image…
              </span>
            ) : (
              STORE_EMOJIS[draft.store] || '🛒'
            )}
            {!fetchingImg && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 10,
                  fontSize: 10,
                  color: '#CCC',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                click to upload
              </span>
            )}
          </div>
        )
      ) : (
        <div
          style={{
            width: 80,
            flexShrink: 0,
            alignSelf: 'stretch',
            background: cur.image
              ? '#F7F5F2'
              : 'linear-gradient(160deg, #FFF8F0, #EDE5D8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {cur.image ? (
            <img
              src={cur.image}
              alt={cur.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ fontSize: 28 }}>{STORE_EMOJIS[cur.store] || '🛒'}</span>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {editing && (
        <button
          type="button"
          onClick={closeEdit}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            zIndex: 2,
          }}
        >
          ✕
        </button>
      )}

      <div
        style={{
          padding: editing ? '12px 14px 14px' : '10px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: editing ? 10 : 6,
          minWidth: 0,
        }}
      >
        {editing ? (
          <>
            <div>
              <label style={LS}>Item Name</label>
              <input
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Item name"
                style={IS()}
                onFocus={(e) => fi(e.target)}
                onBlur={(e) => fo(e.target)}
              />
            </div>

            <div>
              <label style={LS}>Product URL</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={draft.url}
                  onChange={(e) => set('url', e.target.value)}
                  onBlur={(e) => {
                    fo(e.target)
                    void handleUrlBlur(e.target.value)
                  }}
                  placeholder="https://…"
                  type="url"
                  style={IS()}
                  onFocus={(e) => fi(e.target)}
                />
                {fetchingImg && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 10,
                      color: '#CCC',
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    …
                  </span>
                )}
              </div>
              {!draft.image && draft.url && !fetchingImg && (
                <div
                  style={{
                    fontSize: 10,
                    color: '#BBB',
                    fontFamily: "'DM Mono', monospace",
                    marginTop: 3,
                  }}
                >
                  tab out to auto-fetch image
                </div>
              )}
            </div>

            <div>
              <label style={LS}>Notes</label>
              <input
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Notes…"
                style={IS()}
                onFocus={(e) => fi(e.target)}
                onBlur={(e) => fo(e.target)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={LS}>Store</label>
                <select
                  value={draft.store}
                  onChange={(e) => set('store', e.target.value as Store)}
                  style={IS({ cursor: 'pointer' })}
                >
                  {STORES.map((s) => (
                    <option key={s} value={s}>
                      {STORE_EMOJIS[s]} {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LS}>Category</label>
                <select
                  value={draft.category || ''}
                  onChange={(e) => set('category', e.target.value)}
                  style={IS({ cursor: 'pointer' })}
                >
                  <option value="">— none —</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{ background: '#FAF8F5', borderRadius: 10, padding: '10px' }}
            >
              <div style={{ ...LS, marginBottom: 8 }}>💰 Costs</div>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}
              >
                {(
                  [
                    ['price', 'Price'],
                    ['shippingCost', 'Shipping'],
                    ['handlingFee', 'Handling'],
                  ] as const
                ).map(([k, l]) => (
                  <div key={k}>
                    <label style={{ ...LS, fontSize: 9 }}>{l} ($)</label>
                    <input
                      type="number"
                      value={draft[k]}
                      onChange={(e) => set(k, e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={IS({ padding: '6px 8px', fontSize: 12 })}
                      onFocus={(e) => fi(e.target)}
                      onBlur={(e) => fo(e.target)}
                    />
                  </div>
                ))}
              </div>
              {totalCost(draft) > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    textAlign: 'right',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#B07800',
                  }}
                >
                  ${totalCost(draft).toFixed(2)}
                </div>
              )}
            </div>

            <div>
              <label style={LS}>✈️ Shipped To / Forwarder</label>
              <input
                value={draft.shippedTo}
                onChange={(e) => set('shippedTo', e.target.value)}
                placeholder="e.g. Miami Box, John…"
                style={IS()}
                onFocus={(e) => fi(e.target, '#6B4FCE')}
                onBlur={(e) => fo(e.target)}
              />
            </div>

            <div>
              <label style={LS}>Status</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {STATUS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => set('status', s)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: 8,
                      border:
                        draft.status === s
                          ? '2px solid #F5A623'
                          : '1.5px solid #EDE9E0',
                      background: draft.status === s ? '#FFF8EC' : '#FAFAF8',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 10,
                      color: draft.status === s ? '#B07800' : '#888',
                      cursor: 'pointer',
                      fontWeight: draft.status === s ? 700 : 400,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              style={{
                width: '100%',
                padding: '7px 0',
                borderRadius: 10,
                border: '1.5px solid #FBDADA',
                background: '#FFF5F5',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#E05050',
                cursor: 'pointer',
                marginTop: 2,
              }}
            >
              Delete item
            </button>
          </>
        ) : (
          <>
            {cur.url ? (
              <a
                href={cur.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#1A1208',
                  lineHeight: 1.3,
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#B07800'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#1A1208'
                }}
              >
                {cur.name}
              </a>
            ) : (
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#1A1208',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {cur.name}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#B07800',
                }}
              >
                {total > 0 ? `$${total.toFixed(2)}` : '—'}
              </span>
              {cur.category && (
                <span
                  style={{
                    background: cc + '22',
                    color: cc,
                    borderRadius: 6,
                    padding: '1px 7px',
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cur.category}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 'auto',
              }}
            >
              {STATUS.map((s) => {
                const c = STATUS_COLORS[s]
                const active = cur.status === s
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => onUpdate({ ...item, status: s })}
                    style={{
                      padding: '2px 7px',
                      borderRadius: 20,
                      border: active
                        ? `1.5px solid ${c.dot}`
                        : '1.5px solid #EDE9E0',
                      background: active ? c.bg : 'transparent',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      fontWeight: active ? 700 : 400,
                      color: active ? c.text : '#CCC',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  setDraft(item)
                  setEditing(true)
                }}
                style={{
                  marginLeft: 'auto',
                  background: '#FFF8EC',
                  border: '1.5px solid #F5D98A',
                  cursor: 'pointer',
                  color: '#B07800',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                ✏️
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AddModal({
  onClose,
  onAdd,
  allCategories,
}: {
  onClose: () => void
  onAdd: (item: PurchaseItem) => void
  allCategories: string[]
}) {
  const [form, setForm] = useState({
    name: '',
    store: 'Amazon' as Store,
    price: '',
    url: '',
    notes: '',
    image: '',
    status: 'Want' as Status,
    shippedTo: '',
    shippingCost: '',
    handlingFee: '',
    category: '',
  })
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [newCat, setNewCat] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('image', String(ev.target?.result ?? ''))
    reader.readAsDataURL(file)
  }

  const handleAdd = () => {
    if (!form.name.trim()) return
    onAdd({ ...form, id: Date.now() })
    onClose()
  }

  const previewTotal =
    (parseFloat(form.price) || 0) +
    (parseFloat(form.shippingCost) || 0) +
    (parseFloat(form.handlingFee) || 0)

  const MI: CSSProperties = {
    width: '100%',
    border: '1.5px solid #EDE9E0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: '#1A1208',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#FAFAF8',
  }
  const ML: CSSProperties = {
    display: 'block',
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,14,5,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 500,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 800,
            color: '#1A1208',
            marginBottom: 24,
          }}
        >
          Add Purchase
        </div>

        {(
          [
            ['Item Name *', 'name', 'text', 'e.g. Standing desk lamp'],
            ['Product URL', 'url', 'url', 'https://...'],
            ['Notes', 'notes', 'text', 'Size, color, any notes...'],
          ] as const
        ).map(([l, k, t, p]) => (
          <div key={k} style={{ marginBottom: 16 }}>
            <label style={ML}>{l}</label>
            <input
              type={t}
              value={form[k]}
              onChange={(e) => set(k, e.target.value)}
              placeholder={p}
              style={MI}
              onFocus={(e) => {
                e.target.style.borderColor = '#F5A623'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#EDE9E0'
              }}
            />
          </div>
        ))}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={ML}>Store</label>
            <select
              value={form.store}
              onChange={(e) => set('store', e.target.value as Store)}
              style={{ ...MI, cursor: 'pointer' }}
            >
              {STORES.map((s) => (
                <option key={s} value={s}>
                  {STORE_EMOJIS[s]} {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={ML}>Category</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              style={{ ...MI, cursor: 'pointer' }}
            >
              <option value="">— none —</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Or type a new category…"
            style={{ ...MI, flex: 1, fontSize: 13 }}
            onFocus={(e) => {
              e.target.style.borderColor = '#F5A623'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#EDE9E0'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCat.trim()) {
                set('category', newCat.trim())
                setNewCat('')
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (newCat.trim()) {
                set('category', newCat.trim())
                setNewCat('')
              }
            }}
            style={{
              padding: '0 16px',
              borderRadius: 10,
              border: '1.5px solid #EDE9E0',
              background: '#FAFAF8',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: '#888',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Use
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={ML}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => set('status', s)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 10,
                  border:
                    form.status === s ? '2px solid #F5A623' : '1.5px solid #EDE9E0',
                  background: form.status === s ? '#FFF8EC' : '#FAFAF8',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: form.status === s ? '#B07800' : '#888',
                  cursor: 'pointer',
                  fontWeight: form.status === s ? 700 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: '#FAF8F5',
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: '#AAA',
              letterSpacing: 0.5,
              marginBottom: 12,
              textTransform: 'uppercase',
            }}
          >
            💰 Cost Breakdown
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}
          >
            {(
              [
                ['Item Price ($)', 'price'],
                ['Shipping ($)', 'shippingCost'],
                ['Handling ($)', 'handlingFee'],
              ] as const
            ).map(([l, k]) => (
              <div key={k}>
                <label style={{ ...ML, fontSize: 10 }}>{l}</label>
                <input
                  type="number"
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{ ...MI, padding: '8px 10px', fontSize: 13 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#F5A623'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EDE9E0'
                  }}
                />
              </div>
            ))}
          </div>
          {previewTotal > 0 && (
            <div
              style={{
                marginTop: 10,
                textAlign: 'right',
                fontFamily: "'DM Mono', monospace",
                fontSize: 15,
                fontWeight: 700,
                color: '#B07800',
              }}
            >
              ${previewTotal.toFixed(2)}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={ML}>✈️ Shipped To (person / forwarder)</label>
          <input
            type="text"
            value={form.shippedTo}
            onChange={(e) => set('shippedTo', e.target.value)}
            placeholder="e.g. John, Miami Box…"
            style={MI}
            onFocus={(e) => {
              e.target.style.borderColor = '#6B4FCE'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#EDE9E0'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={ML}>Image</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['url', 'upload'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setImageMode(m)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border:
                    imageMode === m ? '2px solid #F5A623' : '1.5px solid #EDE9E0',
                  background: imageMode === m ? '#FFF8EC' : '#FAFAF8',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: imageMode === m ? '#B07800' : '#888',
                  cursor: 'pointer',
                }}
              >
                {m === 'url' ? '🔗 URL' : '📁 Upload'}
              </button>
            ))}
          </div>
          {imageMode === 'url' ? (
            <input
              type="url"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              placeholder="https://..."
              style={MI}
            />
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed #EDE9E0',
                borderRadius: 10,
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#FAFAF8',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              {form.image && imageMode === 'upload' ? (
                <img src={form.image} alt="" style={{ maxHeight: 80, borderRadius: 8 }} />
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: '#AAA',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Click to upload image
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: '1.5px solid #EDE9E0',
              background: '#FAFAF8',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#888',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            style={{
              flex: 2,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #F5A623 0%, #E8851A 100%)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(245,166,35,0.35)',
            }}
          >
            Add Item
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
}: {
  label: string
  value: string
  onChange: Dispatch<SetStateAction<string>> | ((v: string) => void)
  options: string[]
  allLabel?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: value !== allLabel ? '2px solid #F5A623' : '1.5px solid #EDE9E0',
        borderRadius: 10,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
        background: value !== allLabel ? '#FFF8EC' : '#fff',
        color: value !== allLabel ? '#B07800' : '#666',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <option value={allLabel}>
        {label}: All
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

export default function App() {
  const [items, setItems] = useState<PurchaseItem[]>(loadItems)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [storeFilter, setStoreFilter] = useState('All')
  const [catFilter, setCatFilter] = useState('All')
  const [forwarderFilter, setForwarderFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  }, [items])

  const allCategories = [
    ...new Set([
      ...DEFAULT_CATEGORIES,
      ...items.map((i) => i.category).filter(Boolean),
    ]),
  ]
  const usedStores = [...new Set(items.map((i) => i.store))]
  const usedForwarders = [
    ...new Set(items.map((i) => i.shippedTo).filter(Boolean)),
  ]
  const usedCategories = [
    ...new Set(items.map((i) => i.category).filter(Boolean)),
  ]

  const addItem = (item: PurchaseItem) => setItems((prev) => [item, ...prev])
  const deleteItem = (id: number) =>
    setItems((prev) => prev.filter((i) => i.id !== id))
  const updateItem = (updated: PurchaseItem) =>
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))

  const filtered = items.filter((i) => {
    if (statusFilter !== 'All' && i.status !== statusFilter) return false
    if (storeFilter !== 'All' && i.store !== storeFilter) return false
    if (catFilter !== 'All' && i.category !== catFilter) return false
    if (forwarderFilter !== 'All' && i.shippedTo !== forwarderFilter) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grandTotal = filtered.reduce((s, i) => s + totalCost(i), 0)
  const activeFilters = [statusFilter, storeFilter, catFilter, forwarderFilter].filter(
    (f) => f !== 'All',
  ).length

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F4',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: '#1A1208',
          padding: '24px 32px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 26,
                fontWeight: 900,
                color: '#F5A623',
                letterSpacing: -0.5,
              }}
            >
              🛍 Purchase tracker
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#555',
                marginTop: 2,
              }}
            >
              your purchase tracker
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #E8851A 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '11px 22px',
              color: '#fff',
              fontFamily: "'DM Mono', monospace",
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
            }}
          >
            + Add Item
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 60px' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            style={{
              border: '1.5px solid #EDE9E0',
              borderRadius: 10,
              padding: '9px 14px',
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
              background: '#fff',
              outline: 'none',
              flex: '1 1 180px',
              color: '#1A1208',
              minWidth: 140,
            }}
          />

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...STATUS].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '8px 13px',
                  borderRadius: 10,
                  border:
                    statusFilter === s ? '2px solid #F5A623' : '1.5px solid #EDE9E0',
                  background: statusFilter === s ? '#FFF8EC' : '#fff',
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  color: statusFilter === s ? '#B07800' : '#888',
                  cursor: 'pointer',
                  fontWeight: statusFilter === s ? 700 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {usedStores.length > 0 && (
            <FilterDropdown
              label="Store"
              value={storeFilter}
              onChange={setStoreFilter}
              options={usedStores}
            />
          )}
          {usedCategories.length > 0 && (
            <FilterDropdown
              label="Category"
              value={catFilter}
              onChange={setCatFilter}
              options={usedCategories}
            />
          )}
          {usedForwarders.length > 0 && (
            <FilterDropdown
              label="Forwarder"
              value={forwarderFilter}
              onChange={setForwarderFilter}
              options={usedForwarders}
            />
          )}

          {(activeFilters > 0 || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('All')
                setStoreFilter('All')
                setCatFilter('All')
                setForwarderFilter('All')
                setSearch('')
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1.5px solid #FBDADA',
                background: '#FFF5F5',
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: '#E05050',
                cursor: 'pointer',
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {filtered.length > 0 && (
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '11px 18px',
              marginBottom: 20,
              display: 'flex',
              gap: 20,
              border: '1px solid #F0EDE8',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {STATUS.map((s) => {
              const grp = filtered.filter((i) => i.status === s)
              const sum = grp.reduce((a, i) => a + totalCost(i), 0)
              const c = STATUS_COLORS[s]
              return (
                <div
                  key={s}
                  style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: c.dot,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 11,
                      color: '#999',
                    }}
                  >
                    {s}:
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: c.text,
                    }}
                  >
                    {grp.length} · ${sum.toFixed(2)}
                  </span>
                </div>
              )
            })}
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              {(() => {
                const totalShipping = filtered.reduce(
                  (s, i) => s + (parseFloat(i.shippingCost) || 0),
                  0,
                )
                const totalHandling = filtered.reduce(
                  (s, i) => s + (parseFloat(i.handlingFee) || 0),
                  0,
                )
                return (
                  <>
                    {totalShipping > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            color: '#BBB',
                          }}
                        >
                          Shipping
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#3B9EE8',
                          }}
                        >
                          ${totalShipping.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {totalHandling > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            color: '#BBB',
                          }}
                        >
                          Handling
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#E8851A',
                          }}
                        >
                          ${totalHandling.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        borderLeft: '1px solid #EDE9E0',
                        paddingLeft: 16,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                          color: '#999',
                        }}
                      >
                        Grand Total
                      </span>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 14,
                          color: '#1A1208',
                          fontWeight: 800,
                        }}
                      >
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#CCC',
              fontFamily: "'Fraunces', serif",
              fontSize: 20,
            }}
          >
            No items found.
            <br />
            <span
              style={{
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: '#BBB',
                marginTop: 8,
                display: 'block',
              }}
            >
              {activeFilters > 0 || search
                ? 'Try clearing your filters.'
                : 'Hit "+ Add Item" to start.'}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 8,
            }}
          >
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={deleteItem}
                onUpdate={updateItem}
                allCategories={allCategories}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddModal
          onClose={() => setShowModal(false)}
          onAdd={addItem}
          allCategories={allCategories}
        />
      )}
    </div>
  )
}
