export type ElementPositionType = 'relative' | 'absolute' | 'fixed' | 'sticky'
export type ElementSizeMode = 'fixed' | 'relative' | 'fill' | 'fit'
export type ElementLayoutType = 'stack' | 'grid'
export type ElementDirection = 'horizontal' | 'vertical'
export type ElementDistribute = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
export type ElementAlign = 'start' | 'center' | 'end' | 'stretch'

export interface ElementDesignSettings {
  position?: {
    type?: ElementPositionType
    top?: number | null
    right?: number | null
    bottom?: number | null
    left?: number | null
    zIndex?: number | null
  }
  size?: {
    widthMode?: ElementSizeMode
    width?: number
    widthPercent?: number
    heightMode?: ElementSizeMode
    height?: number
    minWidth?: number | null
    maxWidth?: number | null
    minHeight?: number | null
    maxHeight?: number | null
  }
  layout?: {
    type?: ElementLayoutType
    direction?: ElementDirection
    distribute?: ElementDistribute
    align?: ElementAlign
    wrap?: boolean
    gap?: number
    paddingTop?: number
    paddingRight?: number
    paddingBottom?: number
    paddingLeft?: number
  }
  opacity?: number
  borderRadius?: number
  fill?: string
}

export interface ComponentElement {
  id: string
  /** Catalog id, e.g. `button`, `modal` */
  elementId: string
  name?: string
  /** Optional parent element id for nested composition */
  parentId?: string | null
  props: Record<string, string>
  design?: ElementDesignSettings
}

export type ElementVariant = {
  id: string
  name: string
  group: string
  description: string
  defaultProps: Record<string, string>
  /** When true, preview uses @randee/ui implementation */
  ready: boolean
}
