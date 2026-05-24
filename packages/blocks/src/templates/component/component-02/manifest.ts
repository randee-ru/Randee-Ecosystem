import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-02',
  type: 'component',
  group: 'Custom',
  name: 'Component 02',
  description: 'Empty component',
  defaultProps: {
    title: 'Component 02'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
