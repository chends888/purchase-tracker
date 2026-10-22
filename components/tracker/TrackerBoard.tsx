'use client'

import { useState, useTransition } from 'react'
import type { ItemInsert, PurchaseItem } from '@/lib/types'
import { DEFAULT_CATEGORIES, STATUS, STATUS_COLORS } from '@/lib/constants'
import { totalCost } from '@/lib/items'
import {
  createItem,
  deleteItem,
  updateItem,
} from '@/lib/actions/items'
import { signOut } from '@/lib/actions/auth'
import { ItemCard } from './ItemCard'
import { AddModal } from './AddModal'
import { FilterDropdown } from './FilterDropdown'

export function TrackerBoard({
  initialItems,
  userEmail,
  loadError,
}: {
  initialItems: PurchaseItem[]
  userEmail: string | null
  loadError?: string | null
}) {
  const [items, setItems] = useState<PurchaseItem[]>(initialItems)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')
  const [storeFilter, setStoreFilter] = useState('All')
  const [catFilter, setCatFilter] = useState('All')
  const [forwarderFilter, setForwarderFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(loadError ?? null)
  const [saving, setSaving] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

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

  const addItem = async (input: ItemInsert) => {
    setSaving(true)
    setError(null)
    const result = await createItem(input)
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setItems((prev) => [result.data, ...prev])
    setShowModal(false)
  }

  const removeItem = (id: string) => {
    const prev = items
    setItems((cur) => cur.filter((i) => i.id !== id))
    setPendingId(id)
    startTransition(async () => {
      const result = await deleteItem(id)
      setPendingId(null)
      if (!result.ok) {
        setItems(prev)
        setError(result.error)
      }
    })
  }

  const patchItem = (updated: PurchaseItem) => {
    const prev = items
    setItems((cur) => cur.map((i) => (i.id === updated.id ? updated : i)))
    setPendingId(updated.id)
    startTransition(async () => {
      const result = await updateItem(updated)
      setPendingId(null)
      if (!result.ok) {
        setItems(prev)
        setError(result.error)
        return
      }
      setItems((cur) =>
        cur.map((i) => (i.id === result.data.id ? result.data : i)),
      )
    })
  }

  const filtered = items.filter((i) => {
    if (statusFilter !== 'All' && i.status !== statusFilter) return false
    if (storeFilter !== 'All' && i.store !== storeFilter) return false
    if (catFilter !== 'All' && i.category !== catFilter) return false
    if (forwarderFilter !== 'All' && i.shippedTo !== forwarderFilter) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  const grandTotal = filtered.reduce((s, i) => s + totalCost(i), 0)
  const activeFilters = [
    statusFilter,
    storeFilter,
    catFilter,
    forwarderFilter,
  ].filter((f) => f !== 'All').length

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
              {userEmail ?? 'your purchase tracker'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <form action={signOut}>
              <button
                type="submit"
                style={{
                  background: 'transparent',
                  border: '1.5px solid #3A3020',
                  borderRadius: 12,
                  padding: '10px 16px',
                  color: '#AAA',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Log out
              </button>
            </form>
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
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 60px' }}>
        {error && (
          <div
            style={{
              background: '#FFF5F5',
              border: '1.5px solid #FBDADA',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#E05050',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#E05050',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
              }}
            >
              Dismiss
            </button>
          </div>
        )}

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
                    statusFilter === s
                      ? '2px solid #F5A623'
                      : '1.5px solid #EDE9E0',
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
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
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
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
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
                onDelete={removeItem}
                onUpdate={patchItem}
                allCategories={allCategories}
                busy={pendingId === item.id}
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
          saving={saving}
        />
      )}
    </div>
  )
}
