import { getBlockTemplate } from './registry'
import type { BlockPropField, BlockTemplateManifest } from './types'

function humanizePropName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (char) => char.toUpperCase())
    .trim()
}

export function resolvePropFields(manifest: BlockTemplateManifest): BlockPropField[] {
  if (manifest.propsSchema?.length) return manifest.propsSchema

  return Object.keys(manifest.defaultProps).map((name) => ({
    name,
    label: humanizePropName(name),
    type: 'text' as const
  }))
}

export function getBlockPropFieldsForTemplate(templateId: string): BlockPropField[] {
  const entry = getBlockTemplate(templateId)
  if (!entry) return []
  return resolvePropFields(entry.manifest)
}
