import { mapPageBlockToBitrix, exportPageToHtmlWithAssets } from '@randee/blocks/server'
import { writeBitrixComponent } from '@randee/bitrix-adapter'
import type { BuilderPage } from '@randee/builder'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { zipDirectoryToBuffer } from '../../../../lib/zip-directory'

function exportFilename(page: BuilderPage): string {
  const slug = (page.slug || page.page || 'page').replace(/^\//, '').replace(/[^\w.-]+/g, '-')
  return `randee-full-${slug || 'page'}.zip`
}

export async function POST(request: Request) {
  let exportRoot: string | null = null

  try {
    const page = (await request.json()) as BuilderPage
    exportRoot = join(tmpdir(), `randee-full-${Date.now()}`)
    await mkdir(exportRoot, { recursive: true })

    const warnings: string[] = []

    // ── 1. Статичный HTML ────────────────────────────────────────────────────
    const html = exportPageToHtmlWithAssets(page)
    await writeFile(join(exportRoot, 'page.html'), html, 'utf8')

    // ── 2. Bitrix компоненты ─────────────────────────────────────────────────
    const bitrixRoot = join(exportRoot, 'bitrix')
    await mkdir(bitrixRoot, { recursive: true })

    const exportedComponents: string[] = []

    for (const block of page.blocks) {
      const descriptor = mapPageBlockToBitrix(block)
      if (!descriptor) {
        if (block.type === 'component') {
          warnings.push(
            `Component "${block.template}" не сохранён в Assets — пропущен в Bitrix экспорте`
          )
        } else {
          warnings.push(`Неподдерживаемый шаблон "${block.template}" — пропущен`)
        }
        continue
      }
      await writeBitrixComponent(descriptor, { rootDir: bitrixRoot })
      exportedComponents.push(`${descriptor.namespace}:${descriptor.name}`)
    }

    // ── 3. README.txt ────────────────────────────────────────────────────────
    const readme = `Randee Full Export
==================

Страница: ${page.page}
Slug: ${page.slug ?? '—'}
Дата экспорта: ${new Date().toISOString()}

Содержимое:
  page.html        — статичный HTML для любого хостинга
  bitrix/          — компоненты Bitrix (local/components/randee/...)

Установка Bitrix:
  Скопируйте папку bitrix/local/ в корень вашего Bitrix-сайта.
  Компоненты появятся в разделе local/components/randee/.

Компонентов экспортировано: ${exportedComponents.length}
${exportedComponents.map((c) => `  · ${c}`).join('\n')}
${warnings.length > 0 ? `\nПредупреждения:\n${warnings.map((w) => `  ⚠ ${w}`).join('\n')}` : ''}
`
    await writeFile(join(exportRoot, 'README.txt'), readme, 'utf8')

    // ── 4. Манифест ──────────────────────────────────────────────────────────
    await writeFile(
      join(exportRoot, 'manifest.json'),
      JSON.stringify(
        {
          page: page.page,
          slug: page.slug,
          exportedAt: new Date().toISOString(),
          components: exportedComponents,
          warnings
        },
        null,
        2
      ),
      'utf8'
    )

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
    const message = error instanceof Error ? error.message : 'Full export failed'
    return Response.json({ error: message }, { status: 500 })
  } finally {
    if (exportRoot) {
      await rm(exportRoot, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}
