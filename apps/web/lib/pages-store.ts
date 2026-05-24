import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
