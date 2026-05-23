import { describe, expect, it } from 'vitest'
import { buildBuilderWebPageJsonLd } from '../utils/seo-jsonld'

describe('buildBuilderWebPageJsonLd', () => {
  it('returns schema.org payload', () => {
    const payload = buildBuilderWebPageJsonLd({
      title: 'Main',
      description: 'Desc',
      canonicalUrl: 'https://example.com'
    })

    expect(payload['@type']).toBe('WebPage')
    expect(payload.url).toBe('https://example.com')
  })
})
