import type { ComponentDesignSettings } from '../types/component-design'
import { resolveComponentDesign } from './component-design'

export type CssProperties = Record<string, string | number>

function normalizeFill(fill: string): string {
  const trimmed = fill.trim()
  if (trimmed.startsWith('#')) return trimmed
  return `#${trimmed.replace(/^#/, '')}`
}

/** Layout, fill and typography applied to the component root in production export. */
export function componentRootCssProperties(design?: ComponentDesignSettings): CssProperties {
  const { layout, typography, fill } = resolveComponentDesign(design)
  const padding = layout.paddingIndividual
    ? `${layout.paddingTop}px ${layout.paddingRight}px ${layout.paddingBottom}px ${layout.paddingLeft}px`
    : `${layout.padding}px`

  const distributeMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between'
  } as const

  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end'
  } as const

  const extra: CssProperties = {}

  if (design?.opacity !== undefined && design.opacity !== 100) {
    extra.opacity = design.opacity / 100
  }
  if (design?.borderRadius) {
    extra.borderRadius = `${design.borderRadius}px`
  }
  if (design?.border && design.border.style !== 'none' && design.border.width > 0) {
    const bc = design.border.color.startsWith('#') ? design.border.color : `#${design.border.color}`
    extra.border = `${design.border.width}px ${design.border.style} ${bc}`
  }
  if (design?.shadow) {
    const s = design.shadow
    const sc = s.color.startsWith('#') ? s.color : `#${s.color}`
    extra.boxShadow = `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${sc}`
  }

  return {
    width: '100%',
    minHeight: 'min-content',
    background: normalizeFill(fill),
    fontSize: `${typography.baseSize}px`,
    display: layout.type === 'grid' ? 'grid' : 'flex',
    flexDirection: layout.direction === 'vertical' ? 'column' : 'row',
    flexWrap: layout.wrap ? 'wrap' : 'nowrap',
    justifyContent: distributeMap[layout.distribute],
    alignItems: alignMap[layout.align],
    gap: `${layout.gap}px`,
    padding,
    boxSizing: 'border-box',
    ...extra
  }
}

export function cssPropertiesToInlineStyle(properties: CssProperties): string {
  return Object.entries(properties)
    .map(([key, value]) => {
      const name = key.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${name}:${value}`
    })
    .join(';')
}

export function componentRootInlineStyle(design?: ComponentDesignSettings): string {
  if (!design) return ''
  return cssPropertiesToInlineStyle(componentRootCssProperties(design))
}

/** Artboard frame styles — builder canvas only, not included in export. */
export function componentArtboardCssProperties(design?: ComponentDesignSettings): CssProperties {
  const { position, size } = resolveComponentDesign(design)
  const safeHeight = Math.max(0, Number(size.height) || 0)
  const fixedHeight = `${safeHeight}px`
  const windowHeight = `${Math.max(1, Math.min(100, safeHeight || 100))}vh`
  return {
    position: 'relative',
    width: size.widthMode === 'fixed' ? `${size.width}px` : '100%',
    height: size.heightMode === 'fixed' ? fixedHeight : size.heightMode === 'fill' ? windowHeight : 'auto',
    minHeight: size.heightMode === 'hug' ? 'min-content' : fixedHeight,
    maxWidth: '100%',
    marginLeft: `${position.x}px`,
    marginTop: `${position.y}px`,
    boxSizing: 'border-box',
    overflow: 'auto'
  }
}

export function escapeHtmlAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function inlineStyleHtmlAttribute(design?: ComponentDesignSettings): string {
  const style = componentRootInlineStyle(design)
  if (!style) return ''
  return ` style="${escapeHtmlAttribute(style)}"`
}
