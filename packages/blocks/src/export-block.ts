import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeBitrixComponent } from '@randee/bitrix-adapter'
import { createBlockId, type PageBlock } from '@randee/builder'
import { mapPageBlockToBitrix } from './bitrix-export'
import { getUserComponentDirectory, readComponentMeta } from './component-io'
import { isUserComponentTemplateId } from './component-template-id'
import { builtinTemplateManifests, resolveTemplateFolder, resolveTemplateAssets } from './template-path'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export function createBlockSnapshotFromTemplate(templateId: string): PageBlock | null {
  const manifest = readComponentMeta(templateId) ?? builtinTemplateManifests[templateId]
  if (!manifest) return null

  return {
    id: createBlockId(manifest.type),
    type: manifest.type,
    template: manifest.id,
    props: { ...manifest.defaultProps }
  }
}

export type BlockExportManifest = {
  templateId: string
  type: PageBlock['type']
  blockId: string
  name?: string
  props: Record<string, string>
  files: string[]
  bitrixComponent: string | null
  generatedAt: string
}

export type BlockExportResult = {
  manifest: BlockExportManifest
  exportRoot: string
  bitrixComponentDir: string | null
}

function listExportFilePaths(templateId: string): string[] {
  const assets = resolveTemplateAssets(templateId)
  if (!assets) return []

  const files = ['preview.tsx', 'init.ts', assets.stylePath, assets.scriptPath, ...assets.images]

  if (isUserComponentTemplateId(templateId)) {
    files.push('meta.json', 'manifest.ts')
  }

  return [...new Set(files)]
}

function templateSourceFolder(templateId: string): string | null {
  return resolveTemplateFolder(templateId)
}

function copyDirectoryContents(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) return
  mkdirSync(targetDir, { recursive: true })

  for (const entry of readdirSync(sourceDir)) {
    const sourcePath = join(sourceDir, entry)
    const targetPath = join(targetDir, entry)
    const stats = statSync(sourcePath)
    if (stats.isDirectory()) {
      cpSync(sourcePath, targetPath, { recursive: true })
    } else {
      cpSync(sourcePath, targetPath)
    }
  }
}

function copyTemplateSources(templateId: string, exportRoot: string): void {
  const targetDir = join(exportRoot, 'template-sources', templateId)
  const userDir = getUserComponentDirectory(templateId)
  if (userDir && existsSync(userDir)) {
    copyDirectoryContents(userDir, targetDir)
    return
  }

  const folder = templateSourceFolder(templateId)
  if (!folder) return

  const sourceDir = join(packageRoot, 'src', 'templates', folder)
  copyDirectoryContents(sourceDir, targetDir)
}

function resolveBitrixDescriptor(block: PageBlock) {
  return mapPageBlockToBitrix(block)
}

export async function exportBlockPackage(block: PageBlock, exportRoot: string): Promise<BlockExportResult> {
  await mkdir(exportRoot, { recursive: true })

  const descriptor = resolveBitrixDescriptor(block)
  if (block.type === 'component' && !descriptor) {
    throw new Error(`Component "${block.template}" must be saved to Assets before export`)
  }

  let bitrixComponentDir: string | null = null
  if (descriptor) {
    bitrixComponentDir = await writeBitrixComponent(descriptor, { rootDir: exportRoot })
  }

  copyTemplateSources(block.template, exportRoot)

  const files = listExportFilePaths(block.template)
  const manifest: BlockExportManifest = {
    templateId: block.template,
    type: block.type,
    blockId: block.id,
    name: block.name,
    props: { ...block.props },
    files,
    bitrixComponent: descriptor ? `${descriptor.namespace}:${descriptor.name}` : null,
    generatedAt: new Date().toISOString()
  }

  await writeFile(join(exportRoot, 'block.json'), `${JSON.stringify(block, null, 2)}\n`, 'utf8')
  await writeFile(
    join(exportRoot, 'randee-block-export-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  )

  const meta = readComponentMeta(block.template)
  if (meta) {
    await writeFile(
      join(exportRoot, 'template-meta.json'),
      `${JSON.stringify(meta, null, 2)}\n`,
      'utf8'
    )
  }

  return { manifest, exportRoot, bitrixComponentDir }
}

export function exportFilenameForBlock(block: PageBlock): string {
  const label = (block.name ?? block.template).replace(/[^\w.-]+/g, '-')
  return `randee-block-${label || block.template}.zip`
}
