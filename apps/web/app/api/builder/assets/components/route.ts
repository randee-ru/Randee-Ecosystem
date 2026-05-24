import { listSavedComponentsFromDisk } from '@randee/blocks/server'

export async function GET() {
  const templates = listSavedComponentsFromDisk()
  return Response.json(templates)
}
