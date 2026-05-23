import { getTemplateAssetMime, readTemplateAssetFile } from '@randee/blocks/server'

type RouteParams = {
  params: Promise<{ template: string; path: string[] }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { template, path } = await params
  const relativePath = path.join('/')
  const file = readTemplateAssetFile(template, relativePath)

  if (!file) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': getTemplateAssetMime(relativePath),
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
