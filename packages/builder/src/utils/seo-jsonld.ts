export interface BuilderSeoMeta {
  title: string
  description: string
  canonicalUrl?: string
  noindex?: boolean
  ogImage?: string
}

export function buildBuilderWebPageJsonLd(seo: BuilderSeoMeta, url?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    description: seo.description,
    url: seo.canonicalUrl ?? url,
    ...(seo.ogImage ? { primaryImageOfPage: seo.ogImage } : {})
  }
}
