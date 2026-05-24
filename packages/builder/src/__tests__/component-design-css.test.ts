import { describe, expect, it } from 'vitest'
import { DEFAULT_COMPONENT_DESIGN } from '../types/component-design'
import {
  componentRootCssProperties,
  componentRootInlineStyle,
  inlineStyleHtmlAttribute
} from '../utils/component-design-css'

describe('component-design-css', () => {
  it('builds root inline styles from design', () => {
    const style = componentRootInlineStyle({
      ...DEFAULT_COMPONENT_DESIGN,
      fill: 'FF0000',
      layout: {
        ...DEFAULT_COMPONENT_DESIGN.layout,
        gap: 12,
        padding: 24,
        direction: 'horizontal',
        distribute: 'center',
        align: 'center'
      },
      typography: { baseSize: 18 }
    })

    expect(style).toContain('background:#FF0000')
    expect(style).toContain('gap:12px')
    expect(style).toContain('padding:24px')
    expect(style).toContain('flex-direction:row')
    expect(style).toContain('justify-content:center')
    expect(style).toContain('font-size:18px')
  })

  it('returns empty style when design is missing', () => {
    expect(componentRootInlineStyle(undefined)).toBe('')
    expect(inlineStyleHtmlAttribute(undefined)).toBe('')
  })

  it('escapes html attribute values', () => {
    const attr = inlineStyleHtmlAttribute({
      ...DEFAULT_COMPONENT_DESIGN,
      fill: 'FFFFFF'
    })
    expect(attr.startsWith(' style="')).toBe(true)
    expect(attr).toContain('background:#FFFFFF')
  })

  it('supports individual padding sides', () => {
    const props = componentRootCssProperties({
      ...DEFAULT_COMPONENT_DESIGN,
      layout: {
        ...DEFAULT_COMPONENT_DESIGN.layout,
        paddingIndividual: true,
        paddingTop: 4,
        paddingRight: 8,
        paddingBottom: 12,
        paddingLeft: 16
      }
    })
    expect(props.padding).toBe('4px 8px 12px 16px')
  })
})
