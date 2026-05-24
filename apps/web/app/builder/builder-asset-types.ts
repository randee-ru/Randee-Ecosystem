import type { BlockLayerAssetFile, BlockLayerAssetKind } from '@randee/blocks'

export type BuilderAssetTarget = {
  templateId: string
  blockId?: string
  blockName?: string
  path: string
  label: string
  kind: BlockLayerAssetKind
  url: string
}

export { isEditableLayerAsset as isEditableAsset } from '@randee/blocks'
