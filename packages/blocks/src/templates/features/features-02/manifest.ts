import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'features-02',
  type: 'features',
  group: 'Features',
  name: 'Feature Cards',
  description: 'Карточки с иконками',
  defaultProps: {
    title: "Преимущества",
    item1: "Пункт 1",
    item2: "Пункт 2",
    item3: "Пункт 3",
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
