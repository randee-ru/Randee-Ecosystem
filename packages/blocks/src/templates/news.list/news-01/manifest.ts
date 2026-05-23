import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'news-01',
  type: 'news.list',
  group: 'News',
  name: 'News List',
  description: 'Bitrix news.list',
  defaultProps: {
    title: 'Новости'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
