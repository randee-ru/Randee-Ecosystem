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

function fieldStyle(theme: InspectorTheme): React.CSSProperties {
  return {
    border: `1px solid ${theme.divider}`,
    background: theme.inputBg,
    color: theme.text
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
    <section style={{ borderBottom: `1px solid ${theme.divider}` }} className="py-3">
      <div className="mb-2 flex items-center justify-between px-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-semibold" style={{ color: theme.text }}>
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
    <span className="text-[10px]" style={{ color: theme.textMuted }}>
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
      <div className="flex h-7 items-center overflow-hidden rounded-md" style={fieldStyle(theme)}>
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
        className="h-7 rounded-md px-2 text-[11px] outline-none"
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
      className="flex h-7 w-7 items-center justify-center rounded-md border transition"
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

export function InspectorAlignToolbar() {
  const theme = useInspectorTheme()
  const items = [
    { label: 'Align left', icon: AlignStartVertical },
    { label: 'Align center horizontal', icon: AlignCenterVertical },
    { label: 'Align right', icon: AlignEndVertical },
    { label: 'Align top', icon: AlignStartHorizontal },
    { label: 'Align center vertical', icon: AlignCenterHorizontal },
    { label: 'Align bottom', icon: AlignEndHorizontal }
  ]

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-2"
      style={{ borderBottom: `1px solid ${theme.divider}` }}
    >
      {items.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = theme.hover
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'transparent'
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
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
        <div className="flex h-7 w-14 items-center overflow-hidden rounded-md" style={fieldStyle(theme)}>
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
      <div className="flex h-7 items-center overflow-hidden rounded-md" style={fieldStyle(theme)}>
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
            className="h-7 rounded-md px-1 text-[10px] outline-none"
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
        className="mb-0.5 flex h-7 w-7 items-center justify-center rounded-md border transition"
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
            className="h-7 rounded-md px-1 text-[10px] outline-none"
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
