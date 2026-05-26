import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BuilderPage } from '@randee/builder'
import { exportPageToJson, inlineStyleHtmlAttribute } from '@randee/builder'
import { resolveTemplateAssets } from './template-path'
import { readTemplateAssetText } from './template-assets'
import { collectPageVendors } from './vendors/collect'
import {
  findVendorFile,
  getVendor,
  getVendorAssetBasename,
  type VendorFileRef,
  type VendorId
} from './vendors/registry'
import { mapPageBlockToBitrix } from './bitrix-export'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function monorepoRoot(): string {
  return join(packageRoot, '..', '..')
}

export {
  getTemplateAssetAbsolutePath,
  getTemplateAssetMime,
  getTemplateAssetsRevision,
  readTemplateAssetFile,
  readTemplateAssetText,
  writeTemplateAssetText
} from './template-assets'

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

/**
 * Конвертирует PHP-шаблон Bitrix в статичный HTML:
 * убирает <?php … ?> заголовок, заменяет <?= $VAR ?> на реальные значения.
 */
function phpTemplateToStaticHtml(
  templatePhp: string,
  templateData: Record<string, string>
): string {
  // Убираем блок PHP-заголовка: <?php ... ?>
  let html = templatePhp.replace(/^<\?php[\s\S]*?\?>\s*\n?/, '')

  // Заменяем <?= $VARNAME ?> → HTML-escaped значение из templateData
  for (const [key, value] of Object.entries(templateData)) {
    html = html.replace(new RegExp(`<\\?=\\s*\\$${key}\\s*\\?>`, 'g'), escapeHtml(value))
  }

  // Убираем оставшиеся PHP-теги (на всякий случай)
  html = html.replace(/<\?(?:php|=)[^?]*\?>/g, '')

  return html.trim()
}

function blockToHtml(block: BuilderPage['blocks'][number]): string {
  // Используем Bitrix pipeline — он уже умеет JSX → real HTML
  const descriptor = mapPageBlockToBitrix(block)
  if (descriptor?.templatePhp) {
    const styleTag = descriptor.css
      ? `<style data-randee-template="${block.template}">\n${descriptor.css}\n</style>`
      : ''
    const html = phpTemplateToStaticHtml(descriptor.templatePhp, descriptor.templateData ?? {})
    return `${styleTag}\n${html}`
  }

  // Fallback для блоков без дескриптора (unsaved components и т.п.)
  const assets = resolveTemplateAssets(block.template)
  const style = assets ? readTemplateAssetText(block.template, assets.stylePath) : null
  const styleTag = style ? `<style data-randee-template="${block.template}">\n${style}\n</style>` : ''
  const rootClass = assets ? `randee-${block.template.replace(/\./g, '-')}` : 'randee-block-root'
  const designStyle = inlineStyleHtmlAttribute(block.design)
  const attrs = Object.entries(block.props)
    .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
    .join(' ')

  return `${styleTag}
<section class="randee-block randee-${block.type.replace('.', '-')}" data-randee-block="${block.template}">
  <div class="${rootClass}" data-randee-template="${block.template}"${designStyle} ${attrs}></div>
</section>`
}

function blockInitScripts(blocks: BuilderPage['blocks']): string {
  return blocks
    .map((block) => {
      const assets = resolveTemplateAssets(block.template)
      const script = assets ? readTemplateAssetText(block.template, assets.scriptPath) : null
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
  saveComponentToAssets,
  duplicateComponentTemplate,
  renameComponentTemplate,
  deleteComponentTemplate
} from './create-component'
export { mapUserComponentBlockToBitrix, mapBuiltinBlockToBitrix, mapPageBlockToBitrix } from './bitrix-export'
export { buildCmsListComponentPhp, pageHasCmsListBindings } from './bitrix-cms-php'
export {
  exportBlockPackage,
  exportFilenameForBlock,
  createBlockSnapshotFromTemplate,
  type BlockExportManifest,
  type BlockExportResult
} from './export-block'
export type { CreatedComponentTemplate } from './component-io'

export type { VendorFileRef }
