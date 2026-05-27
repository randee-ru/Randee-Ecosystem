import { createProject, listProjects } from '../../../../lib/projects-store'
import { listStoredPages } from '../../../../lib/pages-store'

/** GET /api/builder/projects — список проектов + кол-во страниц в каждом */
export async function GET() {
  try {
    const [projects, pages] = await Promise.all([listProjects(), listStoredPages()])

    // Считаем кол-во страниц и первую страницу для каждого проекта
    const enriched = projects.map((project) => {
      const projectPages = pages.filter((p) => p.projectId === project.id)
      const firstPage = projectPages[0]
      return {
        ...project,
        pageCount: projectPages.length,
        firstPageKey: firstPage?.pageKey ?? null,
      }
    })

    return Response.json({ ok: true, projects: enriched })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list projects'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

/** POST /api/builder/projects — создать проект */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name: string; url?: string }
    if (!body.name?.trim()) {
      return Response.json({ ok: false, error: 'name is required' }, { status: 400 })
    }
    const project = await createProject({ name: body.name.trim(), url: body.url })
    return Response.json({ ok: true, project })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
