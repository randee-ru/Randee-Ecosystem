export interface BuilderSeoMeta {
  title: string
  description: string
  canonicalUrl?: string
  noindex?: boolean
  ogImage?: string
}

export function buildBuilderWebPageJsonLd(seo: BuilderSeoMeta | undefined | null, url?: string): Record<string, unknown> {
  const s = seo ?? { title: '', description: '' }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: s.title,
    description: s.description,
    url: s.canonicalUrl ?? url,
    ...(s.ogImage ? { primaryImageOfPage: s.ogImage } : {})
  }
}
