import { createBlockId } from '@randee/builder'
import type { PageBlock } from '@randee/builder'
import type { BlockTemplateDefinition, BlockTemplateAssets, BlockTemplateManifest, LibraryVariant } from './types'
import { GenericComponentPreview } from './components/generic-component-preview'
import { isUserComponentTemplateId, getUserComponentFolderPath } from './component-template-id'

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
import { manifest as component08Manifest, assets as component08Assets } from './templates/component/component-08/manifest'
import { Component08Preview } from './templates/component/component-08/preview'
import { manifest as component09Manifest, assets as component09Assets } from './templates/component/component-09/manifest'
import { Component09Preview } from './templates/component/component-09/preview'
import { manifest as nav01Manifest, assets as nav01Assets } from './templates/nav/nav-01/manifest'
import { Nav01Preview } from './templates/nav/nav-01/preview'
import { manifest as nav02Manifest, assets as nav02Assets } from './templates/nav/nav-02/manifest'
import { Nav02Preview } from './templates/nav/nav-02/preview'
import { manifest as footer01Manifest, assets as footer01Assets } from './templates/footer/footer-01/manifest'
import { Footer01Preview } from './templates/footer/footer-01/preview'
import { manifest as pricing01Manifest, assets as pricing01Assets } from './templates/pricing/pricing-01/manifest'
import { Pricing01Preview } from './templates/pricing/pricing-01/preview'
// scaffold:imports

const templateRegistry: Record<string, BlockTemplateDefinition> = {
  'hero-01':     { manifest: hero01Manifest,     assets: hero01Assets,     Preview: Hero01Preview },
  'hero-02':     { manifest: hero02Manifest,     assets: hero02Assets,     Preview: Hero02Preview },
  'hero-03':     { manifest: hero03Manifest,     assets: hero03Assets,     Preview: Hero03Preview },
  'features-01': { manifest: features01Manifest, assets: features01Assets, Preview: Features01Preview },
  'features-02': { manifest: features02Manifest, assets: features02Assets, Preview: Features02Preview },
  'faq-01':      { manifest: faq01Manifest,      assets: faq01Assets,      Preview: Faq01Preview },
  'cta-01':      { manifest: cta01Manifest,      assets: cta01Assets,      Preview: Cta01Preview },
  'catalog-01':  { manifest: catalog01Manifest,  assets: catalog01Assets,  Preview: Catalog01Preview },
  'news-01':     { manifest: news01Manifest,      assets: news01Assets,    Preview: News01Preview },
  'component-08':{ manifest: component08Manifest, assets: component08Assets, Preview: Component08Preview },
  'component-09':{ manifest: component09Manifest, assets: component09Assets, Preview: Component09Preview },
  'nav-01':      { manifest: nav01Manifest,      assets: nav01Assets,      Preview: Nav01Preview },
  'nav-02':      { manifest: nav02Manifest,      assets: nav02Assets,      Preview: Nav02Preview },
  'footer-01':   { manifest: footer01Manifest,   assets: footer01Assets,   Preview: Footer01Preview },
  'pricing-01':  { manifest: pricing01Manifest,  assets: pricing01Assets,  Preview: Pricing01Preview },
  // scaffold:entries
}

const userTemplateRegistry: Record<string, BlockTemplateDefinition> = {}

export function registerUserTemplate(manifest: BlockTemplateManifest, assets: BlockTemplateAssets): void {
  // не перезаписываем встроенные шаблоны (component-03, component-04, ...)
  if (templateRegistry[manifest.id]) return
  userTemplateRegistry[manifest.id] = {
    manifest,
    assets,
    Preview: GenericComponentPreview
  }
}

export function getBlockTemplate(templateId: string): BlockTemplateDefinition | undefined {
  return templateRegistry[templateId] ?? userTemplateRegistry[templateId]
}

export function listBlockTemplates(): BlockTemplateDefinition[] {
  return [...Object.values(templateRegistry), ...Object.values(userTemplateRegistry)]
}

export function listLibraryVariants(): LibraryVariant[] {
  const seen = new Set<string>()
  return listBlockTemplates()
    .map(({ manifest }) => ({
      type: manifest.type,
      group: manifest.group,
      name: manifest.name,
      template: manifest.id,
      description: manifest.description
    }))
    .filter((item) => {
      if (!isUserComponentTemplateId(item.template)) {
        if (seen.has(item.template)) return false
        seen.add(item.template)
        return true
      }
      if (seen.has(item.template)) return false
      seen.add(item.template)
      const entry = getBlockTemplate(item.template)
      return entry?.manifest.savedToAssets === true
    })
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
  if (entry) return `${entry.manifest.type}/${entry.manifest.id}`
  if (isUserComponentTemplateId(templateId)) return getUserComponentFolderPath(templateId)
  return null
}
