import type { ExportBindingContext } from './bindings'

export interface RandeeBlock {
  id: string
  type: string
  template?: string
  props: Record<string, string>
  bindings?: ExportBindingContext
}

export interface RandeePageSchema {
  page: string
  slug: string
  blocks: RandeeBlock[]
}

export interface ExportManifestItem {
  blockId: string
  blockType: string
  bitrixComponent: string
  targetDir: string
}

export interface ExportManifest {
  page: string
  slug: string
  generatedAt: string
  items: ExportManifestItem[]
}
