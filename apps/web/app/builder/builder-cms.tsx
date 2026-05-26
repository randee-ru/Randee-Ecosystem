'use client'

import * as React from 'react'
import { Boxes, X } from 'lucide-react'
import type { BuilderCmsConnection } from '@randee/builder'

type CmsTheme = {
  panel: string
  panelElevated: string
  divider: string
  text: string
  textMuted: string
  inputBg: string
  accent: string
}

type BuilderCmsProps = {
  t: CmsTheme
  onClose: () => void
  connection: BuilderCmsConnection
  onConnectionChange: (connection: BuilderCmsConnection) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  onSaveConnection: (connection: BuilderCmsConnection) => void
}

export function BuilderCms({
  t,
  onClose,
  connection,
  onConnectionChange,
  saveStatus,
  onSaveConnection
}: BuilderCmsProps) {
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
  const siteUrl = connection.siteUrl
  const apiKey = connection.apiKey
  const connectorPath = connection.connectorPath
  const [status, setStatus] = React.useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [message, setMessage] = React.useState('Введите адрес сайта и API key, затем нажмите "Проверить подключение".')

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('randee-cms-site-url', connection.siteUrl ?? '')
      window.localStorage.setItem('randee-cms-connector-path', connection.connectorPath ?? '')
      window.localStorage.setItem('randee-cms-api-key', connection.apiKey ?? '')
    } catch {
      // ignore storage errors
    }
  }, [connection.apiKey, connection.connectorPath, connection.siteUrl])

  function buildConnectorUrl(action: string) {
    const baseUrl = siteUrl.trim().replace(/\/+$/, '')
    const path = connectorPath.trim()
    const key = apiKey.trim()
    const url = new URL(path, `${baseUrl}/`)
    url.searchParams.set('action', action)
    url.searchParams.set('api_key', key)
    url.searchParams.set('format', 'json')
    return url
  }

  async function loadIblocks() {
    const baseUrl = siteUrl.trim().replace(/\/+$/, '')
    const path = connectorPath.trim()
    const key = apiKey.trim()
    if (!baseUrl || !path || !key) {
      setIblocksStatus('error')
      setIblocksMessage('Заполните Site URL, Connector Path и API Key.')
      return
    }

    setIblocksStatus('loading')
    setIblocksMessage('Загружаем инфоблоки...')

    try {
      const response = await fetch(buildConnectorUrl('iblocks.list').toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: Array<{ id?: string; name?: string; code?: string; type?: string }>
      }

      if (!response.ok || payload.ok !== true || !Array.isArray(payload.data)) {
        setIblocksStatus('error')
        setIblocksMessage(`Не удалось загрузить инфоблоки: ${payload.error?.message ?? `HTTP ${response.status}`}`)
        return
      }

      setIblocks(
        payload.data.map((item) => ({
          id: item.id ?? '',
          name: item.name ?? '',
          code: item.code ?? '',
          type: item.type ?? ''
        }))
      )
      const normalized = payload.data.map((item) => ({
        id: item.id ?? '',
        name: item.name ?? '',
        code: item.code ?? '',
        type: item.type ?? ''
      }))
      try {
        window.localStorage.setItem('randee-cms-iblocks', JSON.stringify(normalized))
      } catch {
        // ignore storage errors
      }
      if (payload.data.length > 0) {
        const firstId = payload.data[0]?.id ?? null
        setSelectedIblockId(firstId)
        try {
          window.localStorage.setItem('randee-cms-selected-iblock-id', firstId ?? '')
        } catch {
          // ignore storage errors
        }
        if (firstId) {
          await Promise.all([loadIblockSchema(firstId), loadIblockElements(firstId)])
        }
      } else {
        setSelectedIblockId(null)
        setSchemaFields([])
        setElements([])
      }
      setIblocksStatus('ok')
      setIblocksMessage(`Загружено инфоблоков: ${payload.data.length}`)
    } catch (error) {
      setIblocksStatus('error')
      setIblocksMessage(`Ошибка загрузки инфоблоков: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function loadIblockSchema(iblockId: string) {
    if (!iblockId) return
    setSchemaStatus('loading')
    setSchemaMessage('Загружаем поля и свойства...')
    try {
      const url = buildConnectorUrl('iblock.schema')
      url.searchParams.set('iblockId', iblockId)
      const response = await fetch(url.toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: { fields?: Array<{ kind?: string; code?: string; label?: string }> }
      }
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.data?.fields)) {
        setSchemaStatus('error')
        setSchemaMessage(`Не удалось загрузить schema: ${payload.error?.message ?? `HTTP ${response.status}`}`)
        return
      }
      setSchemaFields(
        payload.data.fields.map((field) => ({
          kind: field.kind ?? '',
          code: field.code ?? '',
          label: field.label ?? field.code ?? ''
        }))
      )
      try {
        const raw = window.localStorage.getItem('randee-cms-schema-by-iblock-id')
        const current = raw ? (JSON.parse(raw) as Record<string, Array<{ kind: string; code: string; label: string }>>) : {}
        current[iblockId] = payload.data.fields.map((field) => ({
          kind: field.kind ?? '',
          code: field.code ?? '',
          label: field.label ?? field.code ?? ''
        }))
        window.localStorage.setItem('randee-cms-schema-by-iblock-id', JSON.stringify(current))
      } catch {
        // ignore storage errors
      }
      setSchemaStatus('ok')
      setSchemaMessage(`Полей и свойств: ${payload.data.fields.length}`)
    } catch (error) {
      setSchemaStatus('error')
      setSchemaMessage(`Ошибка schema: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function loadIblockElements(iblockId: string) {
    if (!iblockId) return
    setElementsStatus('loading')
    setElementsMessage('Загружаем элементы...')
    try {
      const url = buildConnectorUrl('elements.list')
      url.searchParams.set('iblockId', iblockId)
      url.searchParams.set('limit', '10')
      url.searchParams.set('offset', '0')
      const response = await fetch(url.toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: Array<{ id?: string; name?: string }>
      }
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.data)) {
        setElementsStatus('error')
        setElementsMessage(`Не удалось загрузить элементы: ${payload.error?.message ?? `HTTP ${response.status}`}`)
        return
      }
      setElements(
        payload.data.map((element) => ({
          id: element.id ?? '',
          name: element.name ?? ''
        }))
      )
      try {
        const raw = window.localStorage.getItem('randee-cms-elements-by-iblock-id')
        const current = raw ? (JSON.parse(raw) as Record<string, Array<{ id: string; name: string }>>) : {}
        current[iblockId] = payload.data.map((element) => ({
          id: element.id ?? '',
          name: element.name ?? ''
        }))
        window.localStorage.setItem('randee-cms-elements-by-iblock-id', JSON.stringify(current))
      } catch {
        // ignore storage errors
      }
      setElementsStatus('ok')
      setElementsMessage(`Элементов (sample): ${payload.data.length}`)
    } catch (error) {
      setElementsStatus('error')
      setElementsMessage(`Ошибка elements: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async function selectIblock(iblockId: string) {
    setSelectedIblockId(iblockId)
    try {
      window.localStorage.setItem('randee-cms-selected-iblock-id', iblockId)
    } catch {
      // ignore storage errors
    }
    await Promise.all([loadIblockSchema(iblockId), loadIblockElements(iblockId)])
  }

  async function ping() {
    const baseUrl = siteUrl.trim().replace(/\/+$/, '')
    const path = connectorPath.trim()
    const key = apiKey.trim()
    if (!baseUrl || !path || !key) {
      setStatus('error')
      setMessage('Заполните Site URL, Connector Path и API Key.')
      return
    }

    setStatus('checking')
    setMessage('Проверяем подключение...')

    try {
      const response = await fetch(buildConnectorUrl('ping').toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: { version?: string }
      }

      if (!response.ok || payload.ok !== true) {
        setStatus('error')
        setMessage(`Ошибка подключения: ${payload.error?.message ?? `HTTP ${response.status}`}`)
        return
      }

      setStatus('ok')
      setMessage(`Подключено. randee.connector ${payload.data?.version ?? ''}`.trim())
      await loadIblocks()
    } catch (error) {
      setStatus('error')
      setMessage(`Ошибка подключения: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{ background: t.panel }}>
      <div
        className="flex shrink-0 items-center gap-3 px-4 py-3"
        style={{ borderBottom: `1px solid ${t.divider}`, background: t.panelElevated }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${t.accent}22`, color: t.accent }}>
          <Boxes className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold" style={{ color: t.text }}>
            CMS Connection
          </h1>
          <p className="text-[11px]" style={{ color: t.textMuted }}>
            Подключение `randee.connector` для данных инфоблоков
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-md px-3 text-[11px] font-medium"
          style={{ color: t.textMuted, background: t.inputBg, border: `1px solid ${t.divider}` }}
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
          Закрыть
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto grid max-w-3xl gap-3">
          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: t.textMuted }}>
              Site URL
            </span>
            <input
              value={siteUrl}
              onChange={(event) => onConnectionChange({ ...connection, siteUrl: event.target.value })}
              placeholder="https://example.com"
              className="h-9 rounded-md px-3 text-xs outline-none"
              style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: t.textMuted }}>
              API Key
            </span>
            <input
              value={apiKey}
              onChange={(event) => onConnectionChange({ ...connection, apiKey: event.target.value })}
              placeholder="secret key"
              className="h-9 rounded-md px-3 text-xs outline-none"
              style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: t.textMuted }}>
              Connector Path
            </span>
            <input
              value={connectorPath}
              onChange={(event) => onConnectionChange({ ...connection, connectorPath: event.target.value })}
              placeholder="/local/modules/randee.connector/tools/connector.php"
              className="h-9 rounded-md px-3 text-xs outline-none"
              style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
            />
          </label>

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              className="h-9 rounded-md px-3 text-xs font-medium text-white"
              style={{ background: status === 'checking' ? '#6b7280' : t.accent, border: 'none' }}
              onClick={() => void ping()}
              disabled={status === 'checking'}
            >
              {status === 'checking' ? 'Checking…' : 'Проверить подключение'}
            </button>
            <button
              type="button"
              className="h-9 rounded-md px-3 text-xs font-medium"
              style={{ color: t.text, background: t.inputBg, border: `1px solid ${t.divider}` }}
              onClick={() => void loadIblocks()}
              disabled={iblocksStatus === 'loading'}
            >
              {iblocksStatus === 'loading' ? 'Обновляем…' : 'Обновить инфоблоки'}
            </button>
            <button
              type="button"
              className="h-9 rounded-md px-3 text-xs font-medium"
              style={{ color: t.text, background: t.inputBg, border: `1px solid ${t.divider}` }}
              onClick={() => onSaveConnection(connection)}
            >
              Save CMS settings
            </button>
            <p className="text-[11px]" style={{ color: status === 'error' ? '#ef4444' : status === 'ok' ? '#22c55e' : t.textMuted }}>
              {message}
            </p>
          </div>

          <p
            className="text-[11px]"
            style={{ color: saveStatus === 'error' ? '#ef4444' : saveStatus === 'saved' ? '#22c55e' : t.textMuted }}
          >
            {saveStatus === 'saving'
              ? 'CMS saved status: saving...'
              : saveStatus === 'saved'
                ? 'CMS saved status: saved'
                : saveStatus === 'error'
                  ? 'CMS saved status: save failed'
                  : 'CMS saved status: idle'}
          </p>

          <div
            className="mt-2 rounded-lg p-3"
            style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
          >
            <p className="text-[10px] uppercase tracking-wide" style={{ color: t.textMuted }}>
              Iblocks
            </p>
            <p
              className="mt-1 text-[11px]"
              style={{ color: iblocksStatus === 'error' ? '#ef4444' : iblocksStatus === 'ok' ? '#22c55e' : t.textMuted }}
            >
              {iblocksMessage || 'Список инфоблоков пока не загружен.'}
            </p>

            {iblocks.length > 0 ? (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-md" style={{ border: `1px solid ${t.divider}` }}>
                {iblocks.map((iblock) => (
                  <button
                    key={`${iblock.id}-${iblock.code}`}
                    type="button"
                    className="grid w-full grid-cols-[80px_1fr] gap-2 px-2 py-1.5 text-left text-[11px]"
                    style={{
                      borderBottom: `1px solid ${t.divider}`,
                      color: t.text,
                      background: selectedIblockId === iblock.id ? `${t.accent}22` : 'transparent',
                      borderLeft: selectedIblockId === iblock.id ? `2px solid ${t.accent}` : '2px solid transparent'
                    }}
                    onClick={() => void selectIblock(iblock.id)}
                  >
                    <span style={{ color: t.textMuted }}>ID {iblock.id}</span>
                    <span className="truncate">{iblock.name} ({iblock.code || 'no-code'})</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg p-3" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: t.textMuted }}>
                Iblock Schema
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: schemaStatus === 'error' ? '#ef4444' : schemaStatus === 'ok' ? '#22c55e' : t.textMuted }}
              >
                {schemaMessage || 'Выберите инфоблок для загрузки полей.'}
              </p>
              {schemaFields.length > 0 ? (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-md" style={{ border: `1px solid ${t.divider}` }}>
                  {schemaFields.map((field) => (
                    <div
                      key={`${field.kind}-${field.code}`}
                      className="grid grid-cols-[72px_1fr] gap-2 px-2 py-1.5 text-[11px]"
                      style={{ borderBottom: `1px solid ${t.divider}`, color: t.text }}
                    >
                      <span style={{ color: t.textMuted }}>{field.kind}</span>
                      <span className="truncate">{field.code} ({field.label})</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-lg p-3" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: t.textMuted }}>
                Elements Sample
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: elementsStatus === 'error' ? '#ef4444' : elementsStatus === 'ok' ? '#22c55e' : t.textMuted }}
              >
                {elementsMessage || 'Выберите инфоблок для загрузки элементов.'}
              </p>
              {elements.length > 0 ? (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-md" style={{ border: `1px solid ${t.divider}` }}>
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      className="grid grid-cols-[72px_1fr] gap-2 px-2 py-1.5 text-[11px]"
                      style={{ borderBottom: `1px solid ${t.divider}`, color: t.text }}
                    >
                      <span style={{ color: t.textMuted }}>ID {element.id}</span>
                      <span className="truncate">{element.name}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
