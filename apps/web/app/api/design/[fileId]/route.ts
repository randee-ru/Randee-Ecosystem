import { getDesignFile, saveDesignFile, renameDesignFile, deleteDesignFile } from '../../../../lib/design-store'
import { getSession } from '../../../../lib/auth'
import { cookies } from 'next/headers'

export async function GET(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const file = await getDesignFile(fileId)
  if (!file) return Response.json({ ok: false, error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true, file })
}

export async function PUT(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  if (!session) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  const body = (await req.json()) as { data: string }
  const file = await saveDesignFile(fileId, body.data)
  if (!file) return Response.json({ ok: false, error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true, file })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  if (!session) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  const body = (await req.json()) as { name?: string }
  if (body.name) {
    const file = await renameDesignFile(fileId, body.name.trim())
    if (!file) return Response.json({ ok: false, error: 'Not found' }, { status: 404 })
    return Response.json({ ok: true, file })
  }
  return Response.json({ ok: false, error: 'Nothing to update' }, { status: 400 })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const cookieStore = await cookies()
  const session = await getSession(cookieStore)
  if (!session) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { fileId } = await params
  await deleteDesignFile(fileId)
  return Response.json({ ok: true })
}
