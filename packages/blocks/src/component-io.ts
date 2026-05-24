import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BlockTemplateAssets, BlockTemplateManifest } from './types'
import { isUserComponentTemplateId, USER_COMPONENT_ASSETS } from './component-template-id'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const COMPONENT_TYPE = 'component'

export type CreatedComponentTemplate = {
  templateId: string
  manifest: BlockTemplateManifest
  assets: BlockTemplateAssets
}

export function getUserComponentDirectory(templateId: string): string | null {
  if (!isUserComponentTemplateId(templateId)) return null
  return join(packageRoot, 'src', 'templates', COMPONENT_TYPE, templateId)
}

export function componentsRoot(): string {
  return join(packageRoot, 'src', 'templates', COMPONENT_TYPE)
}

export function readComponentMeta(templateId: string): BlockTemplateManifest | null {
  const dir = getUserComponentDirectory(templateId)
  if (!dir) return null
  const metaPath = join(dir, 'meta.json')
  if (!existsSync(metaPath)) return null
  return JSON.parse(readFileSync(metaPath, 'utf8')) as BlockTemplateManifest
}

export function readTemplateAssetText(templateId: string, relativePath: string): string | null {
  const dir = getUserComponentDirectory(templateId)
  if (!dir) return null
  const filePath = join(dir, relativePath)
  if (!existsSync(filePath)) return null
  return readFileSync(filePath, 'utf8')
}

function writeComponentMeta(templateId: string, manifest: BlockTemplateManifest): void {
  const dir = getUserComponentDirectory(templateId)
  if (!dir) throw new Error(`Unknown component: ${templateId}`)
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}

function syncManifestTs(templateId: string, manifest: BlockTemplateManifest): void {
  const dir = getUserComponentDirectory(templateId)
  if (!dir) return
  const safeName = manifest.name.replace(/'/g, "\\'")
  writeFileSync(
    join(dir, 'manifest.ts'),
    `import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: '${templateId}',
  type: 'component',
  group: 'Custom',
  name: '${safeName}',
  description: '${manifest.description.replace(/'/g, "\\'")}',
  savedToAssets: ${manifest.savedToAssets ? 'true' : 'false'},
  defaultProps: {
    title: '${safeName}'
  }
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
`
  )
}

export function saveComponentToAssets(templateId: string, options?: { name?: string }): CreatedComponentTemplate | null {
  const meta = readComponentMeta(templateId)
  if (!meta) return null

  const name = options?.name?.trim() || meta.name
  const updated: BlockTemplateManifest = {
    ...meta,
    name,
    savedToAssets: true,
    defaultProps: {
      ...meta.defaultProps,
      title: name
    }
  }

  writeComponentMeta(templateId, updated)
  syncManifestTs(templateId, updated)

  return { templateId, manifest: updated, assets: USER_COMPONENT_ASSETS }
}

export function listComponentTemplatesFromDisk(): CreatedComponentTemplate[] {
  const root = componentsRoot()
  if (!existsSync(root)) return []

  return readdirSync(root)
    .filter(isUserComponentTemplateId)
    .sort()
    .map((templateId) => {
      const manifest = readComponentMeta(templateId)
      if (!manifest) return null
      return { templateId, manifest, assets: USER_COMPONENT_ASSETS }
    })
    .filter((entry): entry is CreatedComponentTemplate => entry !== null)
}

export function listSavedComponentsFromDisk(): CreatedComponentTemplate[] {
  return listComponentTemplatesFromDisk().filter((entry) => entry.manifest.savedToAssets === true)
}
