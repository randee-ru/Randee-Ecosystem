import type { BlockType, PageBlock } from '@randee/builder'
import type { ComponentType } from 'react'

export type BlockPropFieldType = 'text' | 'number' | 'boolean' | 'select' | 'color' | 'image'

export type BlockPropField = {
  name: string
  label: string
  type: BlockPropFieldType
  options?: string[]
}

export type BlockTemplateManifest = {
  id: string
  type: BlockType
  group: string
  name: string
  description: string
  defaultProps: Record<string, string>
  /** Typed props for Inspector */
  propsSchema?: BlockPropField[]
  /** Saved to Assets library and ready for Bitrix export */
  savedToAssets?: boolean
  /** External libraries required by this block (GSAP, Swiper, etc.) */
  dependencies?: import('./vendors/registry').VendorId[]
}

export type BlockTemplateAssets = {
  stylePath: string
  scriptPath: string
  images: readonly string[]
}

export type BlockTemplatePreviewProps = {
  block: PageBlock
  elementOptions?: {
    selectedElementId?: string | null
    onSelectElement?: (elementId: string) => void
    onDeleteElement?: (elementId: string) => void
  onDropElement?: (
    catalogElementId: string,
    placement?: {
      parentId?: string | null
      afterElementId?: string | null
      beforeElementId?: string | null
      columnIndex?: number | null
    }
  ) => void
    onPatchElementProps?: (elementId: string, props: Record<string, string>) => void
    viewport?: 'desktop' | 'macbook' | 'tablet' | 'mobile'
  }
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
