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
  },
  propsSchema: [
    { name: 'title', label: 'Заголовок', type: 'text' },
    { name: 'description', label: 'Описание', type: 'text' },
    { name: 'buttonText', label: 'Текст кнопки', type: 'text' }
  ]
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/accent.svg']
} as const
