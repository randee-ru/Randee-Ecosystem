'use client'

import * as React from 'react'
import type { BuilderStore, CmsFieldKind, CmsPropBindingState, PageBlock } from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getBlockPropFieldsForTemplate, type BlockPropField } from '@randee/blocks'

type BlockPropsFieldsProps = {
  block: PageBlock
  store: StoreApi<BuilderStore>
  inputStyle: React.CSSProperties
  labelColor: string
}

type CmsMode = 'static' | 'element' | 'list'

type CmsIblock = { id: string; name: string; code: string }
type CmsSchemaField = { kind: string; code: string; label: string }
type CmsElement = { id: string; name: string }

function renderFieldInput(
  field: BlockPropField,
  value: string,
  onChange: (value: string) => void,
  inputStyle: React.CSSProperties
) {
  if (field.type === 'boolean') {
    return (
      <select style={inputStyle} value={value === 'true' ? 'true' : 'false'} onChange={(event) => onChange(event.target.value)}>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </select>
    )
  }

  if (field.type === 'select' && field.options?.length) {
    return (
      <select style={inputStyle} value={value} onChange={(event) => onChange(event.target.value)}>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'color') {
    const hex = value ? `#${value.replace('#', '')}` : '#ffffff'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0, cursor: 'pointer' }}>
          <span style={{ display: 'block', width: '100%', height: '100%', background: hex }} />
          <input
            type="color"
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            value={hex}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          style={{ ...inputStyle, flex: 1 }}
          type="text"
          maxLength={7}
          value={value}
          placeholder="#ffffff"
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    )
  }

  if (field.type === 'image') {
    return (
      <input
        style={inputStyle}
        type="url"
        value={value}
        placeholder="https://…"
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  return (
    <input
      style={inputStyle}
      type={field.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function buildDefaultBinding(
  value: string,
  siteUrl: string,
  iblockId: string,
  mode: CmsMode
): CmsPropBindingState {
  return {
    mode: 'binding',
    staticValue: value,
    binding: {
      source: {
        provider: 'bitrix',
        siteUrl,
        iblockId,
        mode: mode === 'static' ? 'element' : mode,
        elementId: ''
      },
      field: { kind: 'field', code: 'NAME' },
      fallback: value
    }
  }
}

export function BlockPropsFields({ block, store, inputStyle, labelColor }: BlockPropsFieldsProps) {
  const fields = getBlockPropFieldsForTemplate(block.template)
  const [defaultIblockId, setDefaultIblockId] = React.useState('')
  const [defaultSiteUrl, setDefaultSiteUrl] = React.useState('')
  const [cmsIblocks, setCmsIblocks] = React.useState<CmsIblock[]>([])
  const [cmsSchemaByIblockId, setCmsSchemaByIblockId] = React.useState<Record<string, CmsSchemaField[]>>({})
  const [cmsElementsByIblockId, setCmsElementsByIblockId] = React.useState<Record<string, CmsElement[]>>({})
  const [loadingElementsFor, setLoadingElementsFor] = React.useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [cmsConfigured, setCmsConfigured] = React.useState(false)

  React.useEffect(() => {
    setDefaultIblockId(window.localStorage.getItem('randee-cms-selected-iblock-id') ?? '')
    setDefaultSiteUrl(window.localStorage.getItem('randee-cms-site-url') ?? '')
    try {
      const apiKey = (window.localStorage.getItem('randee-cms-api-key') ?? '').trim()
      const connectorPath = (window.localStorage.getItem('randee-cms-connector-path') ?? '').trim()
      const siteUrl = (window.localStorage.getItem('randee-cms-site-url') ?? '').trim()
      setCmsConfigured(Boolean(apiKey && connectorPath && siteUrl))

      const iblocksRaw = window.localStorage.getItem('randee-cms-iblocks')
      if (iblocksRaw) {
        const parsed = JSON.parse(iblocksRaw) as Array<{ id?: string; name?: string; code?: string }>
        setCmsIblocks(parsed.map((item) => ({ id: item.id ?? '', name: item.name ?? '', code: item.code ?? '' })))
      }
      const schemaRaw = window.localStorage.getItem('randee-cms-schema-by-iblock-id')
      if (schemaRaw) {
        setCmsSchemaByIblockId(JSON.parse(schemaRaw) as Record<string, CmsSchemaField[]>)
      }
      const elementsRaw = window.localStorage.getItem('randee-cms-elements-by-iblock-id')
      if (elementsRaw) {
        setCmsElementsByIblockId(JSON.parse(elementsRaw) as Record<string, CmsElement[]>)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  // Авто-подгрузка элементов инфоблока если их нет в кэше
  const fetchElementsForIblock = React.useCallback(async (iblockId: string) => {
    if (!iblockId || loadingElementsFor === iblockId) return
    const siteUrl = (window.localStorage.getItem('randee-cms-site-url') ?? '').trim().replace(/\/+$/, '')
    const apiKey = (window.localStorage.getItem('randee-cms-api-key') ?? '').trim()
    const connectorPath = (window.localStorage.getItem('randee-cms-connector-path') ?? '/local/modules/randee.connector/tools/connector.php').trim()
    if (!siteUrl || !apiKey || !connectorPath) return

    setLoadingElementsFor(iblockId)
    try {
      const url = new URL(connectorPath, `${siteUrl}/`)
      url.searchParams.set('action', 'elements.list')
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('iblockId', iblockId)
      url.searchParams.set('limit', '20')
      url.searchParams.set('offset', '0')
      url.searchParams.set('format', 'json')

      const response = await fetch(url.toString(), { method: 'GET' })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        data?: Array<{ id?: string; name?: string }>
      }
      if (payload.ok !== true || !Array.isArray(payload.data)) return

      const loaded = payload.data.map((el) => ({ id: el.id ?? '', name: el.name ?? '' }))
      setCmsElementsByIblockId((prev) => {
        const next = { ...prev, [iblockId]: loaded }
        try {
          window.localStorage.setItem('randee-cms-elements-by-iblock-id', JSON.stringify(next))
        } catch { /* ignore */ }
        return next
      })
    } catch { /* ignore */ } finally {
      setLoadingElementsFor(null)
    }
  }, [loadingElementsFor])

  if (fields.length === 0) {
    return (
      <p className="text-xs" style={{ color: labelColor }}>
        Нет редактируемых пропсов для этого блока.
      </p>
    )
  }

  const firstBinding = fields
    .map((field) => block.cmsBindings?.props[field.name])
    .find((state) => state?.mode === 'binding' && state.binding)

  const dataMode: CmsMode = firstBinding?.mode === 'binding'
    ? ((firstBinding.binding?.source.mode as CmsMode | undefined) ?? 'element')
    : 'static'

  const sourceIblockId =
    firstBinding?.binding?.source.iblockId ||
    defaultIblockId ||
    ''

  const sourceElementId = firstBinding?.binding?.source.elementId ?? ''
  const sourceSiteUrl = firstBinding?.binding?.source.siteUrl ?? defaultSiteUrl

  const applySourceToBindings = (next: {
    mode?: CmsMode
    iblockId?: string
    elementId?: string
    siteUrl?: string
  }) => {
    for (const field of fields) {
      const value = block.props[field.name] ?? ''
      const current = block.cmsBindings?.props[field.name]

      if ((next.mode ?? dataMode) === 'static') {
        store.getState().updateBlockCmsBinding(block.id, field.name, {
          mode: 'static',
          staticValue: value
        })
        continue
      }

      const mode = (next.mode ?? dataMode) as Exclude<CmsMode, 'static'>
      const fallback = current?.binding?.fallback ?? value
      const kind = current?.binding?.field.kind ?? 'field'
      const code = current?.binding?.field.code ?? (field.name.toUpperCase() === 'TITLE' ? 'NAME' : '')

      store.getState().updateBlockCmsBinding(block.id, field.name, {
        mode: 'binding',
        staticValue: value,
        binding: {
          source: {
            provider: 'bitrix',
            siteUrl: next.siteUrl ?? sourceSiteUrl,
            iblockId: next.iblockId ?? sourceIblockId,
            mode,
            elementId: mode === 'element' ? (next.elementId ?? sourceElementId) : ''
          },
          field: {
            kind,
            code
          },
          fallback
        }
      })
    }
  }

  const applyPreset = (preset: 'hero' | 'news') => {
    const maps: Record<'hero' | 'news', Record<string, { kind: CmsFieldKind; code: string }>> = {
      hero: {
        title: { kind: 'field', code: 'NAME' },
        subtitle: { kind: 'field', code: 'PREVIEW_TEXT' },
        text: { kind: 'field', code: 'PREVIEW_TEXT' },
        image: { kind: 'field', code: 'PREVIEW_PICTURE' }
      },
      news: {
        title: { kind: 'field', code: 'NAME' },
        subtitle: { kind: 'field', code: 'PREVIEW_TEXT' },
        text: { kind: 'field', code: 'PREVIEW_TEXT' },
        image: { kind: 'field', code: 'PREVIEW_PICTURE' },
        date: { kind: 'field', code: 'ACTIVE_FROM' }
      }
    }

    for (const field of fields) {
      const value = block.props[field.name] ?? ''
      const lowerName = field.name.toLowerCase()
      const presetMap = maps[preset][lowerName]
      const current = block.cmsBindings?.props[field.name]
      if (dataMode === 'static') continue
      store.getState().updateBlockCmsBinding(block.id, field.name, {
        mode: 'binding',
        staticValue: value,
        binding: {
          source: {
            provider: 'bitrix',
            siteUrl: sourceSiteUrl,
            iblockId: sourceIblockId,
            mode: dataMode,
            elementId: dataMode === 'element' ? sourceElementId : ''
          },
          field: presetMap ?? current?.binding?.field ?? { kind: 'field', code: '' },
          fallback: current?.binding?.fallback ?? value
        }
      })
    }
  }

  const applyAutoMapFields = () => {
    if (dataMode === 'static') return

    const fieldPriorityMap: Array<{ propMatches: string[]; candidates: Array<{ kind: CmsFieldKind; code: string }> }> = [
      {
        propMatches: ['title', 'name', 'heading'],
        candidates: [
          { kind: 'field', code: 'NAME' },
          { kind: 'property', code: 'TITLE' },
          { kind: 'property', code: 'TITLE_LINE_1' }
        ]
      },
      {
        propMatches: ['subtitle', 'description', 'text', 'lead', 'excerpt'],
        candidates: [
          { kind: 'field', code: 'PREVIEW_TEXT' },
          { kind: 'field', code: 'DETAIL_TEXT' },
          { kind: 'property', code: 'LEAD' },
          { kind: 'property', code: 'DESCRIPTION' }
        ]
      },
      {
        propMatches: ['image', 'picture', 'photo', 'thumb'],
        candidates: [
          { kind: 'field', code: 'PREVIEW_PICTURE' },
          { kind: 'field', code: 'DETAIL_PICTURE' },
          { kind: 'property', code: 'IMAGE' },
          { kind: 'property', code: 'PICTURE' }
        ]
      },
      {
        propMatches: ['date', 'published', 'activeFrom'],
        candidates: [
          { kind: 'field', code: 'ACTIVE_FROM' },
          { kind: 'property', code: 'DATE' }
        ]
      },
      {
        propMatches: ['link', 'url', 'href'],
        candidates: [
          { kind: 'property', code: 'LINK' },
          { kind: 'property', code: 'URL' },
          { kind: 'property', code: 'BTN_PRIMARY_LINK' }
        ]
      }
    ]

    const hasSchemaField = (kind: CmsFieldKind, code: string) => {
      return schema.some((item) => {
        if (!item.code) return false
        if (kind === 'property') return item.kind === 'property' && item.code.toUpperCase() === code.toUpperCase()
        return item.kind !== 'property' && item.code.toUpperCase() === code.toUpperCase()
      })
    }

    for (const field of fields) {
      const value = block.props[field.name] ?? ''
      const current = block.cmsBindings?.props[field.name]
      const lowerName = field.name.toLowerCase()
      const rule = fieldPriorityMap.find((item) => item.propMatches.some((m) => lowerName.includes(m.toLowerCase())))
      const picked = rule?.candidates.find((candidate) => hasSchemaField(candidate.kind, candidate.code))

      const fallbackField: { kind: CmsFieldKind; code: string } = picked ?? { kind: 'field', code: 'NAME' }
      const resolvedField =
        current?.binding?.field?.code && hasSchemaField(current.binding.field.kind, current.binding.field.code)
          ? current.binding.field
          : fallbackField

      store.getState().updateBlockCmsBinding(block.id, field.name, {
        mode: 'binding',
        staticValue: value,
        binding: {
          source: {
            provider: 'bitrix',
            siteUrl: sourceSiteUrl,
            iblockId: sourceIblockId,
            mode: dataMode,
            elementId: dataMode === 'element' ? sourceElementId : ''
          },
          field: resolvedField,
          fallback: current?.binding?.fallback ?? value
        }
      })
    }
  }

  if (block.template === 'component-03') {
    const runSwiperWizard = () => {
      const selectedIblockId = window.localStorage.getItem('randee-cms-selected-iblock-id') ?? ''
      store.getState().updateBlockProps(block.id, {
        title: 'Анонсы',
        cmsIblockId: selectedIblockId,
        cmsLimit: '8',
        cmsAutoplayMs: '3500',
        cmsShowText: 'true',
        cmsImageField: 'previewPicture'
      })

      const enabledVendors = store.getState().page.vendors ?? []
      if (!enabledVendors.includes('swiper')) {
        store.getState().togglePageVendor('swiper')
      }
    }

    const applyCompactMode = () => {
      store.getState().updateBlockProps(block.id, {
        cmsLimit: '4',
        cmsShowText: 'false',
        cmsAutoplayMs: '2800'
      })
    }

    const applyStoryMode = () => {
      store.getState().updateBlockProps(block.id, {
        cmsLimit: '8',
        cmsShowText: 'true',
        cmsAutoplayMs: '3800'
      })
    }

    return (
      <div className="grid gap-2">
        <p className="text-[11px]" style={{ color: labelColor }}>
          Слайдер читает данные напрямую из инфоблока через `randee.connector`.
        </p>
        <p className="text-[10px]" style={{ color: cmsConfigured ? '#22c55e' : '#ef4444' }}>
          {cmsConfigured
            ? 'CMS подключение найдено (siteUrl/apiKey/path).'
            : 'CMS подключение не настроено. Сначала заполните CMS экран.'}
        </p>
        <button type="button" style={inputStyle} onClick={runSwiperWizard}>
          Настроить как Swiper-анонсы
        </button>
        <div className="grid grid-cols-2 gap-1">
          <button type="button" style={inputStyle} onClick={applyCompactMode}>
            Пресет: Компакт
          </button>
          <button type="button" style={inputStyle} onClick={applyStoryMode}>
            Пресет: История
          </button>
        </div>
        <p className="text-[10px]" style={{ color: labelColor }}>
          Wizard: подставляет параметры слайдера, ставит выбранный инфоблок из CMS и включает vendor `swiper`.
        </p>
        {fields.map((field) => {
          const value = block.props[field.name] ?? ''
          return (
            <label key={field.name} className="grid gap-1">
              <span className="text-[10px]" style={{ color: labelColor }}>
                {field.label}
              </span>
              {renderFieldInput(
                field,
                value,
                (next) => {
                  store.getState().updateBlockProps(block.id, { [field.name]: next })
                },
                inputStyle
              )}
            </label>
          )
        })}
      </div>
    )
  }

  const schema = cmsSchemaByIblockId[sourceIblockId] ?? []
  const elements = cmsElementsByIblockId[sourceIblockId] ?? []
  const validationErrors: string[] = []
  if (dataMode !== 'static') {
    if (!sourceIblockId) validationErrors.push('Не выбран инфоблок (CMS Iblock).')
    if (dataMode === 'element' && !sourceElementId) validationErrors.push('Не выбран элемент (CMS Element) или оставьте Auto и проверьте что в инфоблоке есть элементы.')
    if (schema.length === 0) validationErrors.push('Schema для выбранного инфоблока не загружена. В CMS нажмите "Обновить инфоблоки".')
    for (const field of fields) {
      const bindingState = block.cmsBindings?.props[field.name]
      if (bindingState?.mode === 'binding' && !(bindingState.binding?.field.code ?? '').trim()) {
        validationErrors.push(`Prop "${field.label}" не привязан к полю/свойству.`)
      }
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 rounded-md p-2" style={{ border: `1px solid ${labelColor}33` }}>
        <p className="text-[10px] uppercase tracking-wide" style={{ color: labelColor }}>
          Шаг 1 · Источник данных
        </p>
        <label className="grid gap-1">
          <span className="text-[10px]" style={{ color: labelColor }}>
            Режим источника данных
          </span>
          <select
            style={inputStyle}
            value={dataMode}
            onChange={(event) => applySourceToBindings({ mode: event.target.value as CmsMode })}
          >
            <option value="static">Статично</option>
            <option value="element">CMS: Элемент</option>
            <option value="list">CMS: Список</option>
          </select>
        </label>

        {dataMode !== 'static' ? (
          <>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: labelColor }}>
              Шаг 2 · Источник CMS
            </p>
            <button
              type="button"
              style={inputStyle}
              onClick={() => {
                const selected = window.localStorage.getItem('randee-cms-selected-iblock-id') ?? ''
                if (selected) applySourceToBindings({ iblockId: selected })
              }}
            >
              Использовать выбранный инфоблок из CMS
            </button>
            <label className="grid gap-1">
              <span className="text-[10px]" style={{ color: labelColor }}>
                Инфоблок CMS
              </span>
              <select
                style={inputStyle}
                value={sourceIblockId}
                onChange={(event) => {
                  const id = event.target.value
                  applySourceToBindings({ iblockId: id })
                  // Авто-подгружаем элементы если их нет в кэше
                  if (id && !cmsElementsByIblockId[id]) {
                    void fetchElementsForIblock(id)
                  }
                }}
              >
                <option value="">Выберите инфоблок</option>
                {cmsIblocks.map((iblock) => (
                  <option key={iblock.id} value={iblock.id}>
                    {iblock.name} ({iblock.id}{iblock.code ? ` · ${iblock.code}` : ''})
                  </option>
                ))}
              </select>
            </label>

            {dataMode === 'element' ? (
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: labelColor }}>
                    Элемент CMS
                  </span>
                  {sourceIblockId ? (
                    <button
                      type="button"
                      style={{ ...inputStyle, padding: '1px 6px', fontSize: 10 }}
                      disabled={loadingElementsFor === sourceIblockId}
                      onClick={() => void fetchElementsForIblock(sourceIblockId)}
                    >
                      {loadingElementsFor === sourceIblockId ? 'Загрузка...' : '↻ обновить'}
                    </button>
                  ) : null}
                </div>
                <select
                  style={inputStyle}
                  value={sourceElementId}
                  onChange={(event) => applySourceToBindings({ elementId: event.target.value })}
                >
                  {loadingElementsFor === sourceIblockId ? (
                    <option value="">Загрузка элементов...</option>
                  ) : elements.length === 0 && sourceIblockId ? (
                    <option value="">Нет элементов (нажмите ↻ обновить)</option>
                  ) : (
                    <option value="">Авто (первый элемент)</option>
                  )}
                  {elements.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} · {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-1">
              <p className="col-span-2 text-[10px] uppercase tracking-wide" style={{ color: labelColor }}>
                Шаг 3 · Маппинг пресета
              </p>
              <button type="button" style={inputStyle} onClick={() => applyPreset('hero')}>
                Пресет: Герой
              </button>
              <button type="button" style={inputStyle} onClick={() => applyPreset('news')}>
                Пресет: Новости
              </button>
            </div>
          </>
        ) : null}
      </div>

      {dataMode !== 'static' ? (
        <div className="grid gap-1 rounded-md p-2" style={{ border: `1px solid ${labelColor}33` }}>
          <p className="text-[10px]" style={{ color: labelColor }}>
            Проверка маппинга
          </p>
          {validationErrors.length === 0 ? (
            <p className="text-[11px]" style={{ color: '#22c55e' }}>
              ОК: маппинг настроен
            </p>
          ) : (
            validationErrors.map((error) => (
              <p key={error} className="text-[11px]" style={{ color: '#ef4444' }}>
                {error}
              </p>
            ))
          )}
          {validationErrors.length > 0 ? (
            <div className="mt-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                style={inputStyle}
                onClick={() => {
                  const selected = window.localStorage.getItem('randee-cms-selected-iblock-id') ?? ''
                  if (selected) applySourceToBindings({ iblockId: selected })
                }}
              >
                Исправить: выбранный инфоблок
              </button>
              <button type="button" style={inputStyle} onClick={() => applyPreset('hero')}>
                Исправить: пресет Герой
              </button>
              <button type="button" style={inputStyle} onClick={() => applyPreset('news')}>
                Исправить: пресет Новости
              </button>
              <button type="button" style={inputStyle} onClick={applyAutoMapFields}>
                Исправить: авто-маппинг
              </button>
              <button type="button" style={inputStyle} onClick={() => setShowAdvanced(true)}>
                Исправить: расширенный
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {fields.map((field) => {
        const value = block.props[field.name] ?? ''
        const bindingState = block.cmsBindings?.props[field.name]
        const selectedKind = bindingState?.binding?.field.kind ?? 'field'
        const schemaByKind = schema.filter((item) =>
          selectedKind === 'property' ? item.kind === 'property' : item.kind !== 'property'
        )

        return (
          <label key={field.name} className="grid gap-1">
            <span className="text-[10px]" style={{ color: labelColor }}>
              {field.label}
            </span>

            {dataMode !== 'static' ? (
              showAdvanced ? (
                <div className="grid gap-1 rounded-md p-2" style={{ border: `1px solid ${labelColor}33` }}>
                  <select
                    style={inputStyle}
                    value={selectedKind}
                    onChange={(event) => {
                      const kind = (event.target.value === 'property' ? 'property' : 'field') as CmsFieldKind
                      const current = bindingState?.mode === 'binding' ? bindingState : buildDefaultBinding(value, sourceSiteUrl, sourceIblockId, dataMode)
                      store.getState().updateBlockCmsBinding(block.id, field.name, {
                        ...current,
                        mode: 'binding',
                        binding: {
                          ...current.binding,
                          source: {
                            ...current.binding!.source,
                            siteUrl: sourceSiteUrl,
                            iblockId: sourceIblockId,
                            mode: dataMode,
                            elementId: dataMode === 'element' ? sourceElementId : ''
                          },
                          field: {
                            ...(current.binding?.field ?? { code: '' }),
                            kind
                          }
                        }
                      })
                    }}
                  >
                    <option value="field">Поле</option>
                    <option value="property">Свойство</option>
                  </select>

                  <select
                    style={inputStyle}
                    value={bindingState?.binding?.field.code ?? ''}
                    onChange={(event) => {
                      const current = bindingState?.mode === 'binding' ? bindingState : buildDefaultBinding(value, sourceSiteUrl, sourceIblockId, dataMode)
                      store.getState().updateBlockCmsBinding(block.id, field.name, {
                        ...current,
                        mode: 'binding',
                        binding: {
                          ...current.binding,
                          source: {
                            ...current.binding!.source,
                            siteUrl: sourceSiteUrl,
                            iblockId: sourceIblockId,
                            mode: dataMode,
                            elementId: dataMode === 'element' ? sourceElementId : ''
                          },
                          field: {
                            ...(current.binding?.field ?? { kind: 'field' as const }),
                            code: event.target.value
                          },
                          fallback: current.binding?.fallback ?? value
                        }
                      })
                    }}
                  >
                    <option value="">Выберите {selectedKind === 'property' ? 'свойство' : 'поле'}</option>
                    {schemaByKind.map((item) => (
                      <option key={`${item.kind}:${item.code}`} value={item.code}>
                        {item.code} ({item.label})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null
            ) : null}

            {renderFieldInput(
              field,
              value,
              (next) => {
                store.getState().updateBlockProps(block.id, { [field.name]: next })
              },
              inputStyle
            )}
          </label>
        )
      })}

      {dataMode !== 'static' ? (
        <button
          type="button"
          style={inputStyle}
          onClick={() => setShowAdvanced((value) => !value)}
        >
          {showAdvanced ? 'Скрыть расширенный маппинг' : 'Показать расширенный маппинг'}
        </button>
      ) : null}
    </div>
  )
}
