'use client'

import * as React from 'react'
import { Boxes, X } from 'lucide-react'
import type { BuilderCmsConnection } from '@randee/builder'
import { BuilderCmsBrowser } from './builder-cms-browser'
import { buildConnectorUrl, isCmsConnectionConfigured } from './builder-cms-utils'

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
  const [status, setStatus] = React.useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [message, setMessage] = React.useState('Введите адрес сайта и API key, затем нажмите «Проверить подключение».')

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

  async function ping() {
    if (!isCmsConnectionConfigured(connection)) {
      setStatus('error')
      setMessage('Заполните Site URL, Connector Path и API Key.')
      return
    }

    setStatus('checking')
    setMessage('Проверяем подключение…')

    try {
      const response = await fetch(buildConnectorUrl(connection, 'ping').toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: { message?: string }
        data?: { version?: string }
      }

      if (!response.ok || payload.ok !== true) {
        setStatus('error')
        setMessage(`Ошибка: ${payload.error?.message ?? `HTTP ${response.status}`}`)
        return
      }

      setStatus('ok')
      setMessage(`Подключено · randee.connector ${payload.data?.version ?? ''}`.trim())
    } catch (error) {
      setStatus('error')
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            Подключение randee.connector
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
              value={connection.siteUrl}
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
              value={connection.apiKey}
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
              value={connection.connectorPath}
              onChange={(event) => onConnectionChange({ ...connection, connectorPath: event.target.value })}
              placeholder="/local/modules/randee.connector/tools/connector.php"
              className="h-9 rounded-md px-3 text-xs outline-none"
              style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
            />
          </label>

          <div className="mt-1 flex flex-wrap items-center gap-2">
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
              onClick={() => onSaveConnection(connection)}
            >
              Сохранить настройки
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
              ? 'Сохранение…'
              : saveStatus === 'saved'
                ? 'Сохранено'
                : saveStatus === 'error'
                  ? 'Ошибка сохранения'
                  : ''}
          </p>

          <BuilderCmsBrowser connection={connection} t={t} />
        </div>
      </div>
    </div>
  )
}
