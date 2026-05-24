import { saveComponentToAssets } from '@randee/blocks/server'

type RouteParams = {
  params: Promise<{ template: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const { template } = await params

  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string }
    const saved = saveComponentToAssets(template, { name: body.name })
    if (!saved) {
      return Response.json({ error: 'Component not found' }, { status: 404 })
    }
    return Response.json(saved)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save component'
    return Response.json({ error: message }, { status: 500 })
  }
}
