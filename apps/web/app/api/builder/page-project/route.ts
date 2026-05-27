import { assignPageToProject, unassignPageFromProject, readPageProjectMap } from '../../../../lib/projects-store'

/**
 * GET /api/builder/page-project?page=home
 * Возвращает projectId для страницы, или null
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    if (!page) {
      return Response.json({ ok: false, error: 'page param required' }, { status: 400 })
    }
    const map = await readPageProjectMap()
    return Response.json({ ok: true, projectId: map[page] ?? null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get page project'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/**
 * POST /api/builder/page-project
 * Body: { page: "home", projectId: "p_..." }
 * Привязывает страницу к проекту. Если projectId = null — отвязывает.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { page: string; projectId: string | null }
    if (!body.page) {
      return Response.json({ ok: false, error: 'page is required' }, { status: 400 })
    }
    if (body.projectId) {
      await assignPageToProject(body.page, body.projectId)
    } else {
      await unassignPageFromProject(body.page)
    }
    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to assign page to project'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
