export type SizeMode = 'fixed' | 'fill' | 'hug'
export type LayoutType = 'stack' | 'grid'
export type LayoutDirection = 'horizontal' | 'vertical'
export type LayoutDistribute = 'start' | 'center' | 'end' | 'space-between'
export type LayoutAlign = 'start' | 'center' | 'end'
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'none'

export interface ComponentBorder {
  width: number
  style: BorderStyle
  color: string
}

export interface ComponentShadow {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

export interface ComponentDesignSettings {
  position: { x: number; y: number }
  size: {
    width: number
    height: number
    widthMode: SizeMode
    heightMode: SizeMode
    lockAspect: boolean
  }
  layout: {
    type: LayoutType
    direction: LayoutDirection
    distribute: LayoutDistribute
    align: LayoutAlign
    wrap: boolean
    gap: number
    padding: number
    paddingIndividual: boolean
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number
  }
  typography: { baseSize: number }
  fill: string
  opacity?: number
  borderRadius?: number
  border?: ComponentBorder | null
  shadow?: ComponentShadow | null
}

export const DEFAULT_COMPONENT_DESIGN: ComponentDesignSettings = {
  position: { x: 0, y: 0 },
  size: {
    width: 1400,
    height: 1000,
    widthMode: 'fixed',
    heightMode: 'fixed',
    lockAspect: false
  },
  layout: {
    type: 'stack',
    direction: 'vertical',
    distribute: 'start',
    align: 'center',
    wrap: false,
    gap: 0,
    padding: 0,
    paddingIndividual: false,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0
  },
  typography: { baseSize: 16 },
  fill: 'FFFFFF'
}
