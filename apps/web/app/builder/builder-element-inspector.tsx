'use client'

import * as React from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDown,
  ArrowRight,
  Link2,
  Maximize2,
  Minus,
  Plus,
  LayoutGrid,
  Palette,
  Settings2
} from 'lucide-react'
import type { ComponentElement, ElementDesignSettings } from '@randee/builder'
import type { InspectorTheme } from './builder-inspector-ui'
import { InspectorLabel, InspectorSection, InspectorTabs, InspectorThemeProvider } from './builder-inspector-ui'

type Patch = Partial<ElementDesignSettings>
type OnPatch = (patch: Patch) => void

// ─── Small shared primitives ─────────────────────────────────────────────────

function useTheme() {
  const theme = React.useContext(ThemeCtx)
  if (!theme) throw new Error('ThemeCtx required')
  return theme
}

const ThemeCtx = React.createContext<InspectorTheme | null>(null)

function fieldStyle(t: InspectorTheme): React.CSSProperties {
  return { border: `1px solid ${t.divider}`, background: t.inputBg, color: t.text }
}

function NumInput({ value, onChange, min, max, placeholder, suffix, className = 'w-full' }: {
  value: number | null | undefined
  onChange: (v: number | null) => void
  min?: number
  max?: number
  placeholder?: string
  suffix?: string
  className?: string
}) {
  const t = useTheme()
  return (
    <div className={`flex h-7 items-center overflow-hidden rounded-md ${className}`} style={fieldStyle(t)}>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        placeholder={placeholder ?? '—'}
        className="min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none"
        style={{ color: t.text }}
        onChange={(e) => {
          if (e.target.value === '') { onChange(null); return }
          const n = Number(e.target.value)
          if (Number.isFinite(n)) onChange(max !== undefined ? Math.min(max, Math.max(min ?? -Infinity, n)) : n)
        }}
      />
      {suffix ? <span className="pr-2 text-[10px]" style={{ color: t.textMuted }}>{suffix}</span> : null}
    </div>
  )
}

function ModeSelect({ value, options, onChange }: {
  value: string | undefined
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  const t = useTheme()
  return (
    <select
      value={value ?? ''}
      className="h-7 shrink-0 rounded-md px-1.5 text-[10px] outline-none"
      style={fieldStyle(t)}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function IconBtn({ active, onClick, label, children }: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className="flex h-7 w-7 items-center justify-center rounded-md border transition"
      style={{
        borderColor: active ? t.accent : t.divider,
        background: active ? `${t.accent}18` : t.inputBg,
        color: active ? t.accent : t.textMuted,
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// ─── Section: Position ───────────────────────────────────────────────────────

function PositionSection({ design, onPatch }: { design: ElementDesignSettings; onPatch: OnPatch }) {
  const t = useTheme()
  const pos = design.position ?? { type: 'relative' as const }
  const type = pos.type ?? 'relative'

  return (
    <InspectorSection title="Позиция">
      <div className="grid gap-2">
        <div className="grid gap-1">
          <InspectorLabel>Тип</InspectorLabel>
          <ModeSelect
            value={type}
            options={[
              { value: 'relative', label: 'Относительная' },
              { value: 'absolute', label: 'Абсолютная' },
              { value: 'fixed', label: 'Фиксированная' },
              { value: 'sticky', label: 'Прилипающая' }
            ]}
            onChange={(v) => onPatch({ position: { ...pos, type: v as 'relative' | 'absolute' | 'fixed' | 'sticky' } })}
          />
        </div>
        {type !== 'relative' ? (
          <div className="grid grid-cols-2 gap-2">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <label key={side} className="grid gap-1">
                <InspectorLabel>{{ top: 'Сверху', right: 'Справа', bottom: 'Снизу', left: 'Слева' }[side]}</InspectorLabel>
                <NumInput
                  value={pos[side] as number | null}
                  onChange={(v) => onPatch({ position: { ...pos, [side]: v } })}
                  placeholder="—"
                  suffix="px"
                />
              </label>
            ))}
          </div>
        ) : null}
        {type !== 'relative' ? (
          <label className="grid gap-1">
            <InspectorLabel>Z-индекс</InspectorLabel>
            <NumInput value={pos.zIndex as number | null} onChange={(v) => onPatch({ position: { ...pos, zIndex: v } })} placeholder="auto" />
          </label>
        ) : null}
      </div>
    </InspectorSection>
  )
}

// ─── Section: Size ───────────────────────────────────────────────────────────

const SIZE_MODES = [
  { value: 'fill', label: 'Заполнить' },
  { value: 'fit', label: 'По размеру' },
  { value: 'relative', label: '%' },
  { value: 'fixed', label: 'px' }
]

function SizeSection({ design, onPatch }: { design: ElementDesignSettings; onPatch: OnPatch }) {
  const t = useTheme()
  const sz = design.size ?? {}
  const [showMinMax, setShowMinMax] = React.useState(!!(sz.minWidth || sz.maxWidth || sz.minHeight || sz.maxHeight))

  const wm = sz.widthMode ?? 'fill'
  const hm = sz.heightMode ?? 'fit'

  return (
    <InspectorSection title="Размер">
      <div className="grid gap-2">
        {/* Width */}
        <label className="grid gap-1">
          <InspectorLabel>Ширина</InspectorLabel>
          <div className="flex gap-1.5">
            {wm === 'fixed' ? (
              <NumInput value={sz.width} onChange={(v) => onPatch({ size: { ...sz, width: v ?? undefined } })} min={0} suffix="px" />
            ) : wm === 'relative' ? (
              <NumInput value={sz.widthPercent} onChange={(v) => onPatch({ size: { ...sz, widthPercent: v ?? 100 } })} min={0} max={100} suffix="%" />
            ) : (
              <div className="flex h-7 flex-1 items-center rounded-md px-2 text-[11px]" style={fieldStyle(t)}>
                <span style={{ color: t.textMuted }}>{wm === 'fill' ? '100%' : 'auto'}</span>
              </div>
            )}
            <ModeSelect value={wm} options={SIZE_MODES} onChange={(v) => onPatch({ size: { ...sz, widthMode: v as typeof wm } })} />
          </div>
        </label>

        {/* Height */}
        <label className="grid gap-1">
          <InspectorLabel>Высота</InspectorLabel>
          <div className="flex gap-1.5">
            {hm === 'fixed' ? (
              <NumInput value={sz.height} onChange={(v) => onPatch({ size: { ...sz, height: v ?? undefined } })} min={0} suffix="px" />
            ) : (
              <div className="flex h-7 flex-1 items-center rounded-md px-2 text-[11px]" style={fieldStyle(t)}>
                <span style={{ color: t.textMuted }}>{hm === 'fill' ? '100%' : 'auto'}</span>
              </div>
            )}
            <ModeSelect
              value={hm}
              options={[
                { value: 'fill', label: 'Заполнить' },
                { value: 'fit', label: 'По размеру' },
                { value: 'fixed', label: 'px' }
              ]}
              onChange={(v) => onPatch({ size: { ...sz, heightMode: v as typeof hm } })}
            />
          </div>
        </label>

        {/* Min / Max toggle */}
        <button
          type="button"
          className="flex items-center gap-1 text-[10px]"
          style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => setShowMinMax((v) => !v)}
        >
          <Maximize2 className="h-3 w-3" />
          Мин / Макс
        </button>

        {showMinMax ? (
          <div className="grid grid-cols-2 gap-2">
            {([['minWidth', 'Мин Ш'], ['maxWidth', 'Макс Ш'], ['minHeight', 'Мин В'], ['maxHeight', 'Макс В']] as const).map(([key, label]) => (
              <label key={key} className="grid gap-1">
                <InspectorLabel>{label}</InspectorLabel>
                <NumInput
                  value={sz[key] as number | null}
                  onChange={(v) => onPatch({ size: { ...sz, [key]: v } })}
                  min={0}
                  placeholder="—"
                  suffix="px"
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </InspectorSection>
  )
}

// ─── Section: Layout ─────────────────────────────────────────────────────────

function LayoutSection({ design, onPatch }: { design: ElementDesignSettings; onPatch: OnPatch }) {
  const t = useTheme()
  const lay = design.layout ?? {}
  const type = lay.type ?? 'stack'
  const dir = lay.direction ?? 'vertical'

  const DISTRIBUTE_OPTIONS = [
    { value: 'start', label: 'Начало' },
    { value: 'center', label: 'По центру' },
    { value: 'end', label: 'Конец' },
    { value: 'space-between', label: 'Равномерно' },
    { value: 'space-around', label: 'С промежутками' },
    { value: 'space-evenly', label: 'Через равные' }
  ]

  const ALIGN_ICONS = [
    { value: 'start', icon: dir === 'horizontal' ? AlignStartHorizontal : AlignStartVertical, label: 'Начало' },
    { value: 'center', icon: dir === 'horizontal' ? AlignCenterHorizontal : AlignCenterVertical, label: 'По центру' },
    { value: 'end', icon: dir === 'horizontal' ? AlignEndHorizontal : AlignEndVertical, label: 'Конец' },
    { value: 'stretch', icon: Link2, label: 'Растянуть' }
  ]

  const patch = (update: Partial<typeof lay>) => onPatch({ layout: { ...lay, ...update } })
  const gap = lay.gap ?? 0
  const pt = lay.paddingTop ?? 0
  const pr = lay.paddingRight ?? 0
  const pb = lay.paddingBottom ?? 0
  const pl = lay.paddingLeft ?? 0
  const [indivPad, setIndivPad] = React.useState(pt !== pr || pt !== pb || pt !== pl)

  return (
    <InspectorSection title="Макет">
      <div className="grid gap-2.5">
        {/* Stack / Grid */}
        <div className="grid gap-1">
          <InspectorLabel>Тип</InspectorLabel>
          <div className="flex rounded-md p-0.5" style={{ background: t.segmentTrack }}>
            {(['stack', 'grid'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className="flex-1 rounded py-1 text-[11px] font-medium transition"
                style={{
                  background: type === v ? t.segmentActive : 'transparent',
                  color: type === v ? t.accent : t.textMuted,
                  boxShadow: type === v ? t.segmentShadow : 'none',
                  border: 'none', cursor: 'pointer'
                }}
                onClick={() => patch({ type: v })}
              >
                {v === 'stack' ? 'Стек' : 'Сетка'}
              </button>
            ))}
          </div>
        </div>

        {type === 'stack' ? (
          <>
            {/* Direction */}
            <div className="grid gap-1">
              <InspectorLabel>Направление</InspectorLabel>
              <div className="flex gap-1">
                <IconBtn active={dir === 'horizontal'} onClick={() => patch({ direction: 'horizontal' })} label="Горизонтально">
                  <ArrowRight className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn active={dir === 'vertical'} onClick={() => patch({ direction: 'vertical' })} label="Вертикально">
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            </div>

            {/* Distribute */}
            <div className="grid gap-1">
              <InspectorLabel>Распределение</InspectorLabel>
              <ModeSelect value={lay.distribute ?? 'start'} options={DISTRIBUTE_OPTIONS} onChange={(v) => patch({ distribute: v as typeof lay.distribute })} />
            </div>

            {/* Align */}
            <div className="grid gap-1">
              <InspectorLabel>Выравнивание</InspectorLabel>
              <div className="flex gap-1">
                {ALIGN_ICONS.map(({ value, icon: Icon, label }) => (
                  <IconBtn key={value} active={(lay.align ?? 'stretch') === value} onClick={() => patch({ align: value as typeof lay.align })} label={label}>
                    <Icon className="h-3.5 w-3.5" />
                  </IconBtn>
                ))}
              </div>
            </div>

            {/* Wrap */}
            <div className="flex items-center justify-between">
              <InspectorLabel>Перенос</InspectorLabel>
              <div className="flex rounded-md p-0.5" style={{ background: t.segmentTrack }}>
                {([['Да', true], ['Нет', false]] as const).map(([label, val]) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded px-2.5 py-0.5 text-[11px] font-medium"
                    style={{
                      background: (lay.wrap ?? false) === val ? t.segmentActive : 'transparent',
                      color: (lay.wrap ?? false) === val ? t.accent : t.textMuted,
                      border: 'none', cursor: 'pointer'
                    }}
                    onClick={() => patch({ wrap: val })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {/* Gap */}
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <InspectorLabel>Промежуток</InspectorLabel>
            <div className="flex h-7 w-16 items-center overflow-hidden rounded-md" style={fieldStyle(t)}>
              <input
                type="number" min={0} max={200}
                value={gap}
                className="w-full bg-transparent px-2 text-[11px] outline-none"
                style={{ color: t.text }}
                onChange={(e) => patch({ gap: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>
          <input
            type="range" min={0} max={120} value={gap}
            className="w-full"
            style={{ accentColor: t.accent }}
            onChange={(e) => patch({ gap: Number(e.target.value) })}
          />
        </div>

        {/* Padding */}
        <div className="grid gap-1">
          <div className="flex items-center justify-between">
            <InspectorLabel>Отступы</InspectorLabel>
            <button
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded"
              style={{
                color: indivPad ? t.accent : t.textMuted,
                background: indivPad ? `${t.accent}18` : 'transparent',
                border: `1px solid ${indivPad ? `${t.accent}55` : t.divider}`,
                cursor: 'pointer'
              }}
              title="Индивидуальные отступы"
              onClick={() => setIndivPad((v) => !v)}
            >
              <Link2 className="h-3 w-3" />
            </button>
          </div>

          {indivPad ? (
            <div
              className="relative mx-auto w-full select-none rounded-md py-2"
              style={{ border: `1px dashed ${t.divider}` }}
            >
              {/* Top */}
              <div className="flex justify-center pb-1">
                <div className="flex h-6 w-10 items-center justify-center rounded" style={fieldStyle(t)}>
                  <input type="number" min={0} value={pt} className="w-full bg-transparent text-center text-[11px] outline-none" style={{ color: t.text }} onChange={(e) => patch({ paddingTop: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
              </div>
              {/* Middle */}
              <div className="flex items-center justify-between px-2">
                <div className="flex h-6 w-10 items-center justify-center rounded" style={fieldStyle(t)}>
                  <input type="number" min={0} value={pl} className="w-full bg-transparent text-center text-[11px] outline-none" style={{ color: t.text }} onChange={(e) => patch({ paddingLeft: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
                <div className="mx-2 flex-1 rounded" style={{ height: 28, background: t.hover, border: `1px dashed ${t.divider}`, opacity: 0.5 }} />
                <div className="flex h-6 w-10 items-center justify-center rounded" style={fieldStyle(t)}>
                  <input type="number" min={0} value={pr} className="w-full bg-transparent text-center text-[11px] outline-none" style={{ color: t.text }} onChange={(e) => patch({ paddingRight: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
              </div>
              {/* Bottom */}
              <div className="flex justify-center pt-1">
                <div className="flex h-6 w-10 items-center justify-center rounded" style={fieldStyle(t)}>
                  <input type="number" min={0} value={pb} className="w-full bg-transparent text-center text-[11px] outline-none" style={{ color: t.text }} onChange={(e) => patch({ paddingBottom: Math.max(0, Number(e.target.value) || 0) })} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-7 items-center overflow-hidden rounded-md" style={fieldStyle(t)}>
              <input
                type="number" min={0}
                value={pt}
                className="w-full bg-transparent px-2 text-[11px] outline-none"
                style={{ color: t.text }}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value) || 0)
                  patch({ paddingTop: v, paddingRight: v, paddingBottom: v, paddingLeft: v })
                }}
              />
              <span className="pr-2 text-[10px]" style={{ color: t.textMuted }}>px</span>
            </div>
          )}
          {indivPad ? (
            <div className="grid grid-cols-4 text-center">
              {(['T', 'R', 'B', 'L'] as const).map((l) => (
                <span key={l} className="text-[9px]" style={{ color: t.textMuted }}>{l}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </InspectorSection>
  )
}

// ─── Section: Effects ────────────────────────────────────────────────────────

function EffectsSection({ design, onPatch }: { design: ElementDesignSettings; onPatch: OnPatch }) {
  const t = useTheme()
  const [open, setOpen] = React.useState(false)

  return (
    <InspectorSection title="Эффекты" onAdd={() => setOpen(true)}>
      {open ? (
        <div className="grid gap-2">
          <label className="grid gap-1">
            <InspectorLabel>Прозрачность</InspectorLabel>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} value={design.opacity ?? 100} className="min-w-0 flex-1" style={{ accentColor: t.accent }} onChange={(e) => onPatch({ opacity: Number(e.target.value) })} />
              <div className="flex h-7 w-12 items-center overflow-hidden rounded-md" style={{ border: `1px solid ${t.divider}`, background: t.inputBg }}>
                <input type="number" min={0} max={100} value={design.opacity ?? 100} className="w-full bg-transparent px-2 text-[11px] outline-none" style={{ color: t.text }} onChange={(e) => onPatch({ opacity: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
              </div>
            </div>
          </label>
          <label className="grid gap-1">
            <InspectorLabel>Скругление</InspectorLabel>
            <div className="flex h-7 items-center overflow-hidden rounded-md" style={{ border: `1px solid ${t.divider}`, background: t.inputBg }}>
              <input type="number" min={0} max={256} value={design.borderRadius ?? 0} className="min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none" style={{ color: t.text }} onChange={(e) => onPatch({ borderRadius: Math.max(0, Number(e.target.value) || 0) })} />
              <span className="pr-2 text-[10px]" style={{ color: t.textMuted }}>px</span>
            </div>
          </label>
          <label className="grid gap-1">
            <InspectorLabel>Заливка</InspectorLabel>
            <div className="flex items-center gap-2">
              <label className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md" style={{ border: `1px solid ${t.divider}` }}>
                <span className="block h-full w-full" style={{ background: design.fill ? `#${design.fill.replace('#', '')}` : 'transparent' }} />
                <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={design.fill ? `#${design.fill.replace('#', '')}` : '#ffffff'} onChange={(e) => onPatch({ fill: e.target.value.replace('#', '').toUpperCase() })} />
              </label>
              <div className="flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md" style={{ border: `1px solid ${t.divider}`, background: t.inputBg }}>
                <input type="text" maxLength={6} value={(design.fill ?? '').replace('#', '').toUpperCase()} placeholder="FFFFFF" className="min-w-0 flex-1 bg-transparent px-2 text-[11px] uppercase outline-none" style={{ color: t.text }} onChange={(e) => onPatch({ fill: e.target.value.replace(/[^a-fA-F0-9]/gi, '').slice(0, 6).toUpperCase() || undefined })} />
              </div>
            </div>
          </label>
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: t.textMuted }}>Нажмите + чтобы добавить эффект</p>
      )}
    </InspectorSection>
  )
}

// ─── Align toolbar ───────────────────────────────────────────────────────────

function ElementAlignToolbar() {
  const t = useTheme()
  const items = [
    { label: 'Выровнять по левому краю', icon: AlignStartVertical },
    { label: 'Выровнять по центру (гор.)', icon: AlignCenterVertical },
    { label: 'Выровнять по правому краю', icon: AlignEndVertical },
    { label: 'Выровнять по верхнему краю', icon: AlignStartHorizontal },
    { label: 'Выровнять по центру (верт.)', icon: AlignCenterHorizontal },
    { label: 'Выровнять по нижнему краю', icon: AlignEndHorizontal }
  ]
  return (
    <div className="flex items-center justify-between px-2 py-1.5" style={{ borderBottom: `1px solid ${t.divider}` }}>
      <div className="flex items-center gap-0.5">
        {items.slice(0, 3).map(({ label, icon: Icon }) => (
          <button key={label} type="button" aria-label={label} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      <div className="mx-1 h-4 w-px" style={{ background: t.divider }} />
      <div className="flex items-center gap-0.5">
        {items.slice(3).map(({ label, icon: Icon }) => (
          <button key={label} type="button" aria-label={label} className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      <div className="mx-1 h-4 w-px" style={{ background: t.divider }} />
      <button type="button" aria-label="Добавить" className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="Удалить" className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}>
        <Minus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export type BuilderElementInspectorProps = {
  element: ComponentElement
  theme: InspectorTheme
  onPatch: (patch: Patch) => void
  onRemove: () => void
  contentFields?: React.ReactNode
  compactTabs?: boolean
}

export function BuilderElementInspector({
  element,
  theme,
  onPatch,
  onRemove,
  contentFields,
  compactTabs = false
}: BuilderElementInspectorProps) {
  const design = element.design ?? {}
  const [tab, setTab] = React.useState<'layout' | 'style' | 'advanced'>('layout')

  return (
    <ThemeCtx.Provider value={theme}>
      <InspectorThemeProvider theme={theme}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <InspectorTabs
            value={tab}
            compact={compactTabs}
            onChange={(value) => setTab(value as 'layout' | 'style' | 'advanced')}
            tabs={[
              { value: 'layout', label: 'Макет', icon: LayoutGrid },
              { value: 'style', label: 'Стиль', icon: Palette },
              { value: 'advanced', label: 'Дополнительно', icon: Settings2 },
            ]}
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === 'layout' ? (
              <>
                <ElementAlignToolbar />
                {contentFields ? (
                  <InspectorSection title={`Содержимое · ${element.name ?? element.elementId}`}>
                    {contentFields}
                  </InspectorSection>
                ) : null}
                <PositionSection design={design} onPatch={onPatch} />
                <SizeSection design={design} onPatch={onPatch} />
                <LayoutSection design={design} onPatch={onPatch} />
              </>
            ) : null}

            {tab === 'style' ? (
              <>
                <EffectsSection design={design} onPatch={onPatch} />
                <InspectorSection title="Фоновые слои" onAdd={() => {}}>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>
                    Нажмите + чтобы добавить фоновые/оверлейные слои
                  </p>
                </InspectorSection>
              </>
            ) : null}

            {tab === 'advanced' ? (
              <>
                <InspectorSection title="Наложения" onAdd={() => {}}>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Нажмите + чтобы добавить overlay</p>
                </InspectorSection>

                <div className="px-3 py-3">
                  <button
                    type="button"
                    className="h-7 w-full rounded-md text-[11px] font-medium"
                    style={{ background: '#2a1010', color: '#ef4444', border: '1px solid #3a1010', cursor: 'pointer' }}
                    onClick={onRemove}
                  >
                    Удалить элемент
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </InspectorThemeProvider>
    </ThemeCtx.Provider>
  )
}
