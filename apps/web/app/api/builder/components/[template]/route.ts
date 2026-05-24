import { deleteComponentTemplate, listComponentTemplatesFromDisk, renameComponentTemplate } from '@randee/blocks/server'

type RouteContext = {
  params: Promise<{ template: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { template } = await context.params
  const entry = listComponentTemplatesFromDisk().find((item) => item.templateId === template)
  if (!entry) {
    return Response.json({ error: `Component "${template}" not found` }, { status: 404 })
  }
  return Response.json(entry)
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { template } = await context.params
    const body = (await request.json()) as { name?: string; description?: string }
    if (!body.name?.trim()) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const updated = renameComponentTemplate(template, {
      name: body.name,
      description: body.description
    })
    if (!updated) {
      return Response.json({ error: `Component "${template}" not found` }, { status: 404 })
    }
    return Response.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to rename component'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { template } = await context.params
    const exists = listComponentTemplatesFromDisk().some((item) => item.templateId === template)
    if (!exists) {
      return Response.json({ error: `Component "${template}" not found` }, { status: 404 })
    }

    const deleted = deleteComponentTemplate(template)
    if (!deleted) {
      return Response.json({ error: `Failed to delete component "${template}"` }, { status: 500 })
    }
    return Response.json({ ok: true, templateId: template })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete component'
    return Response.json({ error: message }, { status: 500 })
  }
}
