import { getTemplateAssetsRevision } from '@randee/blocks/server'

type RouteContext = {
  params: Promise<{ template: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { template } = await context.params
  const { revision, files } = getTemplateAssetsRevision(template)
  return Response.json({ template, revision, files })
}
