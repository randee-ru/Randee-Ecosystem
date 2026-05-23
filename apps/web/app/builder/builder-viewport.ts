import type { ViewportMode } from '@randee/builder'

export type ViewportOrientation = 'portrait' | 'landscape'

export type ViewportSize = {
  width: number
  minHeight?: number
  orientation: ViewportOrientation
  label: string
}

const VIEWPORT_FIXED: Record<'desktop' | 'macbook', { width: number; label: string }> = {
  desktop: { width: 1920, label: 'Desktop · 1920' },
  macbook: { width: 1400, label: 'MacBook · 1400' }
}

const VIEWPORT_BASE: Record<'tablet' | 'mobile', { portrait: number; landscape: number }> = {
  tablet: { portrait: 820, landscape: 1180 },
  mobile: { portrait: 390, landscape: 844 }
}

export function isViewportOrientation(value: unknown): value is ViewportOrientation {
  return value === 'portrait' || value === 'landscape'
}

export function resolveViewportSize(
  viewport: ViewportMode,
  tabletOrientation: ViewportOrientation,
  mobileOrientation: ViewportOrientation
): ViewportSize {
  if (viewport === 'desktop' || viewport === 'macbook') {
    const fixed = VIEWPORT_FIXED[viewport]
    return { width: fixed.width, orientation: 'portrait', label: fixed.label }
  }

  const orientation = viewport === 'tablet' ? tabletOrientation : mobileOrientation
  const base = VIEWPORT_BASE[viewport]
  const width = orientation === 'landscape' ? base.landscape : base.portrait
  const minHeight = orientation === 'landscape' ? base.portrait : undefined
  const suffix = orientation === 'landscape' ? ' · landscape' : ''
  const name = viewport === 'tablet' ? 'Tablet' : 'Mobile'

  return {
    width,
    minHeight,
    orientation,
    label: `${name} · ${width}${suffix}`
  }
}

export function getOrientationForViewport(
  viewport: ViewportMode,
  tabletOrientation: ViewportOrientation,
  mobileOrientation: ViewportOrientation
): ViewportOrientation {
  if (viewport === 'tablet') return tabletOrientation
  if (viewport === 'mobile') return mobileOrientation
  return 'portrait'
}
