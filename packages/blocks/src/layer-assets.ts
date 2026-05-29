import { getBlockTemplate } from './registry'
import { isUserComponentTemplateId, USER_COMPONENT_ASSETS } from './component-template-id'
import { getTemplateAssetUrl } from './utils/asset-url'

export type BlockLayerAssetKind = 'component' | 'style' | 'script' | 'image'

export type BlockLayerAssetFile = {
  id: string
  label: string
  path: string
  kind: BlockLayerAssetKind
  url: string
}

export type BlockLayerAssets = {
  templateId: string
  name: string
  preview: BlockLayerAssetFile
  generatedLayout: BlockLayerAssetFile | null
  init: BlockLayerAssetFile
  style: BlockLayerAssetFile
  script: BlockLayerAssetFile
  images: BlockLayerAssetFile[]
}

function basename(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] ?? path
}

function assetFile(
  templateId: string,
  path: string,
  kind: BlockLayerAssetKind
): BlockLayerAssetFile {
  return {
    id: `${templateId}-${path.replace(/[^\w-]+/g, '-')}`,
    label: basename(path),
    path,
    kind,
    url: getTemplateAssetUrl(templateId, path)
  }
}

export function isEditableLayerAsset(asset: BlockLayerAssetFile): boolean {
  if (asset.kind === 'component' || asset.kind === 'style' || asset.kind === 'script') return true
  if (asset.kind === 'image') return asset.path.toLowerCase().endsWith('.svg')
  return false
}

export function getBlockLayerAssets(templateId: string): BlockLayerAssets | null {
  const entry = getBlockTemplate(templateId)
  const assets = entry?.assets ?? (isUserComponentTemplateId(templateId) ? USER_COMPONENT_ASSETS : null)
  if (!assets) return null

  const name = entry?.manifest.name ?? templateId

  return {
    templateId,
    name,
    preview: assetFile(templateId, 'preview.tsx', 'component'),
    generatedLayout: isUserComponentTemplateId(templateId)
      ? assetFile(templateId, 'layout.generated.tsx', 'component')
      : null,
    init: assetFile(templateId, 'init.ts', 'component'),
    style: assetFile(templateId, assets.stylePath, 'style'),
    script: assetFile(templateId, assets.scriptPath, 'script'),
    images: assets.images.map((imagePath) => assetFile(templateId, imagePath, 'image'))
  }
}
