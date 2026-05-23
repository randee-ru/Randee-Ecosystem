import { describe, expect, it } from 'vitest'
import { buildWebPageJsonLd } from './seo-jsonld'

describe('buildWebPageJsonLd', () => {
  it('builds schema.org WebPage json', () => {
    const jsonLd = buildWebPageJsonLd(
      { title: 'Title', description: 'Desc', canonicalUrl: 'https://example.com' },
      'https://fallback.com'
    )

    expect(jsonLd['@type']).toBe('WebPage')
    expect(jsonLd.url).toBe('https://example.com')
  })
})
