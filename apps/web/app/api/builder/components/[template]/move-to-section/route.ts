import { moveComponentToSection } from '@randee/blocks/server'

type RouteParams = { params: Promise<{ template: string }> }

/** POST /api/builder/components/[template]/move-to-section
 *  Body: { section: string }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { template } = await params
  try {
    const body = (await request.json()) as { section?: string }
    if (!body.section?.trim()) {
      return Response.json({ error: 'section is required' }, { status: 400 })
    }
    const result = moveComponentToSection(template, body.section.trim())
    if (!result) {
      return Response.json({ error: 'Component not found' }, { status: 404 })
    }
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move component'
    return Response.json({ error: message }, { status: 500 })
  }
}
