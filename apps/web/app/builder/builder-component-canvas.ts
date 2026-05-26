import type { ComponentDesignSettings } from '@randee/builder'
import type { CSSProperties } from 'react'
import { componentArtboardCssProperties, componentRootCssProperties } from '@randee/builder'

/** Outer artboard frame — size and position only (not exported to production). */
export function componentArtboardStyle(design: ComponentDesignSettings): CSSProperties {
  return {
    ...(componentArtboardCssProperties(design) as CSSProperties),
    boxShadow: 'inset 0 0 0 1px rgba(0, 153, 255, 0.35)',
    borderRadius: 4
  }
}

/** Styles applied to the component root (preview content), exported to HTML/Bitrix. */
export function componentRootStyle(design: ComponentDesignSettings): CSSProperties {
  return {
    ...(componentRootCssProperties(design) as CSSProperties),
    minHeight: '100%',
    height: '100%'
  }
}
