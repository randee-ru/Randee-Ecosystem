import { mapBlockToBitrixComponent } from '@randee/exporter'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeBitrixComponent } from '@randee/bitrix-adapter'
import { exportPageToJson, type BuilderPage } from '@randee/builder'
import { mapUserComponentBlockToBitrix } from '@randee/blocks/server'

export async function POST(request: Request) {
  try {
    const page = (await request.json()) as BuilderPage
    const exportRoot = join(tmpdir(), `randee-bitrix-${Date.now()}`)
    await mkdir(exportRoot, { recursive: true })

    const items: Array<{ blockId: string; bitrixComponent: string; targetDir: string }> = []

    for (const block of page.blocks) {
      if (block.type === 'component') {
        const descriptor = mapUserComponentBlockToBitrix(block)
        if (!descriptor) {
          return Response.json(
            { error: `Component "${block.template}" must be saved to Assets before Bitrix export` },
            { status: 400 }
          )
        }
        const componentDir = await writeBitrixComponent(descriptor, { rootDir: exportRoot })
        items.push({
          blockId: block.id,
          bitrixComponent: `${descriptor.namespace}:${descriptor.name}`,
          targetDir: componentDir
        })
        continue
      }

      const descriptor = mapBlockToBitrixComponent({
        id: block.id,
        type: block.type,
        template: block.template,
        props: block.props,
        bindings: block.bindings as never
      })
      const componentDir = await writeBitrixComponent(descriptor, { rootDir: exportRoot })
      items.push({
        blockId: block.id,
        bitrixComponent: `${descriptor.namespace}:${descriptor.name}`,
        targetDir: componentDir
      })
    }

    const manifest = {
      page: page.page,
      slug: page.slug,
      generatedAt: new Date().toISOString(),
      items
    }

    await writeFile(join(exportRoot, 'randee-export-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
    await writeFile(join(exportRoot, 'page.json'), exportPageToJson(page), 'utf8')

    return Response.json({ ok: true, exportRoot, manifest })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bitrix export failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
