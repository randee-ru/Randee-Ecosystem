import { mapPageBlockToBitrix } from '@randee/blocks/server'
import { writeBitrixComponent } from '@randee/bitrix-adapter'
import { exportPageToJson, type BuilderPage } from '@randee/builder'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { zipDirectoryToBuffer } from '../../../../lib/zip-directory'

function exportFilename(page: BuilderPage): string {
  const slug = (page.slug || page.page || 'page').replace(/^\//, '').replace(/[^\w.-]+/g, '-')
  return `randee-bitrix-${slug || 'page'}.zip`
}

export async function POST(request: Request) {
  let exportRoot: string | null = null

  try {
    const page = (await request.json()) as BuilderPage
    exportRoot = join(tmpdir(), `randee-bitrix-${Date.now()}`)
    await mkdir(exportRoot, { recursive: true })

    const items: Array<{ blockId: string; bitrixComponent: string; targetDir: string }> = []

    for (const block of page.blocks) {
      const descriptor = mapPageBlockToBitrix(block)
      if (!descriptor) {
        if (block.type === 'component') {
          return Response.json(
            { error: `Component "${block.template}" must be saved to Assets before Bitrix export` },
            { status: 400 }
          )
        }
        return Response.json({ error: `Unsupported block template: ${block.template}` }, { status: 400 })
      }

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

    const zipBuffer = await zipDirectoryToBuffer(exportRoot)
    const filename = exportFilename(page)

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.byteLength)
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bitrix export failed'
    return Response.json({ error: message }, { status: 500 })
  } finally {
    if (exportRoot) {
      await rm(exportRoot, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}
