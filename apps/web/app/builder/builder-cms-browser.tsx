'use client'

import * as React from 'react'
import { RefreshCw } from 'lucide-react'
import type { BuilderCmsConnection } from '@randee/builder'
import { buildConnectorUrl, isCmsConnectionConfigured } from './builder-cms-utils'

export type CmsBrowserTheme = {
  divider: string
  text: string
  textMuted: string
  inputBg: string
  accent: string
}

type BuilderCmsBrowserProps = {
  connection: BuilderCmsConnection
  t: CmsBrowserTheme
  compact?: boolean
  onSelectField?: (field: { kind: string; code: string; label: string }) => void
}

export function BuilderCmsBrowser({ connection, t, compact, onSelectField }: BuilderCmsBrowserProps) {
  const [iblocks, setIblocks] = React.useState<Array<{ id: string; name: string; code: string; type: string }>>([])
  const [selectedIblockId, setSelectedIblockId] = React.useState<string | null>(null)
  const [iblocksStatus, setIblocksStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [iblocksMessage, setIblocksMessage] = React.useState('')
  const [schemaStatus, setSchemaStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [schemaMessage, setSchemaMessage] = React.useState('')
  const [schemaFields, setSchemaFields] = React.useState<Array<{ kind: string; code: string; label: string }>>([])
  const [elementsStatus, setElementsStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [elementsMessage, setElementsMessage] = React.useState('')
  const [elements, setElements] = React.useState<Array<{ id: string; name: string }>>([])

  React.useEffect(() => {
    try {
      const iblocksRaw = window.localStorage.getItem('randee-cms-iblocks')
      if (iblocksRaw) {
        const parsed = JSON.parse(iblocksRaw) as Array<{ id?: string; name?: string; code?: string; type?: string }>
        setIblocks(parsed.map((item) => ({ id: item.id ?? '', name: item.name ?? '', code: item.code ?? '', type: item.type ?? '' })))
      }
      const savedId = window.localStorage.getItem('randee-cms-selected-iblock-id')
      if (savedId) setSelectedIblockId(savedId)
    } catch {
      // ignore
    }
  }, [])

  async function loadIblockSchema(iblockId: string) {
    if (!iblockId) return
    setSchemaStatus('loading')
    setSchemaMessage('Загружаем поля…')
    try {
      const url = buildConnectorUrl(connection, 'iblock.schema')
      url.searchParams.set('iblockId', iblockId)
      const response = await fetch(url.toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: { fields?: Array<{ kind?: string; code?: string; label?: string }> }
      }
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.data?.fields)) {
        setSchemaStatus('error')
        setSchemaMessage(payload.error?.message ?? `HTTP ${response.status}`)
        return
      }
      const fields = payload.data.fields.map((field) => ({
        kind: field.kind ?? '',
        code: field.code ?? '',
        label: field.label ?? field.code ?? ''
      }))
      setSchemaFields(fields)
      try {
        const raw = window.localStorage.getItem('randee-cms-schema-by-iblock-id')
        const current = raw ? (JSON.parse(raw) as Record<string, typeof fields>) : {}
        current[iblockId] = fields
        window.localStorage.setItem('randee-cms-schema-by-iblock-id', JSON.stringify(current))
        window.dispatchEvent(new CustomEvent('randee:cms-cache-updated'))
      } catch {
        // ignore
      }
      setSchemaStatus('ok')
      setSchemaMessage(`Полей: ${fields.length}`)
    } catch (error) {
      setSchemaStatus('error')
      setSchemaMessage(error instanceof Error ? error.message : 'Ошибка schema')
    }
  }

  async function loadIblockElements(iblockId: string) {
    if (!iblockId) return
    setElementsStatus('loading')
    setElementsMessage('Загружаем элементы…')
    try {
      const url = buildConnectorUrl(connection, 'elements.list')
      url.searchParams.set('iblockId', iblockId)
      url.searchParams.set('limit', '20')
      url.searchParams.set('offset', '0')
      const response = await fetch(url.toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: Array<{ id?: string; name?: string }>
      }
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.data)) {
        setElementsStatus('error')
        setElementsMessage(payload.error?.message ?? `HTTP ${response.status}`)
        return
      }
      const loaded = payload.data.map((element) => ({ id: element.id ?? '', name: element.name ?? '' }))
      setElements(loaded)
      try {
        const raw = window.localStorage.getItem('randee-cms-elements-by-iblock-id')
        const current = raw ? (JSON.parse(raw) as Record<string, typeof loaded>) : {}
        current[iblockId] = loaded
        window.localStorage.setItem('randee-cms-elements-by-iblock-id', JSON.stringify(current))
      } catch {
        // ignore
      }
      setElementsStatus('ok')
      setElementsMessage(`Элементов: ${loaded.length}`)
    } catch (error) {
      setElementsStatus('error')
      setElementsMessage(error instanceof Error ? error.message : 'Ошибка elements')
    }
  }

  async function loadIblocks() {
    if (!isCmsConnectionConfigured(connection)) {
      setIblocksStatus('error')
      setIblocksMessage('Настройте подключение CMS (URL, ключ, connector).')
      return
    }

    setIblocksStatus('loading')
    setIblocksMessage('Загружаем инфоблоки…')
    try {
      const response = await fetch(buildConnectorUrl(connection, 'iblocks.list').toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: Array<{ id?: string; name?: string; code?: string; type?: string }>
      }
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.data)) {
        setIblocksStatus('error')
        setIblocksMessage(payload.error?.message ?? `HTTP ${response.status}`)
        return
      }
      const normalized = payload.data.map((item) => ({
        id: item.id ?? '',
        name: item.name ?? '',
        code: item.code ?? '',
        type: item.type ?? ''
      }))
      setIblocks(normalized)
      try {
        window.localStorage.setItem('randee-cms-iblocks', JSON.stringify(normalized))
      } catch {
        // ignore
      }
      if (normalized.length > 0) {
        const firstId = normalized[0]?.id ?? null
        setSelectedIblockId(firstId)
        if (firstId) {
          try {
            window.localStorage.setItem('randee-cms-selected-iblock-id', firstId)
          } catch {
            // ignore
          }
          await Promise.all([loadIblockSchema(firstId), loadIblockElements(firstId)])
        }
      }
      setIblocksStatus('ok')
      setIblocksMessage(`Инфоблоков: ${normalized.length}`)
    } catch (error) {
      setIblocksStatus('error')
      setIblocksMessage(error instanceof Error ? error.message : 'Ошибка загрузки')
    }
  }

  async function selectIblock(iblockId: string) {
    setSelectedIblockId(iblockId)
    try {
      window.localStorage.setItem('randee-cms-selected-iblock-id', iblockId)
      window.dispatchEvent(new CustomEvent('randee:cms-cache-updated'))
    } catch {
      // ignore
    }
    await Promise.all([loadIblockSchema(iblockId), loadIblockElements(iblockId)])
  }

  return (
    <div className={compact ? 'flex flex-col gap-2 p-2' : 'grid gap-3'}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="cms-refresh-iblocks"
          className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-medium"
          style={{ color: t.text, background: t.inputBg, border: `1px solid ${t.divider}` }}
          onClick={() => void loadIblocks()}
          disabled={iblocksStatus === 'loading'}
        >
          <RefreshCw className={`h-3 w-3 ${iblocksStatus === 'loading' ? 'animate-spin' : ''}`} />
          Обновить
        </button>
        <p className="text-[10px]" style={{ color: iblocksStatus === 'error' ? '#ef4444' : t.textMuted }}>
          {iblocksMessage || 'Нажмите «Обновить» после настройки подключения.'}
        </p>
      </div>

      {iblocks.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-md" style={{ border: `1px solid ${t.divider}` }}>
          {iblocks.map((iblock) => (
            <button
              key={`${iblock.id}-${iblock.code}`}
              type="button"
              className="grid w-full grid-cols-[52px_1fr] gap-1 px-2 py-1 text-left text-[10px]"
              style={{
                color: t.text,
                background: selectedIblockId === iblock.id ? `${t.accent}22` : 'transparent',
                cursor: 'pointer',
                borderTopWidth: 0,
                borderTopStyle: 'none',
                borderRightWidth: 0,
                borderRightStyle: 'none',
                borderBottomWidth: 1,
                borderBottomStyle: 'solid',
                borderBottomColor: t.divider,
                borderLeftWidth: 2,
                borderLeftStyle: 'solid',
                borderLeftColor: selectedIblockId === iblock.id ? t.accent : 'transparent'
              }}
              onClick={() => void selectIblock(iblock.id)}
            >
              <span style={{ color: t.textMuted }}>{iblock.id}</span>
              <span className="truncate">{iblock.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className={compact ? 'grid gap-2' : 'grid gap-3 sm:grid-cols-2'}>
        <div className="rounded-lg p-2" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
            Поля
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: schemaStatus === 'error' ? '#ef4444' : t.textMuted }}>
            {schemaMessage}
          </p>
          {schemaFields.length > 0 ? (
            <div className="mt-1 max-h-36 overflow-y-auto rounded-md" style={{ border: `1px solid ${t.divider}` }}>
              {schemaFields.map((field) => (
                <button
                  key={`${field.kind}-${field.code}`}
                  type="button"
                  className="grid w-full grid-cols-[56px_1fr] gap-1 px-2 py-1 text-left text-[10px]"
                  style={{
                    color: t.text,
                    background: 'transparent',
                    cursor: onSelectField ? 'pointer' : 'default',
                    borderTopWidth: 0,
                    borderTopStyle: 'none',
                    borderRightWidth: 0,
                    borderRightStyle: 'none',
                    borderLeftWidth: 0,
                    borderLeftStyle: 'none',
                    borderBottomWidth: 1,
                    borderBottomStyle: 'solid',
                    borderBottomColor: t.divider
                  }}
                  onClick={() => onSelectField?.(field)}
                >
                  <span style={{ color: t.textMuted }}>{field.kind}</span>
                  <span className="truncate">{field.code}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg p-2" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}>
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: t.textMuted }}>
            Элементы
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: elementsStatus === 'error' ? '#ef4444' : t.textMuted }}>
            {elementsMessage}
          </p>
          {elements.length > 0 ? (
            <div className="mt-1 max-h-36 overflow-y-auto rounded-md" style={{ border: `1px solid ${t.divider}` }}>
              {elements.map((element) => (
                <div
                  key={element.id}
                  className="grid grid-cols-[52px_1fr] gap-1 px-2 py-1 text-[10px]"
                  style={{ borderBottom: `1px solid ${t.divider}`, color: t.text }}
                >
                  <span style={{ color: t.textMuted }}>{element.id}</span>
                  <span className="truncate">{element.name}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
