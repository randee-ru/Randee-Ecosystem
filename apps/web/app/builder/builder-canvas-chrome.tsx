'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const RULER_SIZE = 22
export const CANVAS_PADDING = 32

export const PANEL_LEFT_MIN = 180
export const PANEL_LEFT_MAX = 420
export const PANEL_LEFT_DEFAULT = 220
export const PANEL_RIGHT_MIN = 220
export const PANEL_RIGHT_MAX = 480
export const PANEL_RIGHT_DEFAULT = 260

export function clampPanelWidth(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

export function canvasGridStyle(
  size: number,
  majorStep: number,
  minorColor: string,
  majorColor: string
): React.CSSProperties {
  const major = size * majorStep
  return {
    backgroundImage: [
      `linear-gradient(${minorColor} 1px, transparent 1px)`,
      `linear-gradient(90deg, ${minorColor} 1px, transparent 1px)`,
      `linear-gradient(${majorColor} 1px, transparent 1px)`,
      `linear-gradient(90deg, ${majorColor} 1px, transparent 1px)`
    ].join(', '),
    backgroundSize: `${size}px ${size}px, ${size}px ${size}px, ${major}px ${major}px, ${major}px ${major}px`
  }
}

type RulerProps = {
  scrollOffset: number
  zoom: number
  viewportSize: number
  theme: 'light' | 'dark'
  /** Content-space offset from canvas origin to the page frame top-left (0,0). */
  frameOrigin: number
}

function rulerColors(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? { bg: '#1e1e1e', text: '#888', tick: 'rgba(255,255,255,0.18)', major: 'rgba(255,255,255,0.35)' }
    : { bg: '#f5f5f5', text: '#737373', tick: 'rgba(0,0,0,0.1)', major: 'rgba(0,0,0,0.22)' }
}

const RULER_TICK_STEP = 50

function designCoordToRulerPos(designPx: number, scrollOffset: number, scale: number, frameOrigin: number) {
  return CANVAS_PADDING + frameOrigin + designPx * scale - scrollOffset
}

function visibleDesignTickRange(scrollOffset: number, scale: number, frameOrigin: number, spanDesign: number) {
  const start =
    Math.floor((scrollOffset - CANVAS_PADDING - frameOrigin) / scale / RULER_TICK_STEP) * RULER_TICK_STEP
  return { start, end: start + spanDesign + 200 }
}

function renderRulerTicks(
  axis: 'horizontal' | 'vertical',
  scrollOffset: number,
  scale: number,
  frameOrigin: number,
  spanDesign: number,
  colors: ReturnType<typeof rulerColors>
) {
  const { start, end } = visibleDesignTickRange(scrollOffset, scale, frameOrigin, spanDesign)
  const ticks: React.ReactNode[] = []

  for (let px = start; px <= end; px += RULER_TICK_STEP) {
    const pos = designCoordToRulerPos(px, scrollOffset, scale, frameOrigin)
    const isMajor = px % 100 === 0
    const isOrigin = px === 0

    if (pos < -40 || pos > 4000) continue

    if (axis === 'horizontal') {
      ticks.push(
        <React.Fragment key={px}>
          <span
            className="absolute bottom-0"
            style={{
              left: pos,
              width: 1,
              height: isOrigin ? 14 : isMajor ? 10 : 6,
              background: isOrigin ? '#0099ff' : isMajor ? colors.major : colors.tick
            }}
          />
          {isMajor || isOrigin ? (
            <span
              className="absolute top-0.5 select-none text-[9px] font-medium"
              style={{ left: pos + 3, color: isOrigin ? '#0099ff' : colors.text }}
            >
              {px}
            </span>
          ) : null}
        </React.Fragment>
      )
    } else {
      ticks.push(
        <React.Fragment key={px}>
          <span
            className="absolute right-0"
            style={{
              top: pos,
              height: 1,
              width: isOrigin ? 14 : isMajor ? 10 : 6,
              background: isOrigin ? '#0099ff' : isMajor ? colors.major : colors.tick
            }}
          />
          {isMajor || isOrigin ? (
            <span
              className="absolute left-0.5 select-none text-[9px] font-medium"
              style={{
                top: pos + 2,
                color: isOrigin ? '#0099ff' : colors.text,
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)'
              }}
            >
              {px}
            </span>
          ) : null}
        </React.Fragment>
      )
    }
  }

  return ticks
}

export function CanvasRulerHorizontal({ scrollOffset, zoom, viewportSize, theme, frameOrigin }: RulerProps) {
  const colors = rulerColors(theme)
  const scale = zoom / 100
  const span = Math.max(viewportSize, 2400)

  return (
    <div
      className="relative h-full overflow-hidden"
      style={{ background: colors.bg, borderBottom: `1px solid ${colors.major}` }}
    >
      {renderRulerTicks('horizontal', scrollOffset, scale, frameOrigin, span, colors)}
    </div>
  )
}

export function CanvasRulerVertical({ scrollOffset, zoom, theme, frameOrigin }: Omit<RulerProps, 'viewportSize'>) {
  const colors = rulerColors(theme)
  const scale = zoom / 100

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: colors.bg, borderRight: `1px solid ${colors.major}` }}
    >
      {renderRulerTicks('vertical', scrollOffset, scale, frameOrigin, 3200, colors)}
    </div>
  )
}


type PanelResizeHandleProps = {
  side: 'left' | 'right'
  onResizeStart: (event: React.MouseEvent) => void
  accent: string
  hoverBg: string
}

export function PanelResizeHandle({ side, onResizeStart, accent, hoverBg }: PanelResizeHandleProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="group absolute top-0 z-40 flex h-full w-3 items-center justify-center"
      style={{
        [side === 'left' ? 'right' : 'left']: -6,
        cursor: 'col-resize'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={onResizeStart}
      role="separator"
      aria-orientation="vertical"
      aria-label={side === 'left' ? 'Resize left panel' : 'Resize right panel'}
    >
      <div
        className="flex h-10 w-4 items-center justify-center rounded-full shadow-sm transition"
        style={{
          background: hovered ? hoverBg : 'transparent',
          border: hovered ? `1px solid ${accent}55` : '1px solid transparent',
          opacity: hovered ? 1 : 0.35
        }}
      >
        {side === 'left' ? (
          <ChevronRight className="h-3 w-3" style={{ color: accent }} />
        ) : (
          <ChevronLeft className="h-3 w-3" style={{ color: accent }} />
        )}
      </div>
    </div>
  )
}
