import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BuilderPage } from '@randee/builder'
import { exportPageToJson } from '@randee/builder'
import { getBlockTemplate, getTemplateFolderName } from './registry'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

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

export function getTemplateAssetMime(relativePath: string): string {
  if (relativePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (relativePath.endsWith('.js')) return 'text/javascript; charset=utf-8'
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

function blockToHtml(block: BuilderPage['blocks'][number]): string {
  const entry = getBlockTemplate(block.template)
  const attrs = Object.entries(block.props)
    .map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
    .join(' ')

  const style = entry ? readTemplateAssetText(block.template, entry.assets.stylePath) : null
  const script = entry ? readTemplateAssetText(block.template, entry.assets.scriptPath) : null

  const styleTag = style ? `<style data-randee-template="${block.template}">\n${style}\n</style>` : ''
  const scriptTag = script ? `<script data-randee-template="${block.template}">\n${script}\n</script>` : ''

  return `${styleTag}
<section class="randee-block randee-${block.type.replace('.', '-')}" data-randee-template="${block.template}">
  <div ${attrs}></div>
</section>
${scriptTag}`
}

export function exportPageToHtmlWithAssets(page: BuilderPage): string {
  const body = page.blocks.map(blockToHtml).join('\n')
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(page.page)}</title>
</head>
<body>
${body}
</body>
</html>`
}

export { exportPageToJson }
