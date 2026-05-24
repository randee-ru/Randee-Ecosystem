import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveTemplateFolder } from './template-path'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function templateRoot(templateId: string): string | null {
  const folder = resolveTemplateFolder(templateId)
  if (!folder) return null
  return join(packageRoot, 'src', 'templates', folder)
}

function resolveTemplateAssetPath(templateId: string, relativePath: string): string | null {
  const root = templateRoot(templateId)
  if (!root) return null

  const normalizedRoot = normalize(root)
  const filePath = normalize(join(root, relativePath.replace(/^\/+/, '')))
  if (!filePath.startsWith(normalizedRoot)) return null
  return filePath
}

export function readTemplateAssetFile(templateId: string, relativePath: string): Buffer | null {
  const filePath = resolveTemplateAssetPath(templateId, relativePath)
  if (!filePath || !existsSync(filePath)) return null
  return readFileSync(filePath)
}

export function readTemplateAssetText(templateId: string, relativePath: string): string | null {
  const file = readTemplateAssetFile(templateId, relativePath)
  return file ? file.toString('utf8') : null
}

export function writeTemplateAssetText(templateId: string, relativePath: string, content: string): boolean {
  const filePath = resolveTemplateAssetPath(templateId, relativePath)
  if (!filePath) return false
  writeFileSync(filePath, content, 'utf8')
  return true
}

export function getTemplateAssetMime(relativePath: string): string {
  if (relativePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (relativePath.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (relativePath.endsWith('.ts')) return 'text/typescript; charset=utf-8'
  if (relativePath.endsWith('.tsx')) return 'text/typescript; charset=utf-8'
  if (relativePath.endsWith('.svg')) return 'image/svg+xml'
  if (relativePath.endsWith('.png')) return 'image/png'
  if (relativePath.endsWith('.jpg') || relativePath.endsWith('.jpeg')) return 'image/jpeg'
  if (relativePath.endsWith('.webp')) return 'image/webp'
  return 'application/octet-stream'
}
