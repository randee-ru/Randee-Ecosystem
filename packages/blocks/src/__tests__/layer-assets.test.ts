import { describe, expect, it } from 'vitest'
import { getBlockLayerAssets, isEditableLayerAsset } from '../layer-assets'

describe('getBlockLayerAssets', () => {
  it('returns component, style, script and image files for a template', () => {
    const assets = getBlockLayerAssets('hero-01')
    expect(assets).not.toBeNull()
    expect(assets?.name).toBe('Hero Classic')
    expect(assets?.preview.label).toBe('preview.tsx')
    expect(assets?.init.label).toBe('init.ts')
    expect(assets?.style.label).toBe('style.css')
    expect(assets?.script.label).toBe('script.js')
    expect(assets?.images).toHaveLength(1)
    expect(assets?.images[0]?.label).toBe('accent.svg')
    expect(assets?.style.url).toContain('/api/block-assets/hero-01/style.css')
  })

  it('returns null for unknown template', () => {
    expect(getBlockLayerAssets('missing-template')).toBeNull()
  })
})

describe('isEditableLayerAsset', () => {
  it('allows component, style, script and svg files', () => {
    const assets = getBlockLayerAssets('hero-01')
    expect(assets).not.toBeNull()
    if (!assets) return

    expect(isEditableLayerAsset(assets.preview)).toBe(true)
    expect(isEditableLayerAsset(assets.init)).toBe(true)
    expect(isEditableLayerAsset(assets.style)).toBe(true)
    expect(isEditableLayerAsset(assets.script)).toBe(true)
    expect(isEditableLayerAsset(assets.images[0]!)).toBe(true)
  })
})
