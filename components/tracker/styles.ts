import type { CSSProperties } from 'react'

export const IS = (extra: CSSProperties = {}): CSSProperties => ({
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

export const LS: CSSProperties = {
  display: 'block',
  fontFamily: "'DM Mono', monospace",
  fontSize: 10,
  color: '#AAA',
  letterSpacing: 0.5,
  marginBottom: 4,
  textTransform: 'uppercase',
}

export function fi(el: HTMLElement, color = '#F5A623') {
  el.style.borderColor = color
}

export function fo(el: HTMLElement) {
  el.style.borderColor = '#EDE9E0'
}

export async function fetchOgImage(url: string) {
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
