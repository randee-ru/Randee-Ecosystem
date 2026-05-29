import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-10',
  type: 'component',
  group: 'Custom',
  name: 'Главный экран',
  description: 'Empty component',
  savedToAssets: true,
  defaultProps: {
    title: 'Главный экран'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
