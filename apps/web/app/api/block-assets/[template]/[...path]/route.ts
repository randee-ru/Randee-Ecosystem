import { getTemplateAssetMime, readTemplateAssetFile, writeTemplateAssetText } from '@randee/blocks/template-assets'

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

  const cacheControl =
    process.env.NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-store'

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': getTemplateAssetMime(relativePath),
      'Cache-Control': cacheControl
    }
  })
}

const EDITABLE_ASSET_EXTENSIONS = ['.js', '.css', '.ts', '.tsx', '.svg'] as const

function isEditableAssetPath(relativePath: string): boolean {
  const lower = relativePath.toLowerCase()
  return EDITABLE_ASSET_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { template, path } = await params
  const relativePath = path.join('/')

  if (!isEditableAssetPath(relativePath)) {
    return new Response('Asset type is not editable', { status: 400 })
  }

  const content = await request.text()
  const saved = writeTemplateAssetText(template, relativePath, content)

  if (!saved) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
