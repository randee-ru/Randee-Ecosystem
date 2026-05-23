import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'faq-01',
  type: 'faq',
  group: 'FAQ',
  name: 'FAQ Accordion',
  description: 'Классический список вопросов',
  defaultProps: {
    title: "Частые вопросы",
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
