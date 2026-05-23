import type { BlockType, PageBlock } from '@randee/builder'
import type { ComponentType } from 'react'

export type BlockTemplateManifest = {
  id: string
  type: BlockType
  group: string
  name: string
  description: string
  defaultProps: Record<string, string>
}

export type BlockTemplateAssets = {
  stylePath: string
  scriptPath: string
  images: readonly string[]
}

export type BlockTemplatePreviewProps = {
  block: PageBlock
}

export type BlockTemplateDefinition = {
  manifest: BlockTemplateManifest
  assets: BlockTemplateAssets
  Preview: ComponentType<BlockTemplatePreviewProps>
}

export type LibraryVariant = {
  type: BlockType
  group: string
  name: string
  template: string
  description: string
}
