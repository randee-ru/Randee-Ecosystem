import { describe, expect, it } from 'vitest'
import { getElementVariant, groupElementVariants, listElementVariants } from '../element-registry'

describe('element-registry', () => {
  it('lists all requested UI element categories', () => {
    const variants = listElementVariants()
    const groups = Object.keys(groupElementVariants())

    expect(variants.length).toBeGreaterThanOrEqual(70)
    expect(groups).toEqual(
      expect.arrayContaining(['Actions', 'Forms', 'Overlays', 'Feedback', 'Navigation', 'Data Display', 'Pickers', 'Layout'])
    )
  })

  it('includes Button and Accordion with defaults', () => {
    const button = getElementVariant('button')
    const accordion = getElementVariant('accordion')

    expect(button?.name).toBe('Button')
    expect(button?.defaultProps.label).toBe('Button')
    expect(accordion?.name).toBe('Accordion')
    expect(accordion?.defaultProps.title).toBeTruthy()
  })
})
