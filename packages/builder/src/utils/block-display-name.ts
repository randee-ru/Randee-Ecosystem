import type { PageBlock } from '../types/page'

export function getBlockDisplayName(block: PageBlock, templateName?: string): string {
  const custom = block.name?.trim()
  if (custom) return custom
  return templateName ?? block.template
}
