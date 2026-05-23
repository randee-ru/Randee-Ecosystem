import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'hero-02',
  type: 'hero',
  group: 'Hero',
  name: 'Hero Split',
  description: 'Текст + медиа справа',
  defaultProps: {
    title: "Новый Hero блок",
    description: "Добавьте описание",
    buttonText: "Подробнее"
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
