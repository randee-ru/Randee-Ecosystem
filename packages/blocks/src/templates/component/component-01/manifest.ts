import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-01',
  type: 'component',
  group: 'Custom',
  name: 'Component 01',
  description: 'Empty component',
  defaultProps: {
    title: 'Component 01'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
