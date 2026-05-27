import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randeeDataRoot } from './monorepo-root'

// ── Типы ──────────────────────────────────────────────────────────────────────

export type Project = {
  id: string
  slug: string
  name: string
  /** URL / домен сайта (необязательно) */
  url?: string
  createdAt: string
  updatedAt: string
}

// ── Пути к файлам ─────────────────────────────────────────────────────────────

const projectsFilePath = () => join(randeeDataRoot(), 'projects.json')
const pageProjectsFilePath = () => join(randeeDataRoot(), 'page-projects.json')

// ── Вспомогательная функция: создать slug из названия ─────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'project'
}

// ── CRUD для проектов ─────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  try {
    const raw = await readFile(projectsFilePath(), 'utf8')
    return JSON.parse(raw) as Project[]
  } catch {
    return []
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  await mkdir(randeeDataRoot(), { recursive: true })
  await writeFile(projectsFilePath(), `${JSON.stringify(projects, null, 2)}\n`, 'utf8')
}

export async function createProject(data: { name: string; url?: string }): Promise<Project> {
  const projects = await listProjects()

  const base = toSlug(data.name)
  let finalSlug = base
  let counter = 2
  while (projects.some((p) => p.slug === finalSlug)) {
    finalSlug = `${base}-${counter++}`
  }

  const now = new Date().toISOString()
  const project: Project = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    slug: finalSlug,
    name: data.name,
    url: data.url,
    createdAt: now,
    updatedAt: now,
  }

  await saveProjects([...projects, project])
  return project
}

export async function getProject(id: string): Promise<Project | null> {
  const projects = await listProjects()
  return projects.find((p) => p.id === id) ?? null
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await listProjects()
  return projects.find((p) => p.slug === slug) ?? null
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, 'name' | 'url'>>,
): Promise<Project | null> {
  const projects = await listProjects()
  const idx = projects.findIndex((p) => p.id === id)
  if (idx === -1) return null

  const updated: Project = {
    ...projects[idx]!,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  projects[idx] = updated
  await saveProjects(projects)
  return updated
}

export async function deleteProject(id: string): Promise<void> {
  const projects = await listProjects()
  await saveProjects(projects.filter((p) => p.id !== id))

  // Убираем привязки страниц к удалённому проекту
  const map = await readPageProjectMap()
  const cleaned = Object.fromEntries(Object.entries(map).filter(([, pid]) => pid !== id))
  await savePageProjectMap(cleaned)
}

// ── Привязка страниц к проектам ───────────────────────────────────────────────
// Хранится в .randee/page-projects.json как { "pageSlug": "projectId", ... }
// pageSlug — нормализованный ключ без ведущего '/' (напр. "home", "about")

export async function readPageProjectMap(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(pageProjectsFilePath(), 'utf8')
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

async function savePageProjectMap(map: Record<string, string>): Promise<void> {
  await mkdir(randeeDataRoot(), { recursive: true })
  await writeFile(pageProjectsFilePath(), `${JSON.stringify(map, null, 2)}\n`, 'utf8')
}

export async function assignPageToProject(pageSlug: string, projectId: string): Promise<void> {
  const map = await readPageProjectMap()
  map[pageSlug] = projectId
  await savePageProjectMap(map)
}

export async function unassignPageFromProject(pageSlug: string): Promise<void> {
  const map = await readPageProjectMap()
  delete map[pageSlug]
  await savePageProjectMap(map)
}

/** Возвращает projectId для данного slug страницы, или null если не привязана */
export async function getPageProjectId(pageSlug: string): Promise<string | null> {
  const map = await readPageProjectMap()
  return map[pageSlug] ?? null
}
