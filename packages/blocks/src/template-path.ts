import type { BlockTemplateManifest, BlockTemplateAssets } from './types'
import { getUserComponentFolderPath, isUserComponentTemplateId, USER_COMPONENT_ASSETS } from './component-template-id'
import { readComponentMeta } from './component-io'
import { manifest as hero01Manifest, assets as hero01Assets } from './templates/hero/hero-01/manifest'
import { manifest as hero02Manifest, assets as hero02Assets } from './templates/hero/hero-02/manifest'
import { manifest as hero03Manifest, assets as hero03Assets } from './templates/hero/hero-03/manifest'
import { manifest as features01Manifest, assets as features01Assets } from './templates/features/features-01/manifest'
import { manifest as features02Manifest, assets as features02Assets } from './templates/features/features-02/manifest'
import { manifest as faq01Manifest, assets as faq01Assets } from './templates/faq/faq-01/manifest'
import { manifest as cta01Manifest, assets as cta01Assets } from './templates/cta/cta-01/manifest'
import { manifest as catalog01Manifest, assets as catalog01Assets } from './templates/catalog.section/catalog-01/manifest'
import { manifest as news01Manifest, assets as news01Assets } from './templates/news.list/news-01/manifest'

export const builtinTemplateManifests: Record<string, BlockTemplateManifest> = {
  'hero-01': hero01Manifest,
  'hero-02': hero02Manifest,
  'hero-03': hero03Manifest,
  'features-01': features01Manifest,
  'features-02': features02Manifest,
  'faq-01': faq01Manifest,
  'cta-01': cta01Manifest,
  'catalog-01': catalog01Manifest,
  'news-01': news01Manifest
}

export const builtinTemplateAssets: Record<string, BlockTemplateAssets> = {
  'hero-01': hero01Assets,
  'hero-02': hero02Assets,
  'hero-03': hero03Assets,
  'features-01': features01Assets,
  'features-02': features02Assets,
  'faq-01': faq01Assets,
  'cta-01': cta01Assets,
  'catalog-01': catalog01Assets,
  'news-01': news01Assets
}

export function resolveTemplateManifest(templateId: string): BlockTemplateManifest | null {
  return readComponentMeta(templateId) ?? builtinTemplateManifests[templateId] ?? null
}

export function resolveTemplateAssets(templateId: string): BlockTemplateAssets | null {
  if (isUserComponentTemplateId(templateId)) return USER_COMPONENT_ASSETS
  return builtinTemplateAssets[templateId] ?? null
}

export function resolveTemplateFolder(templateId: string): string | null {
  if (isUserComponentTemplateId(templateId)) return getUserComponentFolderPath(templateId)

  const manifest = resolveTemplateManifest(templateId)
  if (!manifest) return null
  return `${manifest.type}/${manifest.id}`
}
