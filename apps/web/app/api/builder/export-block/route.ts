import type { PageBlock } from '@randee/builder'
import { exportBlockPackage, exportFilenameForBlock } from '@randee/blocks/server'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { zipDirectoryToBuffer } from '../../../../lib/zip-directory'

export async function POST(request: Request) {
  let exportRoot: string | null = null

  try {
    const block = (await request.json()) as PageBlock
    exportRoot = join(tmpdir(), `randee-block-${Date.now()}`)
    await exportBlockPackage(block, exportRoot)

    const zipBuffer = await zipDirectoryToBuffer(exportRoot)
    const filename = exportFilenameForBlock(block)

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(zipBuffer.byteLength)
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Block export failed'
    const status = message.includes('saved to Assets') ? 400 : 500
    return Response.json({ error: message }, { status })
  } finally {
    if (exportRoot) {
      await rm(exportRoot, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}
