import { getProjectBySlug } from '../../../../../../lib/projects-store'
import { listDesignFiles, createDesignFile } from '../../../../../../lib/design-store'
import { getSession } from '../../../../../../lib/auth'
import { cookies } from 'next/headers'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return Response.json({ ok: false, error: 'Not found' }, { status: 404 })

  const files = await listDesignFiles(project.id)
  return Response.json({ ok: true, files })
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  if (!session) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return Response.json({ ok: false, error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as { name?: string }
  const file = await createDesignFile({ name: body.name?.trim() || 'Untitled', projectId: project.id })
  return Response.json({ ok: true, file })
}
