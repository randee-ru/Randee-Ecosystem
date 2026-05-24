import type { BitrixComponentDescriptor } from '@randee/bitrix-adapter'
import type { PageBlock } from '@randee/builder'
import { inlineStyleHtmlAttribute } from '@randee/builder'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isUserComponentTemplateId } from './component-template-id'
import { getUserComponentDirectory, readComponentMeta, readTemplateAssetText } from './component-io'
import {
  buildBitrixTemplateFromPreview,
  readTemplateSourceFile,
  stripBitrixScript
} from './bitrix-preview-template'
import { resolveTemplateAssets, resolveTemplateFolder, resolveTemplateManifest } from './template-path'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function bitrixComponentName(block: PageBlock): string {
  if (block.type === 'component' && isUserComponentTemplateId(block.template)) {
    return block.template.replace(/-/g, '_')
  }

  if (block.type === 'hero' && block.template.startsWith('hero-')) return 'hero'
  if (block.type === 'faq') return 'faq'
  if (block.type === 'catalog.section') return 'catalog.section'

  return block.template.replace(/-/g, '_').replace(/\./g, '_')
}

function collectStaticAssets(
  templateId: string,
  folder: string | null,
  userComponentDir: string | null
): BitrixComponentDescriptor['staticAssets'] {
  const assets = resolveTemplateAssets(templateId)
  if (!assets) return []

  return assets.images
    .map((relativePath) => {
      const content = readTemplateSourceFile(packageRoot, templateId, folder, userComponentDir, relativePath)
      if (!content) return null
      return { path: relativePath, content }
    })
    .filter((entry): entry is { path: string; content: string } => entry !== null)
}

function buildDescriptorFromPreview(
  block: PageBlock,
  meta: { name: string; description: string; propsSchema?: Array<{ name: string; label: string }> }
): BitrixComponentDescriptor | null {
  const folder = resolveTemplateFolder(block.template)
  const userComponentDir = getUserComponentDirectory(block.template)
  const previewTsx =
    readTemplateAssetText(block.template, 'preview.tsx') ??
    readTemplateSourceFile(packageRoot, block.template, folder, userComponentDir, 'preview.tsx')

  if (!previewTsx) return null

  const paramLabels = Object.fromEntries((meta.propsSchema ?? []).map((field) => [field.name, field.label]))
  const previewTemplate = buildBitrixTemplateFromPreview(previewTsx, {
    templateId: block.template,
    blockType: block.type,
    blockProps: block.props,
    paramLabels,
    designStyleAttribute: inlineStyleHtmlAttribute(block.design)
  })

  const css =
    readTemplateAssetText(block.template, 'style.css') ??
    readTemplateSourceFile(packageRoot, block.template, folder, userComponentDir, 'style.css') ??
    ''
  const scriptSource =
    readTemplateAssetText(block.template, 'script.js') ??
    readTemplateSourceFile(packageRoot, block.template, folder, userComponentDir, 'script.js') ??
    ''

  return {
    namespace: 'randee',
    name: bitrixComponentName(block),
    title: meta.name,
    description: meta.description,
    params: previewTemplate.params,
    templateData: previewTemplate.templateData,
    css,
    js: scriptSource ? stripBitrixScript(scriptSource, block.template) : undefined,
    templatePhp: previewTemplate.templatePhp,
    staticAssets: collectStaticAssets(block.template, folder, userComponentDir)
  }
}

export function mapUserComponentBlockToBitrix(block: PageBlock): BitrixComponentDescriptor | null {
  if (block.type !== 'component' || !isUserComponentTemplateId(block.template)) return null

  const meta = readComponentMeta(block.template)
  if (!meta?.savedToAssets) return null

  return buildDescriptorFromPreview(block, meta)
}

export function mapBuiltinBlockToBitrix(block: PageBlock): BitrixComponentDescriptor | null {
  const manifest = resolveTemplateManifest(block.template)
  if (!manifest) return null

  return buildDescriptorFromPreview(block, manifest)
}

export function mapPageBlockToBitrix(block: PageBlock): BitrixComponentDescriptor | null {
  if (block.type === 'component' && isUserComponentTemplateId(block.template)) {
    return mapUserComponentBlockToBitrix(block)
  }

  return mapBuiltinBlockToBitrix(block)
}

// Legacy export name used by existing mappers/tests.
export { mapPageBlockToBitrix as mapBlockTemplateToBitrix }
