import type { SeoPayload } from '../types/seo'

export function buildWebPageJsonLd(seo: SeoPayload, url?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    description: seo.description,
    url: seo.canonicalUrl ?? url,
    ...(seo.ogImage ? { primaryImageOfPage: seo.ogImage } : {})
  }
}
