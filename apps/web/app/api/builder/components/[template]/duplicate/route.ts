import { duplicateComponentTemplate } from '@randee/blocks/server'

type RouteContext = {
  params: Promise<{ template: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { template } = await context.params
    const body = (await request.json().catch(() => ({}))) as { name?: string }
    const created = duplicateComponentTemplate(template, { name: body.name })
    if (!created) {
      return Response.json({ error: `Component "${template}" not found` }, { status: 404 })
    }
    return Response.json(created)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to duplicate component'
    return Response.json({ error: message }, { status: 500 })
  }
}
