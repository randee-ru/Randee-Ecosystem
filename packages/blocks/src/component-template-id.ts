import type { BlockTemplateAssets } from './types'

export function isUserComponentTemplateId(templateId: string): boolean {
  return /^component-\d+$/.test(templateId)
}

export function getUserComponentFolderPath(templateId: string): string | null {
  if (!isUserComponentTemplateId(templateId)) return null
  return `component/${templateId}`
}

export const USER_COMPONENT_ASSETS: BlockTemplateAssets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
}
