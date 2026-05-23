import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { writeBitrixComponent } from '@randee/bitrix-adapter'
import { mapBlockToBitrixComponent } from '../mappers/bitrix-map'
import type { ExportManifest, RandeePageSchema } from '../types/page-schema'
import { validatePageSchema } from '../validation/page-validator'
import { buildWebPageJsonLd } from './seo-jsonld'

export async function exportPageToBitrix(page: RandeePageSchema, rootDir: string): Promise<ExportManifest> {
  validatePageSchema(page)
  await mkdir(rootDir, { recursive: true })

  const items: ExportManifest['items'] = []

  for (const block of page.blocks) {
    const descriptor = mapBlockToBitrixComponent(block)
    const componentDir = await writeBitrixComponent(descriptor, { rootDir })

    items.push({
      blockId: block.id,
      blockType: block.type,
      bitrixComponent: `${descriptor.namespace}:${descriptor.name}`,
      targetDir: componentDir
    })
  }

  const manifest: ExportManifest = {
    page: page.page,
    slug: page.slug,
    generatedAt: new Date().toISOString(),
    items
  }

  await writeFile(join(rootDir, 'randee-export-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  if (page.seo) {
    await writeFile(
      join(rootDir, 'randee-seo.json'),
      JSON.stringify(
        {
          meta: page.seo,
          jsonLd: buildWebPageJsonLd(page.seo)
        },
        null,
        2
      ),
      'utf8'
    )
  }

  return manifest
}
