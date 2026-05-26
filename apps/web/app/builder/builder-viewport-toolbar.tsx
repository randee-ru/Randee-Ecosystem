'use client'

import * as React from 'react'
import { Laptop, Monitor, Smartphone, Tablet } from 'lucide-react'
import type { ViewportMode } from '@randee/builder'
import type { ViewportOrientation } from './builder-viewport'
import { getOrientationForViewport } from './builder-viewport'

const VIEWPORT_ITEMS: Array<{ id: ViewportMode; label: string }> = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'macbook', label: 'MacBook' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' }
]

const viewportIcon: Record<ViewportMode, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  desktop: Monitor,
  macbook: Laptop,
  tablet: Tablet,
  mobile: Smartphone
}

type ToolbarTheme = {
  accent: string
  active: string
  inputBg: string
  text: string
  textMuted: string
}

type BuilderViewportToolbarProps = {
  viewport: ViewportMode
  tabletOrientation: ViewportOrientation
  mobileOrientation: ViewportOrientation
  onViewportChange: (mode: ViewportMode) => void
  onRotate: (mode: 'tablet' | 'mobile') => void
  t: ToolbarTheme
  variant?: 'canvas' | 'inspector' | 'topbar'
  // Topbar multi-select: какие viewport-ы сейчас показаны
  shownViewports?: ViewportMode[]
  onToggleViewport?: (mode: ViewportMode) => void
}

export function BuilderViewportToolbar({
  viewport,
  tabletOrientation,
  mobileOrientation,
  onViewportChange,
  onRotate,
  t,
  variant = 'canvas',
  shownViewports,
  onToggleViewport,
}: BuilderViewportToolbarProps) {
  // topbar variant: icon-only, поддерживает multi-select через shownViewports
  if (variant === 'topbar') {
    return (
      <div className="flex items-center gap-0.5">
        {VIEWPORT_ITEMS.map(({ id: mode, label }) => {
          const Icon = viewportIcon[mode]
          const canRotate = mode === 'tablet' || mode === 'mobile'
          const orientation = getOrientationForViewport(mode, tabletOrientation, mobileOrientation)
          const isLandscape = canRotate && orientation === 'landscape'

          // Активен, если: либо это primary viewport (без multi-select) либо входит в shownViewports
          const isShown = shownViewports ? shownViewports.includes(mode) : viewport === mode
          const isPrimary = viewport === mode

          return (
            <button
              key={mode}
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded"
              style={{
                background: isPrimary ? t.active : isShown ? `${t.active}99` : 'transparent',
                border: isShown && !isPrimary ? `1px solid ${t.active}` : '1px solid transparent',
                cursor: 'pointer',
                color: isPrimary ? t.text : isShown ? t.text : t.textMuted,
                transition: 'background 120ms, color 120ms',
              }}
              title={isShown ? `Скрыть ${label}` : `Показать ${label}`}
              aria-label={label}
              aria-pressed={isShown}
              onClick={() => {
                if (onToggleViewport) {
                  // Multi-select режим: тоггл
                  onToggleViewport(mode)
                } else {
                  // Одиночный режим (старое поведение)
                  if (isPrimary && canRotate) onRotate(mode)
                  else onViewportChange(mode)
                }
              }}
            >
              <Icon
                className="h-3.5 w-3.5 transition-transform duration-200"
                style={{ transform: isLandscape ? 'rotate(90deg)' : undefined }}
              />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className={variant === 'inspector' ? 'flex w-full gap-1 rounded-md p-0.5' : 'flex items-center gap-1 rounded-md p-0.5'}
      style={{ background: t.inputBg }}
    >
      {VIEWPORT_ITEMS.map(({ id: mode, label }) => {
        const Icon = viewportIcon[mode]
        const active = viewport === mode
        const canRotate = mode === 'tablet' || mode === 'mobile'
        const orientation = getOrientationForViewport(mode, tabletOrientation, mobileOrientation)
        const isLandscape = canRotate && orientation === 'landscape'

        const activeBackground = variant === 'canvas' ? t.accent : t.active
        const activeColor = variant === 'canvas' ? '#ffffff' : t.text

        return (
          <div
            key={mode}
            className={
              variant === 'inspector'
                ? 'flex min-w-0 flex-1 items-center justify-center rounded'
                : 'flex h-6 items-center rounded'
            }
            style={{
              background: active ? activeBackground : 'transparent',
              color: active ? activeColor : t.textMuted
            }}
          >
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit'
              }}
              aria-label={
                canRotate && active
                  ? `Rotate ${label} to ${isLandscape ? 'portrait' : 'landscape'}`
                  : `Select ${label}`
              }
              title={canRotate && active ? 'Rotate device' : undefined}
              onClick={(event) => {
                event.stopPropagation()
                if (active && canRotate) onRotate(mode)
                else onViewportChange(mode)
              }}
            >
              <Icon
                className="h-3 w-3 transition-transform duration-200"
                style={{ transform: isLandscape ? 'rotate(90deg)' : undefined }}
              />
            </button>
            <button
              type="button"
              className={variant === 'inspector' ? 'min-w-0 truncate pr-1 text-[10px]' : 'pr-2 text-[10px]'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit'
              }}
              onClick={() => onViewportChange(mode)}
            >
              {label}
            </button>
          </div>
        )
      })}
    </div>
  )
}
