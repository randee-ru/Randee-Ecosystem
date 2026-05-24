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
    boxSizing: 'border-box'
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
  return {
    position: 'relative',
    width: size.widthMode === 'fixed' ? `${size.width}px` : '100%',
    minHeight: size.heightMode === 'fixed' ? `${size.height}px` : `${size.height}px`,
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
