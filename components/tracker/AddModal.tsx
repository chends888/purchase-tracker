'use client'

import { useState, useRef, type ChangeEvent, type CSSProperties } from 'react'
import type { ItemInsert, Status, Store } from '@/lib/types'
import { STATUS, STORE_EMOJIS, STORES } from '@/lib/constants'

export function AddModal({
  onClose,
  onAdd,
  allCategories,
  saving,
}: {
  onClose: () => void
  onAdd: (item: ItemInsert) => Promise<void> | void
  allCategories: string[]
  saving?: boolean
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

  const handleAdd = async () => {
    if (!form.name.trim() || saving) return
    await onAdd({ ...form })
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt=""
                  style={{ maxHeight: 80, borderRadius: 8 }}
                />
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
            disabled={saving}
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
            onClick={() => void handleAdd()}
            disabled={saving || !form.name.trim()}
            style={{
              flex: 2,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #F5A623 0%, #E8851A 100%)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              color: '#fff',
              cursor: saving ? 'wait' : 'pointer',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(245,166,35,0.35)',
              opacity: saving || !form.name.trim() ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
