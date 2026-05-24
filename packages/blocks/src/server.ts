import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BuilderPage } from '@randee/builder'
import { exportPageToJson } from '@randee/builder'
import { getBlockTemplate, getTemplateFolderName } from './registry'
import { collectPageVendors } from './vendors/collect'
import {
  findVendorFile,
  getVendor,
  getVendorAssetBasename,
  type VendorFileRef,
  type VendorId
} from './vendors/registry'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function monorepoRoot(): string {
  return join(packageRoot, '..', '..')
}

function templateRoot(templateId: string): string | null {
  const folder = getTemplateFolderName(templateId)
  if (!folder) return null
  return join(packageRoot, 'src', 'templates', folder)
}

export function readTemplateAssetFile(templateId: string, relativePath: string): Buffer | null {
  const root = templateRoot(templateId)
  if (!root) return null
  const filePath = join(root, relativePath)
  if (!existsSync(filePath)) return null
  return readFileSync(filePath)
}

export function readTemplateAssetText(templateId: string, relativePath: string): string | null {
  const file = readTemplateAssetFile(templateId, relativePath)
  return file ? file.toString('utf8') : null
}

function resolveTemplateAssetPath(templateId: string, relativePath: string): string | null {
  const root = templateRoot(templateId)
  if (!root) return null

  const normalizedRoot = normalize(root)
  const filePath = normalize(join(root, relativePath.replace(/^\/+/, '')))
  if (!filePath.startsWith(normalizedRoot)) return null
  return filePath
}

export function writeTemplateAssetText(templateId: string, relativePath: string, content: string): boolean {
  const filePath = resolveTemplateAssetPath(templateId, relativePath)
  if (!filePath) return false
  writeFileSync(filePath, content, 'utf8')
  return true
}

export function readVendorAssetFile(vendorId: VendorId, basename: string): Buffer | null {
  const fileRef = findVendorFile(vendorId, basename)
  if (!fileRef) return null

  const filePath = join(monorepoRoot(), 'node_modules', fileRef.resolve)
  if (!existsSync(filePath)) return null
  return readFileSync(filePath)
}

export function getVendorAssetUrl(vendorId: VendorId, basename: string): string {
  return `/api/vendor-assets/${vendorId}/${basename}`
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripExportInit(script: string): string {
  return script
    .replace(/^\s*export\s+function\s+init\s*\(/m, 'function init(')
    .replace(/^\s*export\s*\{\s*init\s*\}\s*;?\s*$/m, '')
}

function wrapBlockScript(templateId: string, script: string): string {
  const body = stripExportInit(script)
  return `<script data-randee-template="${templateId}">
${body}

document.querySelectorAll('[data-randee-template="${templateId}"]').forEach(function (root) {
  if (typeof init === 'function') init(root)
})
</script>`
}

function vendorTags(vendorIds: VendorId[]): { head: string; body: string } {
  const head: string[] = []
  const body: string[] = []

  for (const vendorId of vendorIds) {
    const vendor = getVendor(vendorId)
    for (const file of vendor.styles ?? []) {
      const basename = getVendorAssetBasename(file)
      head.push(
        `<link rel="stylesheet" href="${getVendorAssetUrl(vendorId, basename)}" data-randee-vendor="${vendorId}" />`
      )
    }
    for (const file of vendor.scripts) {
      const basename = getVendorAssetBasename(file)
      body.push(`<script src="${getVendorAssetUrl(vendorId, basename)}" data-randee-vendor="${vendorId}"></script>`)
    }
  }

  return { head: head.join('\n  '), body: body.join('\n') }
}

function blockToHtml(block: BuilderPage['blocks'][number]): string {
  const entry = getBlockTemplate(block.template)
  const attrs = Object.entries(block.props)
    .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
    .join(' ')

  const style = entry ? readTemplateAssetText(block.template, entry.assets.stylePath) : null
  const styleTag = style ? `<style data-randee-template="${block.template}">\n${style}\n</style>` : ''
  const rootClass = entry ? `randee-${block.template.replace(/\./g, '-')}` : 'randee-block-root'

  return `${styleTag}
<section class="randee-block randee-${block.type.replace('.', '-')}" data-randee-block="${block.template}">
  <div class="${rootClass}" data-randee-template="${block.template}" ${attrs}></div>
</section>`
}

function blockInitScripts(blocks: BuilderPage['blocks']): string {
  return blocks
    .map((block) => {
      const entry = getBlockTemplate(block.template)
      const script = entry ? readTemplateAssetText(block.template, entry.assets.scriptPath) : null
      return script ? wrapBlockScript(block.template, script) : ''
    })
    .filter(Boolean)
    .join('\n')
}

export function exportPageToHtmlWithAssets(page: BuilderPage): string {
  const vendorIds = collectPageVendors(page)
  const vendors = vendorTags(vendorIds)
  const body = page.blocks.map(blockToHtml).join('\n')
  const inits = blockInitScripts(page.blocks)

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(page.page)}</title>
  ${vendors.head}
</head>
<body>
${body}
${vendors.body}
${inits}
</body>
</html>`
}

export { exportPageToJson }
export {
  createComponentTemplate,
  listComponentTemplatesFromDisk,
  listSavedComponentsFromDisk,
  saveComponentToAssets
} from './create-component'
export { mapUserComponentBlockToBitrix } from './bitrix-export'
export type { CreatedComponentTemplate } from './component-io'

export type { VendorFileRef }
