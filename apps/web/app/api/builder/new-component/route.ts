import { createComponentTemplate } from '@randee/blocks/server'

export async function POST() {
  try {
    const created = createComponentTemplate()
    return Response.json(created)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create component'
    return Response.json({ error: message }, { status: 500 })
  }
}
