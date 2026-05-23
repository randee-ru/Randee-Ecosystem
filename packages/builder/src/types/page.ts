export type BlockType = 'hero' | 'features' | 'faq' | 'cta' | 'catalog.section' | 'news.list'

export interface PageBlock {
  id: string
  type: BlockType
  template: string
  props: Record<string, string>
}

export interface BuilderPage {
  page: string
  slug: string
  blocks: PageBlock[]
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'
