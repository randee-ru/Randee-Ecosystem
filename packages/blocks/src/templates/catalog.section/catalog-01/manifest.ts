import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'catalog-01',
  type: 'catalog.section',
  group: 'Catalog',
  name: 'Catalog Section',
  description: 'Bitrix catalog.section',
  defaultProps: {
    title: 'Каталог',
    iblockId: '12',
    sectionId: '3'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
