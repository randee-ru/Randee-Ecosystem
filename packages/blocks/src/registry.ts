import { createBlockId } from '@randee/builder'
import type { PageBlock } from '@randee/builder'
import type { BlockTemplateDefinition, LibraryVariant } from './types'

import { manifest as hero01Manifest, assets as hero01Assets } from './templates/hero/hero-01/manifest'
import { Hero01Preview } from './templates/hero/hero-01/preview'
import { manifest as hero02Manifest, assets as hero02Assets } from './templates/hero/hero-02/manifest'
import { Hero02Preview } from './templates/hero/hero-02/preview'
import { manifest as hero03Manifest, assets as hero03Assets } from './templates/hero/hero-03/manifest'
import { Hero03Preview } from './templates/hero/hero-03/preview'
import { manifest as features01Manifest, assets as features01Assets } from './templates/features/features-01/manifest'
import { Features01Preview } from './templates/features/features-01/preview'
import { manifest as features02Manifest, assets as features02Assets } from './templates/features/features-02/manifest'
import { Features02Preview } from './templates/features/features-02/preview'
import { manifest as faq01Manifest, assets as faq01Assets } from './templates/faq/faq-01/manifest'
import { Faq01Preview } from './templates/faq/faq-01/preview'
import { manifest as cta01Manifest, assets as cta01Assets } from './templates/cta/cta-01/manifest'
import { Cta01Preview } from './templates/cta/cta-01/preview'
import { manifest as catalog01Manifest, assets as catalog01Assets } from './templates/catalog.section/catalog-01/manifest'
import { Catalog01Preview } from './templates/catalog.section/catalog-01/preview'
import { manifest as news01Manifest, assets as news01Assets } from './templates/news.list/news-01/manifest'
import { News01Preview } from './templates/news.list/news-01/preview'

const templateRegistry: Record<string, BlockTemplateDefinition> = {
  'hero-01': { manifest: hero01Manifest, assets: hero01Assets, Preview: Hero01Preview },
  'hero-02': { manifest: hero02Manifest, assets: hero02Assets, Preview: Hero02Preview },
  'hero-03': { manifest: hero03Manifest, assets: hero03Assets, Preview: Hero03Preview },
  'features-01': { manifest: features01Manifest, assets: features01Assets, Preview: Features01Preview },
  'features-02': { manifest: features02Manifest, assets: features02Assets, Preview: Features02Preview },
  'faq-01': { manifest: faq01Manifest, assets: faq01Assets, Preview: Faq01Preview },
  'cta-01': { manifest: cta01Manifest, assets: cta01Assets, Preview: Cta01Preview },
  'catalog-01': { manifest: catalog01Manifest, assets: catalog01Assets, Preview: Catalog01Preview },
  'news-01': { manifest: news01Manifest, assets: news01Assets, Preview: News01Preview }
}

export function getBlockTemplate(templateId: string): BlockTemplateDefinition | undefined {
  return templateRegistry[templateId]
}

export function listBlockTemplates(): BlockTemplateDefinition[] {
  return Object.values(templateRegistry)
}

export function listLibraryVariants(): LibraryVariant[] {
  return listBlockTemplates().map(({ manifest }) => ({
    type: manifest.type,
    group: manifest.group,
    name: manifest.name,
    template: manifest.id,
    description: manifest.description
  }))
}

export function createBlockFromTemplate(templateId: string): PageBlock | null {
  const entry = getBlockTemplate(templateId)
  if (!entry) return null

  const { manifest } = entry
  return {
    id: createBlockId(manifest.type),
    type: manifest.type,
    template: manifest.id,
    props: { ...manifest.defaultProps }
  }
}

export function getTemplateFolderName(templateId: string): string | null {
  const entry = getBlockTemplate(templateId)
  if (!entry) return null
  return `${entry.manifest.type}/${entry.manifest.id}`
}
