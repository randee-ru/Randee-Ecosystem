'use client'

import * as React from 'react'
import type { BuilderCmsConnection, PageBlock } from '@randee/builder'
import { buildConnectorUrl, isCmsConnectionConfigured } from './builder-cms-utils'

type CmsFieldValue = Record<string, string>

function readFieldFromPayload(
  data: Record<string, unknown>,
  kind: string,
  code: string
): string {
  if (kind === 'property') {
    const props = data.PROPERTIES as Record<string, { VALUE?: unknown }> | undefined
    const raw = props?.[code]?.VALUE
    if (Array.isArray(raw)) return String(raw[0] ?? '')
    return raw !== undefined && raw !== null ? String(raw) : ''
  }
  const direct = data[code]
  if (direct !== undefined && direct !== null) return String(direct)
  return ''
}

export function useCmsPreviewData(
  block: PageBlock | undefined,
  connection: BuilderCmsConnection | undefined
): Record<string, CmsFieldValue> {
  const [values, setValues] = React.useState<Record<string, CmsFieldValue>>({})

  React.useEffect(() => {
    if (!block || block.type !== 'component' || !connection || !isCmsConnectionConfigured(connection)) {
      setValues({})
      return
    }

    let cancelled = false

    async function load() {
      if (!block || !connection) return
      const next: Record<string, CmsFieldValue> = {}

      for (const element of block.elements ?? []) {
        const bindings = element.cmsBindings ?? {}
        const elementValues: CmsFieldValue = {}

        for (const [propKey, state] of Object.entries(bindings)) {
          if (state?.mode !== 'binding' || !state.binding) continue
          const source = state.binding.source
          const field = state.binding.field
          if (!source.iblockId) continue

          try {
            if (source.mode === 'element' && source.elementId) {
              const url = buildConnectorUrl(connection, 'element.get')
              url.searchParams.set('iblockId', source.iblockId)
              url.searchParams.set('elementId', source.elementId)
              const response = await fetch(url.toString())
              const payload = (await response.json().catch(() => ({}))) as {
                ok?: boolean
                data?: Record<string, unknown>
              }
              if (payload.ok && payload.data) {
                const resolved = readFieldFromPayload(payload.data, field.kind, field.code)
                elementValues[propKey] = resolved || state.binding?.fallback || element.props[propKey] || ''
              }
            } else if (source.mode === 'list') {
              const url = buildConnectorUrl(connection, 'elements.list')
              url.searchParams.set('iblockId', source.iblockId)
              url.searchParams.set('limit', '1')
              url.searchParams.set('offset', '0')
              const response = await fetch(url.toString())
              const payload = (await response.json().catch(() => ({}))) as {
                ok?: boolean
                data?: Array<Record<string, unknown>>
              }
              const first = payload.ok && Array.isArray(payload.data) ? payload.data[0] : null
              if (first) {
                const resolved = readFieldFromPayload(first, field.kind, field.code)
                elementValues[propKey] = resolved || state.binding?.fallback || element.props[propKey] || ''
              }
            }
          } catch {
            elementValues[propKey] = state.binding?.fallback || element.props[propKey] || ''
          }
        }

        if (Object.keys(elementValues).length > 0) {
          next[element.id] = elementValues
        }
      }

      if (!cancelled) setValues(next)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [block, connection])

  return values
}
