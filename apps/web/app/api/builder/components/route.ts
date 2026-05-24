import { listComponentTemplatesFromDisk } from '@randee/blocks/server'

export async function GET() {
  const templates = listComponentTemplatesFromDisk()
  return Response.json(templates)
}
