'use client'

import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import type { PurchaseItem, Status, Store } from '@/lib/types'
import {
  CAT_COLORS,
  STATUS,
  STATUS_COLORS,
  STORE_EMOJIS,
  STORES,
} from '@/lib/constants'
import { catColor, totalCost } from '@/lib/items'
import { fi, fo, fetchOgImage, IS, LS } from './styles'

export function ItemCard({
  item,
  onDelete,
  onUpdate,
  allCategories,
  busy,
}: {
  item: PurchaseItem
  onDelete: (id: string) => void
  onUpdate: (item: PurchaseItem) => void
  allCategories: string[]
  busy?: boolean
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
      if (cardRef.current && !cardRef.current.contains(e.target as Node))
        closeEdit()
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
  const cc = catColor(cur.category, allCategories, CAT_COLORS)

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
        opacity: busy ? 0.7 : 1,
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            // eslint-disable-next-line @next/next/no-img-element
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
            <span style={{ fontSize: 28 }}>
              {STORE_EMOJIS[cur.store] || '🛒'}
            </span>
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

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
            >
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
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 6,
                }}
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
              {STATUS.map((s: Status) => {
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
