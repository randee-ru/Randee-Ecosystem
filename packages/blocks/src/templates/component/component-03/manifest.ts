import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-03',
  type: 'component',
  group: 'Custom',
  name: 'Component 03',
  description: 'Empty component',
  savedToAssets: false,
  defaultProps: {
    title: 'Component 03'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
