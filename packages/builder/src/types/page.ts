import type { ComponentDesignSettings } from './component-design'
import type { ComponentElement } from './component-element'

export type BlockType =
  | 'hero'
  | 'features'
  | 'faq'
  | 'cta'
  | 'catalog.section'
  | 'news.list'
  | 'component'

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
  /** Custom display name in Layers panel */
  name?: string
  props: Record<string, string>
  bindings?: BlockBindings
  /** Visual layout/style settings for component edit mode */
  design?: ComponentDesignSettings
  /** UI primitives inserted in Edit Component mode */
  elements?: ComponentElement[]
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
  /** Manually enabled external libraries (GSAP, Swiper, etc.) */
  vendors?: string[]
}

export type ViewportMode = 'desktop' | 'macbook' | 'tablet' | 'mobile'
