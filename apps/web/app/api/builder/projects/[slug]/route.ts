import {
  deleteProject,
  getProjectBySlug,
  listProjects,
  updateProject,
} from '../../../../../lib/projects-store'
import { listStoredPages } from '../../../../../lib/pages-store'

type RouteContext = { params: Promise<{ slug: string }> }

/** GET /api/builder/projects/[slug] — проект + его страницы */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const project = await getProjectBySlug(slug)
    if (!project) {
      return Response.json({ ok: false, error: 'Project not found' }, { status: 404 })
    }

    const allPages = await listStoredPages()
    const pages = allPages.filter((p) => p.projectId === project.id)

    return Response.json({ ok: true, project, pages })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get project'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/** PATCH /api/builder/projects/[slug] — обновить проект (name, url) */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const project = await getProjectBySlug(slug)
    if (!project) {
      return Response.json({ ok: false, error: 'Project not found' }, { status: 404 })
    }

    const body = (await request.json()) as { name?: string; url?: string }
    const updated = await updateProject(project.id, {
      name: body.name?.trim() || project.name,
      url: body.url,
    })
    return Response.json({ ok: true, project: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/** DELETE /api/builder/projects/[slug] — удалить проект (страницы остаются, просто отвязываются) */
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const projects = await listProjects()
    const project = projects.find((p) => p.slug === slug)
    if (!project) {
      return Response.json({ ok: false, error: 'Project not found' }, { status: 404 })
    }

    await deleteProject(project.id)
    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete project'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
