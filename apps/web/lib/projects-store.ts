import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { db } from './db'
import { randeeDataRoot } from './monorepo-root'

export type ProjectType = 'site' | 'design'

export type Project = {
  id: string
  slug: string
  name: string
  url?: string | null
  type: ProjectType
  userId?: string | null
  createdAt: string
  updatedAt: string
}

function toSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9а-яё-]/gi, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'project'
  )
}

function toProject(row: {
  id: string
  slug: string
  name: string
  url: string | null
  type: string
  userId: string | null
  createdAt: Date
  updatedAt: Date
}): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    url: row.url ?? undefined,
    type: (row.type === 'design' ? 'design' : 'site') as ProjectType,
    userId: row.userId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listProjects(userId?: string): Promise<Project[]> {
  const rows = await db.project.findMany({
    where: userId
      ? { OR: [{ userId }, { userId: null }] }
      : undefined,
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(toProject)
}

export async function createProject(data: {
  name: string
  url?: string
  type?: ProjectType
  userId?: string
}): Promise<Project> {
  const existing = await db.project.findMany({ select: { slug: true } })
  const usedSlugs = new Set(existing.map((p) => p.slug))

  const base = toSlug(data.name)
  let finalSlug = base
  let counter = 2
  while (usedSlugs.has(finalSlug)) {
    finalSlug = `${base}-${counter++}`
  }

  const row = await db.project.create({
    data: {
      slug: finalSlug,
      name: data.name,
      url: data.url ?? null,
      type: data.type ?? 'site',
      userId: data.userId ?? null,
    },
  })
  return toProject(row)
}

export async function getProject(id: string): Promise<Project | null> {
  const row = await db.project.findUnique({ where: { id } })
  return row ? toProject(row) : null
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const row = await db.project.findUnique({ where: { slug } })
  return row ? toProject(row) : null
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, 'name' | 'url'>>,
): Promise<Project | null> {
  try {
    const row = await db.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.url !== undefined ? { url: data.url ?? null } : {}),
      },
    })
    return toProject(row)
  } catch {
    return null
  }
}

export async function deleteProject(id: string): Promise<void> {
  await db.project.delete({ where: { id } }).catch(() => null)

  const map = await readPageProjectMap()
  const cleaned = Object.fromEntries(Object.entries(map).filter(([, pid]) => pid !== id))
  await savePageProjectMap(cleaned)
}

// ── Привязка страниц к проектам (остаётся в JSON) ─────────────────────────────

const pageProjectsFilePath = () => join(randeeDataRoot(), 'page-projects.json')
const legacyProjectsFilePath = () => join(randeeDataRoot(), 'projects.json')

type LegacyProjectRecord = { id: string; slug: string }

async function readLegacyProjects(): Promise<LegacyProjectRecord[]> {
  try {
    const raw = await readFile(legacyProjectsFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const candidate = entry as Partial<LegacyProjectRecord>
      if (typeof candidate.id !== 'string' || typeof candidate.slug !== 'string') return []
      return [{ id: candidate.id, slug: candidate.slug }]
    })
  } catch {
    return []
  }
}

async function readRawPageProjectMap(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(pageProjectsFilePath(), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).flatMap(([key, value]) => {
        if (typeof value !== 'string') return []
        return [[key, value] as const]
      }),
    )
  } catch {
    return {}
  }
}

async function savePageProjectMap(map: Record<string, string>): Promise<void> {
  await mkdir(randeeDataRoot(), { recursive: true })
  await writeFile(pageProjectsFilePath(), `${JSON.stringify(map, null, 2)}\n`, 'utf8')
}

async function buildProjectIdAliases(): Promise<Record<string, string>> {
  const [projects, legacyProjects] = await Promise.all([
    db.project.findMany({ select: { id: true, slug: true } }),
    readLegacyProjects(),
  ])

  const aliases: Record<string, string> = {}
  const currentBySlug = new Map(projects.map((project) => [project.slug, project.id]))

  for (const project of projects) {
    aliases[project.id] = project.id
  }

  for (const project of legacyProjects) {
    const currentId = currentBySlug.get(project.slug)
    if (currentId) {
      aliases[project.id] = currentId
    }
  }

  return aliases
}

async function resolveProjectId(projectId: string): Promise<string> {
  const aliases = await buildProjectIdAliases()
  return aliases[projectId] ?? projectId
}

export async function readPageProjectMap(): Promise<Record<string, string>> {
  const rawMap = await readRawPageProjectMap()
  const aliases = await buildProjectIdAliases()
  let changed = false
  const normalized = Object.fromEntries(
    Object.entries(rawMap).map(([pageSlug, projectId]) => {
      const resolvedProjectId = aliases[projectId] ?? projectId
      if (resolvedProjectId !== projectId) changed = true
      return [pageSlug, resolvedProjectId]
    }),
  )

  if (changed) {
    await savePageProjectMap(normalized)
  }

  return normalized
}

export async function assignPageToProject(pageSlug: string, projectId: string): Promise<void> {
  const map = await readRawPageProjectMap()
  map[pageSlug] = await resolveProjectId(projectId)
  await savePageProjectMap(map)
}

export async function unassignPageFromProject(pageSlug: string): Promise<void> {
  const map = await readRawPageProjectMap()
  delete map[pageSlug]
  await savePageProjectMap(map)
}

export async function getPageProjectId(pageSlug: string): Promise<string | null> {
  const map = await readPageProjectMap()
  return map[pageSlug] ?? null
}
