import type { ComponentElement } from '@randee/builder'
import { createCustomElementFromSource, listStoredCustomElements, toElementVariant } from '../../../../../lib/custom-elements-store'

export async function GET() {
  try {
    const items = await listStoredCustomElements()
    return Response.json({ ok: true, variants: items.map(toElementVariant) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list custom elements'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { source?: ComponentElement; name?: string }
    if (!body.source?.elementId || !body.source?.props) {
      return Response.json({ ok: false, error: 'source element is required' }, { status: 400 })
    }
    const saved = await createCustomElementFromSource(body.source, body.name)
    return Response.json({ ok: true, variant: toElementVariant(saved) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create custom element'
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

