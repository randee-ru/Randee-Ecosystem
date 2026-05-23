import { describe, expect, it } from 'vitest'
import { createBlockFromTemplate, getBlockTemplate, listLibraryVariants } from '../registry'

describe('block template registry', () => {
  it('lists library variants with assets metadata', () => {
    const variants = listLibraryVariants()
    expect(variants.length).toBeGreaterThan(0)
    expect(variants.some((item) => item.template === 'hero-01')).toBe(true)
  })

  it('creates block from template with default props', () => {
    const block = createBlockFromTemplate('hero-01')
    expect(block).not.toBeNull()
    expect(block?.template).toBe('hero-01')
    expect(block?.props.title).toBeTruthy()
  })

  it('exposes style, script and images paths for each template', () => {
    const entry = getBlockTemplate('features-01')
    expect(entry?.assets.stylePath).toBe('style.css')
    expect(entry?.assets.scriptPath).toBe('script.js')
    expect(entry?.assets.images.length).toBeGreaterThan(0)
  })
})
