import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-04',
  type: 'component',
  group: 'Custom',
  name: 'Component 04',
  description: 'Empty component',
  savedToAssets: true,
  defaultProps: {
    title: 'Component 04'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
