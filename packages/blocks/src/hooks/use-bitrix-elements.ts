'use client'

import * as React from 'react'

export type BitrixElement = {
  id: string
  name: string
  previewPicture: { src: string } | null
  detailPicture:  { src: string } | null
  properties: Record<string, { value: unknown }>
}

type Conn = { siteUrl: string; connectorPath: string; apiKey?: string }

function getConn(overrides?: Partial<Conn> | null): Conn | null {
  const siteUrl = overrides?.siteUrl || (typeof window !== 'undefined' ? localStorage.getItem('randee-cms-site-url')?.trim() : '') || ''
  if (!siteUrl) return null
  return {
    siteUrl,
    connectorPath: overrides?.connectorPath || localStorage.getItem('randee-cms-connector-path')?.trim() || '/local/modules/randee.connector/tools/connector.php',
    apiKey: overrides?.apiKey || localStorage.getItem('randee-cms-api-key')?.trim() || undefined,
  }
}

function makeUrl(conn: Conn, params: Record<string, string>): string {
  const u = new URL(conn.siteUrl.replace(/\/$/, '') + conn.connectorPath)
  if (conn.apiKey) u.searchParams.set('api_key', conn.apiKey)
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v))
  return u.toString()
}

/** Загружает элементы инфоблока Bitrix со свойствами */
export function useBitrixElements(
  iblockId: string | undefined,
  connOverride?: Partial<Conn> | null,
): BitrixElement[] | null {
  const [items, setItems] = React.useState<BitrixElement[] | null>(null)

  React.useEffect(() => {
    const id = iblockId?.trim() || (typeof window !== 'undefined' ? localStorage.getItem('randee-cms-selected-iblock-id')?.trim() : '') || ''
    const conn = getConn(connOverride)
    if (!id || !conn) { setItems(null); return }

    let dead = false

    async function load() {
      try {
        // Сначала пробуем withProperties=true (обновлённый коннектор)
        const res  = await fetch(makeUrl(conn!, { action: 'elements.list', iblockId: id, limit: '50', withProperties: 'true' }))
        const json = (await res.json()) as { ok: boolean; data?: Record<string, unknown>[] }
        if (!json.ok || !json.data) return

        let rows = json.data

        // Fallback: старый коннектор — грузим свойства отдельно
        if (!('properties' in (rows[0] ?? {}))) {
          rows = await Promise.all(rows.map(async (el) => {
            try {
              const r = await fetch(makeUrl(conn!, { action: 'element.get', iblockId: id, elementId: String(el.id) }))
              const d = (await r.json()) as { ok: boolean; data?: { element: Record<string, unknown>; properties: unknown } }
              if (d.ok && d.data) return { ...d.data.element, properties: d.data.properties ?? {} }
            } catch { /* skip */ }
            return el
          }))
        }

        const origin = conn!.siteUrl.replace(/\/$/, '')
        if (!dead) setItems(rows.map(r => normalise(r, origin)))
      } catch { if (!dead) setItems(null) }
    }
    void load()
    return () => { dead = true }
  }, [iblockId, connOverride])

  return items
}

function normalise(raw: Record<string, unknown>, origin: string): BitrixElement {
  const abs = (url: string) => url.startsWith('http') ? url : `${origin}${url}`

  const props = (raw.properties ?? {}) as Record<string, unknown>
  const normalised: Record<string, { value: unknown }> = {}
  for (const [code, val] of Object.entries(props)) {
    const v = (val as Record<string, unknown>)?.value ?? (val as Record<string, unknown>)?.VALUE ?? val
    // Если значение — объект с path/src — достраиваем до абсолютного URL
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>
      if (typeof o.path === 'string' && o.path) o.path = abs(o.path)
      if (typeof o.src  === 'string' && o.src)  o.src  = abs(o.src)
    }
    normalised[code] = { value: v }
  }
  return {
    id:             String(raw.id ?? ''),
    name:           String(raw.name ?? raw.NAME ?? ''),
    previewPicture: toFileObj(raw.previewPicture ?? raw.PREVIEW_PICTURE, origin),
    detailPicture:  toFileObj(raw.detailPicture  ?? raw.DETAIL_PICTURE,  origin),
    properties:     normalised,
  }
}

function toFileObj(v: unknown, origin = ''): { src: string } | null {
  if (!v) return null
  const abs = (s: string) => s.startsWith('http') ? s : `${origin}${s}`
  if (typeof v === 'string') return { src: abs(v) }
  const o = v as Record<string, unknown>
  const url = typeof o.src  === 'string' ? o.src  :
              typeof o.path === 'string' ? o.path : null
  return url ? { src: abs(url) } : null
}
