import type { BuilderPage } from '@randee/builder'
import { exportPageToHtmlWithAssets } from '@randee/blocks/server'

export async function POST(request: Request) {
  const page = (await request.json()) as BuilderPage
  const html = exportPageToHtmlWithAssets(page)

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}
