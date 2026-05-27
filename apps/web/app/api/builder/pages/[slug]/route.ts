import type { BuilderPage } from '@randee/builder'
import { deleteStoredPage, readStoredPage, writeStoredPage } from '../../../../../lib/pages-store'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params
  const page = await readStoredPage(slug)
  if (!page) {
    return Response.json({ error: `Page "${slug}" not found` }, { status: 404 })
  }
  return Response.json(page)
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const page = (await request.json()) as BuilderPage
    await writeStoredPage(slug, page)

    // Инвалидируем кэш скриншота — обновится при следующем открытии workspace
    void invalidateThumbnail(slug, request)

    return Response.json({ ok: true, slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save page'
    return Response.json({ error: message }, { status: 500 })
  }
}

/** Удаляем старый кэш thumbnail чтобы при следующем открытии снялся новый скриншот */
async function invalidateThumbnail(slug: string, request: Request): Promise<void> {
  try {
    const { unlink } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const { randeeDataRoot } = await import('../../../../../lib/monorepo-root')
    const thumbFile = join(randeeDataRoot(), 'thumbnails', `${slug}.png`)
    await unlink(thumbFile)
  } catch {
    // Файла может не быть — это нормально
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    await deleteStoredPage(slug)
    return Response.json({ ok: true, slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete page'
    return Response.json({ error: message }, { status: 500 })
  }
}
