'use client'

import type { Dispatch, SetStateAction } from 'react'

export function FilterDropdown({
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
