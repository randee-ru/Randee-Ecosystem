import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'cta-01',
  type: 'cta',
  group: 'CTA',
  name: 'CTA Banner',
  description: 'Финальный призыв',
  defaultProps: {
    title: "Готовы начать?",
    description: "Оставьте заявку",
    buttonText: "Отправить",
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
