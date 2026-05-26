'use client'

import * as React from 'react'
import type { BuilderStore, PageBlock } from '@randee/builder'
import type { StoreApi } from 'zustand'

type SliderInspectorProps = {
  block: PageBlock
  store: StoreApi<BuilderStore>
  inputStyle: React.CSSProperties
  labelColor: string
}

type CmsIblock = { id: string; name: string; code: string }

export function SliderInspector({ block, store, inputStyle, labelColor }: SliderInspectorProps) {
  const [cmsIblocks, setCmsIblocks] = React.useState<CmsIblock[]>([])
  const [cmsConfigured, setCmsConfigured] = React.useState(false)
  const [sampleCount, setSampleCount] = React.useState(0)
  const [lastRefreshAt, setLastRefreshAt] = React.useState<string>('')

  React.useEffect(() => {
    try {
      const siteUrl = (window.localStorage.getItem('randee-cms-site-url') ?? '').trim()
      const apiKey = (window.localStorage.getItem('randee-cms-api-key') ?? '').trim()
      const connectorPath = (window.localStorage.getItem('randee-cms-connector-path') ?? '').trim()
      setCmsConfigured(Boolean(siteUrl && apiKey && connectorPath))
      const iblocksRaw = window.localStorage.getItem('randee-cms-iblocks')
      if (iblocksRaw) {
        const parsed = JSON.parse(iblocksRaw) as Array<{ id?: string; name?: string; code?: string }>
        setCmsIblocks(parsed.map((item) => ({ id: item.id ?? '', name: item.name ?? '', code: item.code ?? '' })))
      }
      const elementsRaw = window.localStorage.getItem('randee-cms-elements-by-iblock-id')
      const selectedIblock = block.props.cmsIblockId ?? ''
      if (elementsRaw && selectedIblock) {
        const byIblock = JSON.parse(elementsRaw) as Record<string, Array<{ id: string; name: string }>>
        setSampleCount((byIblock[selectedIblock] ?? []).length)
      }
    } catch {
      // ignore
    }
  }, [block.props.cmsIblockId])

  const update = (patch: Record<string, string>) => store.getState().updateBlockProps(block.id, patch)

  const configureSwiper = () => {
    const selectedIblockId = window.localStorage.getItem('randee-cms-selected-iblock-id') ?? ''
    update({
      title: 'Анонсы',
      cmsIblockId: selectedIblockId,
      cmsLimit: '8',
      cmsAutoplayMs: '3500',
      cmsShowText: 'true',
      cmsImageField: 'previewPicture'
    })
    const enabled = store.getState().page.vendors ?? []
    if (!enabled.includes('swiper')) store.getState().togglePageVendor('swiper')
  }

  const refreshNow = () => {
    update({ cmsReloadKey: String(Date.now()) })
    setLastRefreshAt(new Date().toLocaleTimeString())
  }

  const p = block.props

  return (
    <div className="grid gap-2">
      <p className="text-[11px]" style={{ color: labelColor }}>
        Специализированная панель CMS Slider.
      </p>
      <p className="text-[10px]" style={{ color: cmsConfigured ? '#22c55e' : '#ef4444' }}>
        {cmsConfigured ? 'CMS подключение найдено.' : 'CMS подключение не настроено.'}
      </p>
      {!cmsConfigured ? (
        <div className="grid gap-1 rounded-md p-2" style={{ border: `1px solid ${labelColor}33` }}>
          <p className="text-[10px]" style={{ color: labelColor }}>Quick onboarding</p>
          <p className="text-[10px]" style={{ color: labelColor }}>
            1) Откройте CMS экран → заполните Site URL/API key/Connector Path.
          </p>
          <p className="text-[10px]" style={{ color: labelColor }}>
            2) Нажмите Проверить подключение и Обновить инфоблоки.
          </p>
          <p className="text-[10px]" style={{ color: labelColor }}>
            3) Вернитесь сюда и нажмите Configure as Swiper announcements.
          </p>
        </div>
      ) : null}
      <div className="grid gap-1 rounded-md p-2" style={{ border: `1px solid ${labelColor}33` }}>
        <p className="text-[10px]" style={{ color: labelColor }}>Live status</p>
        <p className="text-[10px]" style={{ color: labelColor }}>
          Iblock: {(p.cmsIblockId ?? '').trim() || 'not selected'}
        </p>
        <p className="text-[10px]" style={{ color: labelColor }}>
          Sample elements: {sampleCount}
        </p>
        <p className="text-[10px]" style={{ color: labelColor }}>
          Last refresh: {lastRefreshAt || 'not yet'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <button type="button" style={inputStyle} onClick={configureSwiper}>
          Configure as Swiper announcements
        </button>
        <button type="button" style={inputStyle} onClick={refreshNow}>
          Refresh slides now
        </button>
      </div>

      <label className="grid gap-1">
        <span className="text-[10px]" style={{ color: labelColor }}>Заголовок</span>
        <input style={inputStyle} value={p.title ?? ''} onChange={(e) => update({ title: e.target.value })} />
      </label>

      <label className="grid gap-1">
        <span className="text-[10px]" style={{ color: labelColor }}>Iblock</span>
        <select style={inputStyle} value={p.cmsIblockId ?? ''} onChange={(e) => update({ cmsIblockId: e.target.value })}>
          <option value="">Выберите инфоблок</option>
          {cmsIblocks.map((ib) => (
            <option key={ib.id} value={ib.id}>
              {ib.name} ({ib.id}{ib.code ? ` · ${ib.code}` : ''})
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[10px]" style={{ color: labelColor }}>Слайдов</span>
          <input style={inputStyle} type="number" value={p.cmsLimit ?? '8'} onChange={(e) => update({ cmsLimit: e.target.value })} />
        </label>
        <label className="grid gap-1">
          <span className="text-[10px]" style={{ color: labelColor }}>Autoplay (мс)</span>
          <input style={inputStyle} type="number" value={p.cmsAutoplayMs ?? '3500'} onChange={(e) => update({ cmsAutoplayMs: e.target.value })} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-[10px]" style={{ color: labelColor }}>Показывать анонс</span>
          <select style={inputStyle} value={p.cmsShowText ?? 'true'} onChange={(e) => update({ cmsShowText: e.target.value })}>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[10px]" style={{ color: labelColor }}>Поле картинки</span>
          <select style={inputStyle} value={p.cmsImageField ?? 'previewPicture'} onChange={(e) => update({ cmsImageField: e.target.value })}>
            <option value="previewPicture">previewPicture</option>
            <option value="detailPicture">detailPicture</option>
          </select>
        </label>
      </div>
    </div>
  )
}
