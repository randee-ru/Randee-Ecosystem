import { getProjectBySlug } from '@/lib/projects-store'
import { readOrganizerState, writeOrganizerState } from '@/lib/organizer-store'
import type { OrganizerState } from '@/lib/organizer-store'

type RouteContext = { params: Promise<{ slug: string }> }

/** GET /api/workspace/projects/[slug]/organizer — состояние органайзера */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const project = await getProjectBySlug(slug)
    if (!project) {
      return Response.json({ ok: false, error: 'Project not found' }, { status: 404 })
    }

    const organizer = await readOrganizerState(project.id)
    return Response.json({ ok: true, project, organizer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load organizer'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/** PUT /api/workspace/projects/[slug]/organizer — сохранить состояние органайзера */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const project = await getProjectBySlug(slug)
    if (!project) {
      return Response.json({ ok: false, error: 'Project not found' }, { status: 404 })
    }

    const body = (await request.json()) as { organizer?: OrganizerState }
    await writeOrganizerState(project.id, body.organizer ?? { selectedPageId: null, activeView: 'pages', pages: [], tasks: [], databases: [] })
    const organizer = await readOrganizerState(project.id)

    return Response.json({ ok: true, organizer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save organizer'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
