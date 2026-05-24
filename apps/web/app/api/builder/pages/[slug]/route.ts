import type { BuilderPage } from '@randee/builder'
import { readStoredPage, writeStoredPage } from '../../../../../lib/pages-store'

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
    return Response.json({ ok: true, slug })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save page'
    return Response.json({ error: message }, { status: 500 })
  }
}
