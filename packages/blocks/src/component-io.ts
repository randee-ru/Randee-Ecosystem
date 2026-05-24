import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
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

const DUPLICATE_ASSET_FILES = ['preview.tsx', 'style.css', 'script.js', 'init.ts'] as const

function previewComponentName(templateId: string): string {
  return (
    templateId
      .split(/[-.]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Preview'
  )
}

function replaceTemplateIdInContent(content: string, fromId: string, toId: string): string {
  const fromCls = fromId.replace(/\./g, '-')
  const toCls = toId.replace(/\./g, '-')
  const fromName = previewComponentName(fromId)
  const toName = previewComponentName(toId)
  return content.replaceAll(fromId, toId).replaceAll(fromCls, toCls).replaceAll(fromName, toName)
}

export function duplicateComponentTemplate(
  sourceTemplateId: string,
  options?: { name?: string }
): CreatedComponentTemplate | null {
  const sourceDir = getUserComponentDirectory(sourceTemplateId)
  const sourceMeta = readComponentMeta(sourceTemplateId)
  if (!sourceDir || !sourceMeta || !existsSync(sourceDir)) return null

  const root = componentsRoot()
  if (!existsSync(root)) mkdirSync(root, { recursive: true })
  const existing = readdirSync(root).filter((name) => isUserComponentTemplateId(name))
  const max = existing.reduce((acc, name) => {
    const value = Number(name.replace('component-', ''))
    return Number.isFinite(value) ? Math.max(acc, value) : acc
  }, 0)
  const templateId = `component-${String(max + 1).padStart(2, '0')}`
  const targetDir = join(root, templateId)
  const displayName = options?.name?.trim() || `${sourceMeta.name} Copy`

  cpSync(sourceDir, targetDir, { recursive: true })

  for (const file of DUPLICATE_ASSET_FILES) {
    const filePath = join(targetDir, file)
    if (!existsSync(filePath)) continue
    const content = readFileSync(filePath, 'utf8')
    writeFileSync(filePath, replaceTemplateIdInContent(content, sourceTemplateId, templateId))
  }

  const updated: BlockTemplateManifest = {
    ...sourceMeta,
    id: templateId,
    name: displayName,
    savedToAssets: false,
    defaultProps: {
      ...sourceMeta.defaultProps,
      title: displayName
    }
  }

  writeComponentMeta(templateId, updated)
  syncManifestTs(templateId, updated)

  return { templateId, manifest: updated, assets: USER_COMPONENT_ASSETS }
}

export function renameComponentTemplate(
  templateId: string,
  options: { name: string; description?: string }
): CreatedComponentTemplate | null {
  const meta = readComponentMeta(templateId)
  if (!meta) return null

  const name = options.name.trim()
  if (!name) return null

  const updated: BlockTemplateManifest = {
    ...meta,
    name,
    description: options.description?.trim() || meta.description,
    defaultProps: {
      ...meta.defaultProps,
      title: name
    }
  }

  writeComponentMeta(templateId, updated)
  syncManifestTs(templateId, updated)

  return { templateId, manifest: updated, assets: USER_COMPONENT_ASSETS }
}

export function deleteComponentTemplate(templateId: string): boolean {
  const dir = getUserComponentDirectory(templateId)
  if (!dir || !existsSync(dir)) return false
  rmSync(dir, { recursive: true, force: true })
  return true
}
