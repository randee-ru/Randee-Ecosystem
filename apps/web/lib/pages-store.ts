import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randeeDataRoot } from './monorepo-root'

function normalizeSlug(slug: string): string {
  const trimmed = slug.trim().replace(/^\//, '')
  return trimmed.replace(/[^\w/-]+/g, '-') || 'home'
}

function pageFilePath(slug: string): string {
  return join(randeeDataRoot(), 'pages', `${normalizeSlug(slug)}.json`)
}

export async function readStoredPage(slug: string): Promise<unknown | null> {
  try {
    const raw = await readFile(pageFilePath(slug), 'utf8')
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export async function writeStoredPage(slug: string, page: unknown): Promise<void> {
  const pagesDir = join(randeeDataRoot(), 'pages')
  await mkdir(pagesDir, { recursive: true })
  await writeFile(pageFilePath(slug), `${JSON.stringify(page, null, 2)}\n`, 'utf8')
}

export async function listStoredPages(): Promise<Array<{ slug: string; page: string }>> {
  const pagesDir = join(randeeDataRoot(), 'pages')
  await mkdir(pagesDir, { recursive: true })
  const files = await readdir(pagesDir)
  const result: Array<{ slug: string; page: string }> = []

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const slug = file.replace(/\.json$/, '')
    try {
      const raw = await readFile(join(pagesDir, file), 'utf8')
      const payload = JSON.parse(raw) as { page?: string }
      result.push({ slug: `/${slug === 'home' ? '' : slug}`.replace(/\/$/, '') || '/', page: payload.page ?? slug })
    } catch {
      result.push({ slug: `/${slug === 'home' ? '' : slug}`.replace(/\/$/, '') || '/', page: slug })
    }
  }

  result.sort((a, b) => {
    if (a.slug === '/') return -1
    if (b.slug === '/') return 1
    return a.slug.localeCompare(b.slug, 'ru')
  })

  return result
}

export async function deleteStoredPage(slug: string): Promise<void> {
  const pagesDir = join(randeeDataRoot(), 'pages')
  await mkdir(pagesDir, { recursive: true })
  await unlink(pageFilePath(slug))
}
