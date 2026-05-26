import { listStoredPages } from '../../../../lib/pages-store'

export async function GET() {
  try {
    const pages = await listStoredPages()
    return Response.json({ ok: true, pages })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list pages'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}
