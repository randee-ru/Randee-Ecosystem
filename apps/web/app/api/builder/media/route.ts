import { existsSync, readdirSync, statSync, unlinkSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
import { randomBytes } from 'node:crypto'
import { NextRequest } from 'next/server'

const MEDIA_DIR = join(process.cwd(), 'public', 'builder-media')

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'])
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.ogg', '.mov'])
const ICON_EXTS  = new Set(['.svg', '.ico'])

function ensureDir() {
  if (!existsSync(MEDIA_DIR)) mkdirSync(MEDIA_DIR, { recursive: true })
}

function mediaType(ext: string): 'image' | 'video' | 'icon' | 'other' {
  if (VIDEO_EXTS.has(ext)) return 'video'
  if (ICON_EXTS.has(ext) && ext === '.svg') return 'icon'
  if (IMAGE_EXTS.has(ext)) return 'image'
  return 'other'
}

export type MediaFile = {
  name: string
  url: string
  type: 'image' | 'video' | 'icon' | 'other'
  size: number
  createdAt: number
}

export async function GET() {
  ensureDir()
  const entries = readdirSync(MEDIA_DIR)
  const files: MediaFile[] = []
  for (const name of entries) {
    const fullPath = join(MEDIA_DIR, name)
    const stat = statSync(fullPath)
    if (!stat.isFile()) continue
    const ext = extname(name).toLowerCase()
    files.push({
      name,
      url: `/builder-media/${name}`,
      type: mediaType(ext),
      size: stat.size,
      createdAt: stat.birthtimeMs
    })
  }
  files.sort((a, b) => b.createdAt - a.createdAt)
  return Response.json({ files })
}

export async function POST(req: NextRequest) {
  ensureDir()
  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = extname(file.name).toLowerCase()
  const allowed = new Set([...IMAGE_EXTS, ...VIDEO_EXTS])
  if (!allowed.has(ext)) {
    return Response.json({ error: `Unsupported file type: ${ext}` }, { status: 400 })
  }

  const uid = randomBytes(6).toString('hex')
  const safeName = basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')
  const finalName = `${uid}_${safeName}`
  const filePath = join(MEDIA_DIR, finalName)

  const buffer = Buffer.from(await file.arrayBuffer())
  writeFileSync(filePath, buffer)

  const result: MediaFile = {
    name: finalName,
    url: `/builder-media/${finalName}`,
    type: mediaType(ext),
    size: buffer.length,
    createdAt: Date.now()
  }
  return Response.json({ file: result })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  if (!name || name.includes('/') || name.includes('..')) {
    return Response.json({ error: 'Invalid filename' }, { status: 400 })
  }
  const filePath = join(MEDIA_DIR, name)
  if (!existsSync(filePath)) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }
  unlinkSync(filePath)
  return Response.json({ ok: true })
}
