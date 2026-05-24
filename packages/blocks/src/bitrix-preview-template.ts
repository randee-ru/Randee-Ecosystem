import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export type PreviewPropBinding = {
  varName: string
  propKey: string
  defaultValue: string
}

export type BitrixPreviewTemplate = {
  templatePhp: string
  params: Record<string, string>
  templateData: Record<string, string>
}

function unquote(value: string): string {
  const quote = value[0]
  if (quote !== "'" && quote !== '"') return value
  return value.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"')
}

export function propKeyToPhpVar(propKey: string): string {
  return propKey.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()
}

export function parsePreviewPropBindings(previewTsx: string): PreviewPropBinding[] {
  const bindings: PreviewPropBinding[] = []
  const seen = new Set<string>()

  const patterns = [
    /const\s+(\w+)\s*=\s*block\.props\.(\w+)\s*\?\?\s*('(?:\\'|[^'])*'|"[^"]*")/g,
    /const\s+(\w+)\s*=\s*block\.props\.(\w+)\s*\?\?\s*block\.name\s*\?\?\s*('(?:\\'|[^'])*'|"[^"]*")/g
  ]

  for (const pattern of patterns) {
    for (const match of previewTsx.matchAll(pattern)) {
      const propKey = match[2]
      if (seen.has(propKey)) continue
      seen.add(propKey)
      bindings.push({
        varName: match[1],
        propKey,
        defaultValue: unquote(match[3])
      })
    }
  }

  return bindings
}

export function extractPreviewJsxBody(previewTsx: string): string {
  const frameMatch = previewTsx.match(/<TemplateFrame[\s\S]*?>\s*([\s\S]*?)\s*<\/TemplateFrame>/)
  if (frameMatch?.[1]) return frameMatch[1].trim()

  const returnMatch = previewTsx.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*\n\}/)
  return returnMatch?.[1]?.trim() ?? ''
}

function escapePhpString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function jsxToBitrixHtml(
  jsx: string,
  options: {
    templateId: string
    blockType: string
    rootClass: string
    bindings: PreviewPropBinding[]
    blockProps: Record<string, string>
  }
): string {
  let html = jsx

  html = html.replace(/className=/g, 'class=')
  html = html.replace(/class=\{`([^`]*)\$\{cls\}([^`]*)`\}/g, (_, _prefix, suffix) => {
    return `class="${escapeHtmlAttr(`${options.rootClass}${suffix}`)}"`
  })
  html = html.replace(/class=\{`([^`]+)`\}/g, (_, inner) => {
    return `class="${escapeHtmlAttr(inner.replace(/\$\{cls\}/g, options.rootClass))}"`
  })

  html = html.replace(
    /src=\{getTemplateAssetUrl\(block\.template,\s*'([^']+)'\)\}/g,
    'src="<?= $templateFolder ?>/$1"'
  )
  html = html.replace(/\{block\.template\}/g, escapeHtmlAttr(options.templateId))

  for (const binding of options.bindings) {
    const phpVar = propKeyToPhpVar(binding.propKey)
    html = html.replace(new RegExp(`\\{${binding.varName}\\}`, 'g'), `<?= $${phpVar} ?>`)
  }

  for (const [propKey] of Object.entries(options.blockProps)) {
    const phpVar = propKeyToPhpVar(propKey)
    html = html.replace(new RegExp(`\\{block\\.props\\.${propKey}\\}`, 'g'), `<?= $${phpVar} ?>`)
  }

  html = html
    .replace(/\s*\n+\s*/g, '\n')
    .replace(/>\s+</g, '>\n<')
    .trim()

  return html
}

export function buildBitrixTemplateFromPreview(
  previewTsx: string,
  options: {
    templateId: string
    blockType: string
    blockProps: Record<string, string>
    paramLabels?: Record<string, string>
    designStyleAttribute?: string
  }
): BitrixPreviewTemplate {
  const rootClass = `randee-${options.templateId.replace(/\./g, '-')}`
  const bindings = parsePreviewPropBindings(previewTsx)
  const jsxBody = extractPreviewJsxBody(previewTsx)

  const params: Record<string, string> = {}
  const templateData: Record<string, string> = {}

  for (const binding of bindings) {
    const phpVar = propKeyToPhpVar(binding.propKey)
    params[phpVar] = options.paramLabels?.[binding.propKey] ?? binding.propKey
    templateData[phpVar] = options.blockProps[binding.propKey] ?? binding.defaultValue
  }

  for (const [propKey, value] of Object.entries(options.blockProps)) {
    const phpVar = propKeyToPhpVar(propKey)
    if (!(phpVar in params)) {
      params[phpVar] = options.paramLabels?.[propKey] ?? propKey
      templateData[phpVar] = value
    }
  }

  const templateVars = Object.entries(templateData)
    .map(([key, value]) => `$${key} = htmlspecialcharsbx($arParams['${key}'] ?? '${escapePhpString(value)}');`)
    .join('\n')

  const innerHtml = jsxBody
    ? jsxToBitrixHtml(jsxBody, {
        templateId: options.templateId,
        blockType: options.blockType,
        rootClass,
        bindings,
        blockProps: options.blockProps
      })
    : ''

  const templatePhp = `<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
$templateFolder = $this->GetFolder();
${templateVars}
?>
<div class="${rootClass}" data-randee-template="${options.templateId}" data-randee-type="${options.blockType}"${options.designStyleAttribute ?? ''}>
${innerHtml}
</div>
`

  return { templatePhp, params, templateData }
}

export function readTemplateSourceFile(
  packageRoot: string,
  templateId: string,
  folder: string | null,
  userComponentDir: string | null,
  relativePath: string
): string | null {
  const candidates = [
    userComponentDir ? join(userComponentDir, relativePath) : null,
    folder ? join(packageRoot, 'src', 'templates', folder, relativePath) : null
  ].filter(Boolean) as string[]

  for (const filePath of candidates) {
    if (existsSync(filePath)) return readFileSync(filePath, 'utf8')
  }

  return null
}

export function stripBitrixScript(script: string, templateId: string): string {
  const body = script
    .replace(/^\s*export\s+function\s+init\s*\(/m, 'function init(')
    .replace(/^\s*export\s*\{\s*init\s*\}\s*;?\s*$/m, '')
    .trim()

  return `${body}

document.querySelectorAll('[data-randee-template="${templateId}"]').forEach(function (root) {
  if (typeof init === 'function') init(root);
});
`
}
