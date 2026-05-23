export type BlockType =
  | 'hero'
  | 'features'
  | 'faq'
  | 'cta'
  | 'catalog.section'
  | 'news.list'

export interface DynamicBinding {
  source: 'iblock' | 'highload'
  field: string
  path: string
}

export interface BlockBindings {
  items?: DynamicBinding[]
}

export interface PageBlock {
  id: string
  type: BlockType
  template: string
  props: Record<string, string>
  bindings?: BlockBindings
}

export interface SeoMetadata {
  title: string
  description: string
  canonicalUrl?: string
  noindex?: boolean
  ogImage?: string
}

export interface BuilderPage {
  page: string
  slug: string
  seo: SeoMetadata
  blocks: PageBlock[]
}

export type ViewportMode = 'desktop' | 'macbook' | 'tablet' | 'mobile'
