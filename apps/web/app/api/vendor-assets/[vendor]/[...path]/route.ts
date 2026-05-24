import { getTemplateAssetMime } from '@randee/blocks/template-assets'
import { readVendorAssetFile } from '@randee/blocks/server'
import { isVendorId } from '@randee/blocks'

type RouteParams = {
  params: Promise<{ vendor: string; path: string[] }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { vendor, path } = await params
  if (!isVendorId(vendor)) {
    return new Response('Not found', { status: 404 })
  }

  const basename = path.join('/')
  const file = readVendorAssetFile(vendor, basename)

  if (!file) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type': getTemplateAssetMime(basename),
      'Cache-Control': 'public, max-age=86400'
    }
  })
}
