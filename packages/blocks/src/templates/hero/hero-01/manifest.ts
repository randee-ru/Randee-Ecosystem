import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'hero-01',
  type: 'hero',
  group: 'Hero',
  name: 'Hero Classic',
  description: 'Заголовок, текст и CTA',
  defaultProps: {
    title: 'Новый Hero блок',
    description: 'Добавьте описание',
    buttonText: 'Подробнее'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/accent.svg']
} as const
