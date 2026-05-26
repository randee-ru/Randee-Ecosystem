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
  Info,
  Link2,
  Minus,
  Plus,
  Square
} from 'lucide-react'

export type InspectorTheme = {
  panel: string
  divider: string
  text: string
  textSecondary: string
  textMuted: string
  hover: string
  inputBg: string
  accent: string
  segmentTrack: string
  segmentActive: string
  segmentShadow: string
}

const InspectorThemeContext = React.createContext<InspectorTheme | null>(null)

export function InspectorThemeProvider({
  theme,
  children
}: {
  theme: InspectorTheme
  children: React.ReactNode
}) {
  return <InspectorThemeContext.Provider value={theme}>{children}</InspectorThemeContext.Provider>
}

function useInspectorTheme() {
  const theme = React.useContext(InspectorThemeContext)
  if (!theme) throw new Error('InspectorThemeProvider is required')
  return theme
}

/** Framer-style: solid bg, no border, 4 px radius */
function fieldStyle(theme: InspectorTheme): React.CSSProperties {
  return {
    background: theme.inputBg,
    color: theme.text,
    border: 'none',
  }
}

export function InspectorSection({
  title,
  children,
  onAdd,
  info
}: {
  title: string
  children?: React.ReactNode
  onAdd?: () => void
  info?: boolean
}) {
  const theme = useInspectorTheme()

  return (
    <section style={{ borderBottom: `1px solid ${theme.divider}` }} className="py-2.5">
      <div className="mb-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          {/* Framer-style: 10 px uppercase muted label */}
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: theme.textMuted }}
          >
            {title}
          </span>
          {info ? <Info className="h-3 w-3" style={{ color: theme.textMuted }} /> : null}
        </div>
        {onAdd ? (
          <button
            type="button"
            className="flex h-5 w-5 items-center justify-center rounded"
            style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = theme.hover
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent'
            }}
            onClick={onAdd}
            aria-label={`Add ${title}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {children ? <div className="px-3">{children}</div> : null}
    </section>
  )
}

export function InspectorLabel({ children }: { children: React.ReactNode }) {
  const theme = useInspectorTheme()
  return (
    <span className="text-[10px] tracking-[0.03em]" style={{ color: theme.textMuted }}>
      {children}
    </span>
  )
}

export function InspectorNumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  max?: number
}) {
  const theme = useInspectorTheme()

  return (
    <label className="grid gap-1">
      <InspectorLabel>{label}</InspectorLabel>
      <div className="flex h-6 items-center overflow-hidden rounded" style={fieldStyle(theme)}>
        <input
          type="number"
          className="min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none"
          style={{ color: theme.text }}
          value={value}
          min={min}
          max={max}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(max !== undefined ? Math.min(max, Math.max(min, next)) : Math.max(min, next))
          }}
        />
        {suffix ? (
          <span className="pr-2 text-[10px] uppercase" style={{ color: theme.textMuted }}>
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  )
}

export function InspectorSelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const theme = useInspectorTheme()

  return (
    <label className="grid gap-1">
      <InspectorLabel>{label}</InspectorLabel>
      <select
        className="h-6 rounded px-2 text-[11px] outline-none"
        style={fieldStyle(theme)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function InspectorSegmented({
  value,
  options,
  onChange
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const theme = useInspectorTheme()

  return (
    <div className="flex rounded-md p-0.5" style={{ background: theme.segmentTrack }}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className="flex-1 rounded px-2 py-1 text-[11px] font-medium transition"
            style={{
              background: active ? theme.segmentActive : 'transparent',
              color: active ? theme.accent : theme.textMuted,
              boxShadow: active ? theme.segmentShadow : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function InspectorTabs({
  value,
  tabs,
  onChange,
  compact = false
}: {
  value: string
  tabs: Array<{
    value: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }>
  onChange: (value: string) => void
  compact?: boolean
}) {
  const theme = useInspectorTheme()

  return (
    <div
      className="flex"
      role="tablist"
      style={{ borderBottom: `1px solid ${theme.divider}` }}
    >
      {tabs.map(({ value: tabValue, label, icon: Icon }) => {
        const active = tabValue === value
        return (
          <button
            key={tabValue}
            type="button"
            role="tab"
            aria-selected={active}
            className="relative flex h-8 flex-1 items-center justify-center gap-1.5 text-[11px] font-medium"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: active ? theme.text : theme.textMuted,
              /* underline indicator */
              borderBottom: active ? `2px solid ${theme.accent}` : '2px solid transparent',
              marginBottom: -1,
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = theme.textSecondary }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = theme.textMuted }}
            onClick={() => onChange(tabValue)}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {compact
              ? <span className="sr-only">{label}</span>
              : <span>{label}</span>
            }
          </button>
        )
      })}
    </div>
  )
}

export function InspectorIconToggle({
  active,
  onClick,
  label,
  children
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  const theme = useInspectorTheme()

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className="flex h-6 w-6 items-center justify-center rounded border transition"
      style={{
        borderColor: active ? theme.accent : theme.divider,
        background: active ? `${theme.accent}14` : theme.inputBg,
        color: active ? theme.accent : theme.textMuted,
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function InspectorAlignToolbar({
  align,
  distribute,
  onAlign,
  onDistribute
}: {
  align?: string
  distribute?: string
  onAlign?: (value: string) => void
  onDistribute?: (value: string) => void
}) {
  const theme = useInspectorTheme()

  const alignItems = [
    { value: 'start', label: 'Align left', icon: AlignStartVertical },
    { value: 'center', label: 'Align center horizontal', icon: AlignCenterVertical },
    { value: 'end', label: 'Align right', icon: AlignEndVertical }
  ]
  const distributeItems = [
    { value: 'start', label: 'Align top', icon: AlignStartHorizontal },
    { value: 'center', label: 'Align center vertical', icon: AlignCenterHorizontal },
    { value: 'end', label: 'Align bottom', icon: AlignEndHorizontal }
  ]

  const btn = (active: boolean, label: string, Icon: React.ElementType, onClick?: () => void) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      aria-pressed={active}
      className="flex h-6 w-6 items-center justify-center rounded transition"
      style={{
        color: active ? theme.accent : theme.textMuted,
        background: active ? `${theme.accent}18` : 'transparent',
        border: `1px solid ${active ? `${theme.accent}55` : 'transparent'}`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = theme.hover }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5"
      style={{ borderBottom: `1px solid ${theme.divider}` }}
    >
      <div className="flex items-center gap-0.5">
        {alignItems.map(({ value, label, icon: Icon }) =>
          btn(align === value, label, Icon, onAlign ? () => onAlign(value) : undefined)
        )}
      </div>
      <div className="mx-1 h-4 w-px" style={{ background: theme.divider }} />
      <div className="flex items-center gap-0.5">
        {distributeItems.map(({ value, label, icon: Icon }) =>
          btn(distribute === value, label, Icon, onDistribute ? () => onDistribute(value) : undefined)
        )}
      </div>
    </div>
  )
}

export function InspectorSpacingBox({
  paddingIndividual,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  padding,
  onPaddingChange,
  onPaddingIndividualChange
}: {
  paddingIndividual: boolean
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  padding: number
  onPaddingChange: (side: 'top' | 'right' | 'bottom' | 'left' | 'all', value: number) => void
  onPaddingIndividualChange: (individual: boolean) => void
}) {
  const theme = useInspectorTheme()

  const miniInput = (value: number, side: 'top' | 'right' | 'bottom' | 'left' | 'all') => (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => {
        const n = Math.max(0, Number(e.target.value) || 0)
        onPaddingChange(side, n)
      }}
      className="w-full bg-transparent text-center text-[11px] outline-none"
      style={{ color: theme.text }}
    />
  )

  const edgeBox = (value: number, side: 'top' | 'right' | 'bottom' | 'left') => (
    <div
      className="flex h-6 w-10 items-center justify-center rounded"
      style={{ background: theme.inputBg, border: `1px solid ${theme.divider}` }}
    >
      {miniInput(value, side)}
    </div>
  )

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between">
        <InspectorLabel>Padding</InspectorLabel>
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded"
          style={{
            color: paddingIndividual ? theme.accent : theme.textMuted,
            background: paddingIndividual ? `${theme.accent}18` : 'transparent',
            border: `1px solid ${paddingIndividual ? `${theme.accent}55` : theme.divider}`,
            cursor: 'pointer'
          }}
          title={paddingIndividual ? 'Use uniform padding' : 'Use individual padding'}
          onClick={() => onPaddingIndividualChange(!paddingIndividual)}
        >
          <Link2 className="h-3 w-3" />
        </button>
      </div>

      {paddingIndividual ? (
        <div
          className="relative mx-auto w-full select-none rounded-md py-2"
          style={{ border: `1px dashed ${theme.divider}` }}
        >
          {/* Top */}
          <div className="flex justify-center pb-1">{edgeBox(paddingTop, 'top')}</div>
          {/* Middle row */}
          <div className="flex items-center justify-between px-2">
            {edgeBox(paddingLeft, 'left')}
            <div
              className="mx-2 flex-1 rounded"
              style={{ height: 32, background: theme.hover, border: `1px dashed ${theme.divider}`, opacity: 0.5 }}
            />
            {edgeBox(paddingRight, 'right')}
          </div>
          {/* Bottom */}
          <div className="flex justify-center pt-1">{edgeBox(paddingBottom, 'bottom')}</div>
        </div>
      ) : (
        <div className="flex h-6 items-center overflow-hidden rounded" style={fieldStyle(theme)}>
          {miniInput(padding, 'all')}
          <span className="pr-2 text-[10px]" style={{ color: theme.textMuted }}>px</span>
        </div>
      )}
    </div>
  )
}

export function InspectorGapField({
  value,
  onChange
}: {
  value: number
  onChange: (value: number) => void
}) {
  const theme = useInspectorTheme()

  return (
    <label className="grid gap-1">
      <InspectorLabel>Gap</InspectorLabel>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={120}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1"
          style={{ accentColor: theme.accent }}
        />
        <div className="flex h-6 w-14 items-center overflow-hidden rounded" style={fieldStyle(theme)}>
          <input
            type="number"
            min={0}
            max={120}
            className="w-full bg-transparent px-2 text-[11px] outline-none"
            style={{ color: theme.text }}
            value={value}
            onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          />
        </div>
      </div>
    </label>
  )
}

export function InspectorStepper({
  label,
  value,
  suffix,
  onChange,
  step = 1,
  min = 1
}: {
  label: string
  value: number
  suffix?: string
  onChange: (value: number) => void
  step?: number
  min?: number
}) {
  const theme = useInspectorTheme()

  return (
    <label className="grid gap-1">
      <InspectorLabel>{label}</InspectorLabel>
      <div className="flex h-6 items-center overflow-hidden rounded" style={fieldStyle(theme)}>
        <button
          type="button"
          className="flex h-full w-7 items-center justify-center"
          style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="flex-1 text-center text-[11px]" style={{ color: theme.text }}>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </span>
        <button
          type="button"
          className="flex h-full w-7 items-center justify-center"
          style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => onChange(value + step)}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </label>
  )
}

export function InspectorColorField({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  const theme = useInspectorTheme()
  const normalized = value.replace('#', '').toUpperCase()
  const swatch = `#${normalized.padStart(6, '0').slice(0, 6)}`

  return (
    <div className="flex items-center gap-2">
      <label
        className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md"
        style={{ border: `1px solid ${theme.divider}` }}
      >
        <span className="block h-full w-full" style={{ background: swatch }} />
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={swatch}
          onChange={(event) => onChange(event.target.value.replace('#', '').toUpperCase())}
        />
      </label>
      <div className="flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md" style={fieldStyle(theme)}>
        <Square className="ml-2 h-3 w-3 shrink-0" style={{ color: theme.textMuted }} />
        <input
          className="min-w-0 flex-1 bg-transparent px-2 text-[11px] uppercase outline-none"
          style={{ color: theme.text }}
          value={normalized}
          maxLength={6}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9a-f]/gi, '').toUpperCase())}
        />
      </div>
    </div>
  )
}

export function InspectorSizeRow({
  width,
  height,
  widthMode,
  heightMode,
  lockAspect,
  onWidthChange,
  onHeightChange,
  onWidthModeChange,
  onHeightModeChange,
  onLockAspectChange
}: {
  width: number
  height: number
  widthMode: string
  heightMode: string
  lockAspect: boolean
  onWidthChange: (value: number) => void
  onHeightChange: (value: number) => void
  onWidthModeChange: (value: string) => void
  onHeightModeChange: (value: string) => void
  onLockAspectChange: (value: boolean) => void
}) {
  const theme = useInspectorTheme()
  const modeOptions = [
    { value: 'fixed', label: 'Fixed' },
    { value: 'fill', label: 'Fill' },
    { value: 'hug', label: 'Hug' }
  ]

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
      <div className="grid gap-1">
        <InspectorLabel>Width</InspectorLabel>
        <div className="flex gap-1">
          <div className="flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md" style={fieldStyle(theme)}>
            <input
              type="number"
              min={1}
              className="w-full bg-transparent px-2 text-[11px] outline-none"
              style={{ color: theme.text }}
              value={width}
              onChange={(event) => onWidthChange(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          <select
            className="h-6 rounded px-1 text-[10px] outline-none"
            style={fieldStyle(theme)}
            value={widthMode}
            onChange={(event) => onWidthModeChange(event.target.value)}
          >
            {modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        aria-label={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        aria-pressed={lockAspect}
        className="mb-0.5 flex h-6 w-6 items-center justify-center rounded border transition"
        style={{
          borderColor: lockAspect ? theme.accent : theme.divider,
          color: lockAspect ? theme.accent : theme.textMuted,
          background: theme.inputBg,
          cursor: 'pointer'
        }}
        onClick={() => onLockAspectChange(!lockAspect)}
      >
        <Link2 className="h-3.5 w-3.5" />
      </button>

      <div className="grid gap-1">
        <InspectorLabel>Height</InspectorLabel>
        <div className="flex gap-1">
          <div className="flex h-7 min-w-0 flex-1 items-center overflow-hidden rounded-md" style={fieldStyle(theme)}>
            <input
              type="number"
              min={1}
              className="w-full bg-transparent px-2 text-[11px] outline-none"
              style={{ color: theme.text }}
              value={height}
              onChange={(event) => onHeightChange(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          <select
            className="h-6 rounded px-1 text-[10px] outline-none"
            style={fieldStyle(theme)}
            value={heightMode}
            onChange={(event) => onHeightModeChange(event.target.value)}
          >
            {modeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export function layoutDirectionIcon(direction: 'horizontal' | 'vertical') {
  return direction === 'horizontal' ? ArrowRight : ArrowDown
}
