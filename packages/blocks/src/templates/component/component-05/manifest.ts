import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-05',
  type: 'component',
  group: 'Custom',
  name: 'Component 05',
  description: 'Empty component',
  savedToAssets: true,
  defaultProps: {
    title: 'Component 05'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
