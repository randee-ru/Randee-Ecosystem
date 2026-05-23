export interface SeoPayload {
  title: string
  description: string
  canonicalUrl?: string
  noindex?: boolean
  ogImage?: string
}

export interface PageSeoArtifact {
  meta: SeoPayload
  jsonLd: Record<string, unknown>
}
