import { getTemplateAssetAbsolutePath } from '@randee/blocks/server'

type RouteContext = {
  params: Promise<{ template: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { template } = await context.params
  const file = new URL(request.url).searchParams.get('file')?.trim()
  if (!file) {
    return Response.json({ error: 'file query parameter is required' }, { status: 400 })
  }

  const absolutePath = getTemplateAssetAbsolutePath(template, file)
  if (!absolutePath) {
    return Response.json({ error: `Asset "${file}" not found for template "${template}"` }, { status: 404 })
  }

  return Response.json({ template, file, absolutePath })
}
