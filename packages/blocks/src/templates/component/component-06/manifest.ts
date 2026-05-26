import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-06',
  type: 'component',
  group: 'Custom',
  name: 'Component 06',
  description: 'Empty component',
  savedToAssets: true,
  defaultProps: {
    title: 'Component 06'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
