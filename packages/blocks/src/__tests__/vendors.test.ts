import { describe, expect, it } from 'vitest'
import type { BuilderPage } from '@randee/builder'
import { collectPageVendors, collectTemplateVendors } from '../vendors/collect'
import { isVendorId, listVendors } from '../vendors/registry'

describe('vendor registry', () => {
  it('lists known vendors', () => {
    const vendors = listVendors()
    expect(vendors.map((item) => item.id)).toEqual(['gsap', 'swiper'])
  })

  it('validates vendor ids', () => {
    expect(isVendorId('gsap')).toBe(true)
    expect(isVendorId('unknown')).toBe(false)
  })
})

describe('collectPageVendors', () => {
  const basePage: BuilderPage = {
    page: 'Test',
    slug: '/',
    seo: { title: 'Test', description: '' },
    blocks: []
  }

  it('collects manually enabled page vendors', () => {
    const vendors = collectPageVendors({ ...basePage, vendors: ['swiper'] })
    expect(vendors).toEqual(['swiper'])
  })

  it('merges page vendors and block template dependencies', () => {
    const page: BuilderPage = {
      ...basePage,
      vendors: ['swiper'],
      blocks: [
        {
          id: 'hero-1',
          type: 'hero',
          template: 'hero-01',
          props: {}
        }
      ]
    }

    expect(collectPageVendors(page)).toEqual(['swiper'])
    expect(collectTemplateVendors('hero-01')).toEqual([])
  })
})
