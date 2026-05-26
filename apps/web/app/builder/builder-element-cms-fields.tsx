'use client'

import * as React from 'react'
import type {
  BuilderStore,
  CmsEntityMode,
  CmsFieldKind,
  CmsPropBindingState,
  PageBlock
} from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getElementPropFields } from '@randee/blocks'
import { formatIblockLabel, useCmsLocalCache } from './use-cms-local-cache'

type Props = {
  block: PageBlock
  elementId: string
  store: StoreApi<BuilderStore>
  inputStyle: React.CSSProperties
  labelColor: string
  onOpenCmsTab?: () => void
}

const BINDABLE_PROPS = new Set(['label', 'text', 'title', 'src', 'alt', 'placeholder', 'href'])

function guessFieldCode(propKey: string): { kind: CmsFieldKind; code: string } {
  const key = propKey.toLowerCase()
  if (key === 'src' || key.includes('image') || key.includes('picture')) {
    return { kind: 'field', code: 'PREVIEW_PICTURE' }
  }
  if (key === 'alt' || key === 'placeholder') {
    return { kind: 'field', code: 'NAME' }
  }
  if (key === 'text' || key.includes('description') || key.includes('subtitle')) {
    return { kind: 'field', code: 'PREVIEW_TEXT' }
  }
  if (key === 'href' || key.includes('link') || key.includes('url')) {
    return { kind: 'property', code: 'LINK' }
  }
  return { kind: 'field', code: 'NAME' }
}

function defaultBinding(
  staticValue: string,
  iblockId: string,
  siteUrl: string,
  mode: CmsEntityMode,
  elementId: string | undefined,
  propKey: string,
  field?: { kind: CmsFieldKind; code: string }
): CmsPropBindingState {
  const resolved = field ?? guessFieldCode(propKey)
  return {
    mode: 'binding',
    staticValue,
    binding: {
      source: {
        provider: 'bitrix',
        siteUrl,
        iblockId,
        mode,
        elementId: mode === 'element' ? elementId : undefined,
        query: mode === 'list' ? { limit: 1, offset: 0 } : undefined
      },
      field: resolved,
      fallback: staticValue
    }
  }
}

export function ElementCmsFields({ block, elementId, store, inputStyle, labelColor, onOpenCmsTab }: Props) {
  const element = (block.elements ?? []).find((item) => item.id === elementId)
  const { iblockId, siteUrl, iblocks, selectedIblock, elementsByIblockId, schemaByIblockId } = useCmsLocalCache()

  if (!element) return null

  const fields = getElementPropFields(element.elementId).filter((field) => BINDABLE_PROPS.has(field.name))
  if (fields.length === 0) return null

  const firstBinding = fields
    .map((field) => element.cmsBindings?.[field.name])
    .find((state) => state?.mode === 'binding' && state.binding)

  const sourceIblockId = firstBinding?.binding?.source.iblockId || iblockId
  const sourceMode: CmsEntityMode =
    firstBinding?.binding?.source.mode === 'element' ? 'element' : 'list'
  const sourceElementId = firstBinding?.binding?.source.elementId ?? ''
  const sourceIblock = iblocks.find((item) => item.id === sourceIblockId)
  const sourceSchema = sourceIblockId ? (schemaByIblockId[sourceIblockId] ?? []) : []
  const sourceElements = sourceIblockId ? (elementsByIblockId[sourceIblockId] ?? []) : []

  const persistIblockSelection = (nextIblockId: string) => {
    try {
      window.localStorage.setItem('randee-cms-selected-iblock-id', nextIblockId)
      window.dispatchEvent(new CustomEvent('randee:cms-cache-updated'))
    } catch {
      // ignore
    }
  }

  const applySourceToBindings = (next: {
    iblockId?: string
    mode?: CmsEntityMode
    elementId?: string
  }) => {
    const resolvedIblockId = next.iblockId ?? sourceIblockId
    if (!resolvedIblockId) return
    const resolvedMode = next.mode ?? sourceMode
    const resolvedElementId =
      resolvedMode === 'element' ? (next.elementId ?? sourceElementId) : undefined

    if (next.iblockId) persistIblockSelection(resolvedIblockId)

    for (const field of fields) {
      const value = element.props[field.name] ?? ''
      const current = element.cmsBindings?.[field.name]
      if (current?.mode !== 'binding' || !current.binding) continue

      const fieldRef = current.binding.field
      store.getState().updateElementCmsBinding(block.id, elementId, field.name, {
        mode: 'binding',
        staticValue: value,
        binding: {
          source: {
            provider: 'bitrix',
            siteUrl: siteUrl || current.binding.source.siteUrl,
            iblockId: resolvedIblockId,
            mode: resolvedMode,
            elementId: resolvedElementId,
            query: resolvedMode === 'list' ? { limit: 1, offset: 0 } : undefined
          },
          field: fieldRef,
          fallback: current.binding.fallback ?? value
        }
      })
    }
  }

  const hasSchemaField = (kind: CmsFieldKind, code: string) =>
    sourceSchema.some((item) => {
      if (!item.code) return false
      if (kind === 'property') return item.kind === 'property' && item.code.toUpperCase() === code.toUpperCase()
      return item.kind !== 'property' && item.code.toUpperCase() === code.toUpperCase()
    })

  const autoMapField = (propKey: string, staticValue: string) => {
    const guessed = guessFieldCode(propKey)
    const schemaForMap = sourceIblockId ? (schemaByIblockId[sourceIblockId] ?? []) : []
    const picked = schemaForMap.find((item) => {
      const kind = item.kind === 'property' ? 'property' : 'field'
      return kind === guessed.kind && item.code.toUpperCase() === guessed.code.toUpperCase()
    })
    const resolved: { kind: CmsFieldKind; code: string } = picked
      ? { kind: picked.kind === 'property' ? 'property' : 'field', code: picked.code }
      : guessed
    return defaultBinding(
      staticValue,
      sourceIblockId || iblockId,
      siteUrl,
      sourceMode,
      sourceElementId,
      propKey,
      resolved
    )
  }

  const iblockMismatch = Boolean(sourceIblockId && iblockId && sourceIblockId !== iblockId)

  return (
    <div className="grid gap-2 border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: labelColor }}>
        CMS привязка
      </p>

      <div
        className="grid gap-2 rounded-md p-2"
        style={{ border: `1px solid ${labelColor}33`, background: 'rgba(255,255,255,0.02)' }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: labelColor }}>
          Источник данных
        </p>

        {iblocks.length === 0 ? (
          <div className="grid gap-1.5">
            <p className="text-[9px] leading-relaxed" style={{ color: labelColor }}>
              Список инфоблоков не загружен. Откройте вкладку CMS слева → «Обновить» → выберите инфоблок.
            </p>
            {onOpenCmsTab ? (
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[10px] font-semibold"
                style={{
                  border: `1px solid ${labelColor}44`,
                  background: 'rgba(124,58,237,0.12)',
                  color: '#c4b5fd',
                  cursor: 'pointer'
                }}
                onClick={onOpenCmsTab}
              >
                Открыть вкладку CMS →
              </button>
            ) : null}
          </div>
        ) : (
          <label className="grid gap-1">
            <span className="text-[10px]" style={{ color: labelColor }}>
              Инфоблок
            </span>
            <select
              style={inputStyle}
              value={sourceIblockId}
              onChange={(event) => {
                const id = event.target.value
                if (!id) return
                persistIblockSelection(id)
                applySourceToBindings({ iblockId: id })
              }}
            >
              <option value="">Выберите инфоблок…</option>
              {iblocks.map((iblock) => (
                <option key={iblock.id} value={iblock.id}>
                  {iblock.name} (ID {iblock.id}
                  {iblock.code ? ` · ${iblock.code}` : ''})
                </option>
              ))}
            </select>
          </label>
        )}

        {sourceIblockId ? (
          <p
            className="rounded-md px-2 py-1.5 text-[10px] leading-relaxed"
            style={{ background: 'rgba(124,58,237,0.12)', color: '#c4b5fd' }}
          >
            Данные берутся из инфоблока{' '}
            <strong>{formatIblockLabel(sourceIblock, sourceIblockId)}</strong>
          </p>
        ) : null}

        {iblockMismatch ? (
          <p className="text-[9px]" style={{ color: '#f59e0b' }}>
            Во вкладке CMS выбран другой инфоблок ({formatIblockLabel(selectedIblock, iblockId)}). Привязки
            этого элемента используют {formatIblockLabel(sourceIblock, sourceIblockId)}.
          </p>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[10px]" style={{ color: labelColor }}>
            Какой элемент инфоблока
          </span>
          <select
            style={inputStyle}
            value={sourceMode}
            onChange={(event) => {
              const mode = event.target.value as CmsEntityMode
              applySourceToBindings({
                mode,
                elementId: mode === 'element' ? sourceElements[0]?.id ?? sourceElementId : ''
              })
            }}
            disabled={!sourceIblockId}
          >
            <option value="list">Первый из списка (для превью)</option>
            <option value="element">Конкретный элемент</option>
          </select>
        </label>

        {sourceMode === 'element' && sourceIblockId ? (
          <label className="grid gap-1">
            <span className="text-[10px]" style={{ color: labelColor }}>
              Элемент инфоблока
            </span>
            <select
              style={inputStyle}
              value={sourceElementId}
              onChange={(event) => applySourceToBindings({ elementId: event.target.value })}
            >
              <option value="">
                {sourceElements.length === 0
                  ? 'Загрузите элементы во вкладке CMS'
                  : 'Выберите элемент…'}
              </option>
              {sourceElements.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (ID {item.id})
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {sourceIblockId && sourceSchema.length === 0 ? (
          <p className="text-[9px]" style={{ color: '#f59e0b' }}>
            Schema для этого инфоблока не загружена. Во вкладке CMS выберите инфоблок — поля подтянутся
            автоматически.
          </p>
        ) : null}
      </div>

      <p className="text-[9px]" style={{ color: labelColor }}>
        Ниже — какие поля инфоблока подставлять в свойства элемента:
      </p>

      {fields.map((field) => {
        const value = element.props[field.name] ?? ''
        const state = element.cmsBindings?.[field.name]
        const isBinding = state?.mode === 'binding'
        const selectedKind = state?.binding?.field.kind ?? 'field'
        const schemaByKind = sourceSchema.filter((item) =>
          selectedKind === 'property' ? item.kind === 'property' : item.kind !== 'property'
        )
        const boundIblockForField = state?.binding?.source.iblockId

        return (
          <div key={field.name} className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px]" style={{ color: labelColor }}>
                {field.label}
              </span>
              <div className="flex items-center gap-1">
                {isBinding && sourceSchema.length > 0 ? (
                  <button
                    type="button"
                    className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                    style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#60a5fa',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      store
                        .getState()
                        .updateElementCmsBinding(
                          block.id,
                          elementId,
                          field.name,
                          autoMapField(field.name, value)
                        )
                    }}
                  >
                    Авто
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                  style={{
                    background: isBinding ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                    color: isBinding ? '#22c55e' : labelColor,
                    border: 'none',
                    cursor: sourceIblockId || iblockId ? 'pointer' : 'default',
                    opacity: sourceIblockId || iblockId ? 1 : 0.5
                  }}
                  disabled={!sourceIblockId && !iblockId}
                  onClick={() => {
                    const activeIblock = sourceIblockId || iblockId
                    if (!activeIblock) return
                    if (isBinding) {
                      store.getState().updateElementCmsBinding(block.id, elementId, field.name, {
                        mode: 'static',
                        staticValue: value
                      })
                    } else {
                      if (!sourceIblockId && iblockId) {
                        persistIblockSelection(iblockId)
                      }
                      store
                        .getState()
                        .updateElementCmsBinding(
                          block.id,
                          elementId,
                          field.name,
                          autoMapField(field.name, value)
                        )
                    }
                  }}
                >
                  {isBinding ? 'CMS ✓' : '→ CMS'}
                </button>
              </div>
            </div>

            {isBinding && state?.binding ? (
              <div className="grid gap-1">
                {boundIblockForField ? (
                  <p className="text-[9px]" style={{ color: labelColor }}>
                    из {formatIblockLabel(iblocks.find((i) => i.id === boundIblockForField), boundIblockForField)}
                    {' · '}
                    {state.binding.source.mode === 'element' ? 'элемент' : 'список'}
                    {' → '}
                    <span style={{ color: '#a5b4fc' }}>
                      {state.binding.field.kind === 'property' ? 'свойство' : 'поле'}{' '}
                      {state.binding.field.code || '—'}
                    </span>
                  </p>
                ) : null}
                <select
                  style={inputStyle}
                  value={selectedKind}
                  onChange={(event) => {
                    const kind = (event.target.value === 'property' ? 'property' : 'field') as CmsFieldKind
                    const current = state.mode === 'binding' ? state : autoMapField(field.name, value)
                    store.getState().updateElementCmsBinding(block.id, elementId, field.name, {
                      ...current,
                      mode: 'binding',
                      binding: {
                        ...current.binding!,
                        field: { kind, code: '' }
                      }
                    })
                  }}
                >
                  <option value="field">Поле</option>
                  <option value="property">Свойство</option>
                </select>
                <select
                  style={inputStyle}
                  value={state.binding.field.code ?? ''}
                  onChange={(event) => {
                    const current = state.mode === 'binding' ? state : autoMapField(field.name, value)
                    store.getState().updateElementCmsBinding(block.id, elementId, field.name, {
                      ...current,
                      mode: 'binding',
                      binding: {
                        ...current.binding!,
                        field: {
                          kind: current.binding!.field.kind,
                          code: event.target.value
                        }
                      }
                    })
                  }}
                >
                  <option value="">
                    {sourceSchema.length === 0 ? 'Сначала загрузите schema' : 'Выберите поле…'}
                  </option>
                  {schemaByKind.map((item) => (
                    <option key={`${item.kind}:${item.code}`} value={item.code}>
                      {item.code} ({item.label})
                    </option>
                  ))}
                </select>
                {!hasSchemaField(state.binding.field.kind, state.binding.field.code) &&
                state.binding.field.code ? (
                  <p className="text-[9px]" style={{ color: '#f59e0b' }}>
                    Поле не найдено в schema этого инфоблока.
                  </p>
                ) : null}
              </div>
            ) : (
              <input
                style={inputStyle}
                value={value}
                onChange={(event) =>
                  store.getState().updateElementProps(block.id, elementId, { [field.name]: event.target.value })
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
