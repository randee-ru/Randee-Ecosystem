import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randeeDataRoot } from './monorepo-root'

export type OrganizerBlockType = 'paragraph' | 'heading' | 'todo' | 'quote' | 'bullet' | 'divider'

export type OrganizerTaskStatus = 'todo' | 'in_progress' | 'done'

export type OrganizerRecurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export type OrganizerWorkspaceView = 'pages' | 'calendar' | 'databases' | 'relations' | 'search' | 'content'

export type OrganizerAttachmentType = 'link' | 'image' | 'file'

export type OrganizerAttachment = {
  id: string
  type: OrganizerAttachmentType
  title: string
  url: string
  createdAt: string
}

export type OrganizerPageRevision = {
  id: string
  title: string
  content: string
  updatedAt: string
  note: string
}

export type OrganizerBlock = {
  id: string
  type: OrganizerBlockType
  text: string
  richText?: string
  checked?: boolean
  level?: number
}

export type OrganizerPage = {
  id: string
  title: string
  content: string
  blocks: OrganizerBlock[]
  parentId: string | null
  favorite: boolean
  archived: boolean
  isTemplate: boolean
  templateName: string | null
  tags: string[]
  relatedPageIds: string[]
  relatedTaskIds: string[]
  attachments: OrganizerAttachment[]
  history: OrganizerPageRevision[]
  createdAt: string
  updatedAt: string
}

export type OrganizerTask = {
  id: string
  title: string
  status: OrganizerTaskStatus
  done: boolean
  priority: 'low' | 'medium' | 'high'
  pageId: string | null
  dueDate: string | null
  startDate: string | null
  tags: string[]
  relatedPageIds: string[]
  relatedTaskIds: string[]
  recurrence: OrganizerRecurrence
  createdAt: string
  updatedAt: string
}

export type OrganizerDatabaseView = 'table' | 'list' | 'board' | 'calendar'

export type OrganizerDatabaseFieldType = 'title' | 'status' | 'date' | 'tags' | 'priority' | 'page' | 'relation'

export type OrganizerDatabaseField = {
  id: string
  key: string
  label: string
  type: OrganizerDatabaseFieldType
}

export type OrganizerDatabaseRecord = {
  id: string
  title: string
  status: OrganizerTaskStatus
  date: string | null
  tags: string[]
  priority: 'low' | 'medium' | 'high'
  pageId: string | null
  relatedRecordIds: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

export type OrganizerDatabase = {
  id: string
  name: string
  description: string
  view: OrganizerDatabaseView
  pageId: string | null
  fields: OrganizerDatabaseField[]
  records: OrganizerDatabaseRecord[]
  createdAt: string
  updatedAt: string
}

export type OrganizerState = {
  selectedPageId: string | null
  activeView: OrganizerWorkspaceView
  pages: OrganizerPage[]
  tasks: OrganizerTask[]
  databases: OrganizerDatabase[]
}

function organizerDir(): string {
  return join(randeeDataRoot(), 'organizer')
}

function organizerFilePath(projectId: string): string {
  return join(organizerDir(), `${projectId}.json`)
}

function createEmptyState(): OrganizerState {
  return {
    selectedPageId: null,
    activeView: 'pages',
    pages: [],
    tasks: [],
    databases: [],
  }
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function createId(prefix: string): string {
  const base = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  return `${prefix}_${base.replace(/-/g, '')}`
}

function normalizeLevel(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(4, Math.floor(value)))
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean)
}

function normalizeWorkspaceView(value: unknown): OrganizerWorkspaceView {
  return value === 'calendar' || value === 'databases' || value === 'relations' || value === 'search' || value === 'content'
    ? value
    : 'pages'
}

function normalizeTaskStatus(value: unknown): OrganizerTaskStatus {
  if (value === 'in_progress' || value === 'done') return value
  return 'todo'
}

function normalizeRecurrence(value: unknown): OrganizerRecurrence {
  if (value === 'daily' || value === 'weekly' || value === 'monthly') return value
  return 'none'
}

function normalizeDateString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function createEmptyAttachment(type: OrganizerAttachmentType = 'link'): OrganizerAttachment {
  return {
    id: createId('attachment'),
    type,
    title: '',
    url: '',
    createdAt: new Date().toISOString(),
  }
}

function createEmptyBlock(type: OrganizerBlockType = 'paragraph', level = 0): OrganizerBlock {
  return {
    id: createId('block'),
    type,
    text: '',
    level,
  }
}

function normalizeBlock(block: unknown): OrganizerBlock | null {
  if (!block || typeof block !== 'object') return null
  const candidate = block as Partial<OrganizerBlock>
  const id = asString(candidate.id)
  const text = asString(candidate.text)
  if (!id || text === null) return null

  const type: OrganizerBlockType =
    candidate.type === 'heading' ||
    candidate.type === 'todo' ||
    candidate.type === 'quote' ||
    candidate.type === 'bullet' ||
    candidate.type === 'divider'
      ? candidate.type
      : 'paragraph'

  return {
    id,
    type,
    text: type === 'divider' ? '' : text,
    richText: asString(candidate.richText) ?? undefined,
    checked: type === 'todo' ? Boolean(candidate.checked) : undefined,
    level: normalizeLevel(candidate.level),
  }
}

function normalizeAttachment(value: unknown): OrganizerAttachment | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<OrganizerAttachment>
  const id = asString(candidate.id)
  const type = candidate.type === 'image' || candidate.type === 'file' ? candidate.type : 'link'
  const title = asString(candidate.title)
  const url = asString(candidate.url)
  const createdAt = asString(candidate.createdAt)
  if (!id || title === null || url === null || !createdAt) return null
  return {
    id,
    type,
    title: title.trim(),
    url: url.trim(),
    createdAt,
  }
}

function normalizePageRevision(value: unknown): OrganizerPageRevision | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<OrganizerPageRevision>
  const id = asString(candidate.id)
  const title = asString(candidate.title)
  const content = asString(candidate.content)
  const updatedAt = asString(candidate.updatedAt)
  const note = asString(candidate.note)
  if (!id || title === null || content === null || !updatedAt || note === null) return null
  return {
    id,
    title: title.trim(),
    content,
    updatedAt,
    note: note.trim(),
  }
}

function splitLegacyContent(content: string): OrganizerBlock[] {
  const trimmed = content.trim()
  if (!trimmed) return [createEmptyBlock('paragraph')]

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  return (paragraphs.length > 0 ? paragraphs : [trimmed]).map((text) => ({
    id: createId('block'),
    type: 'paragraph' as const,
    text,
    level: 0,
  }))
}

function serializeBlocks(blocks: OrganizerBlock[]): string {
  return blocks
    .map((block) => {
      const indent = '  '.repeat(normalizeLevel(block.level))
      if (block.type === 'divider') return ''
      if (block.type === 'todo') return `${indent}${block.checked ? '[x]' : '[ ]'} ${block.text}`.trimEnd()
      if (block.type === 'heading') return `${indent}# ${block.text}`.trimEnd()
      if (block.type === 'quote') return `${indent}> ${block.text}`.trimEnd()
      if (block.type === 'bullet') return `${indent}• ${block.text}`.trimEnd()
      return `${indent}${block.text}`.trimEnd()
    })
    .filter((line) => line.trim().length > 0)
    .join('\n')
}

function normalizePage(page: unknown): OrganizerPage | null {
  if (!page || typeof page !== 'object') return null
  const candidate = page as Partial<OrganizerPage> & { blocks?: unknown }
  const id = asString(candidate.id)
  const title = asString(candidate.title)
  const content = asString(candidate.content)
  const parentId = candidate.parentId === null ? null : asString(candidate.parentId)
  const createdAt = asString(candidate.createdAt)
  const updatedAt = asString(candidate.updatedAt)
  if (!id || !title || content === null || !createdAt || !updatedAt) return null

  const rawBlocks = Array.isArray(candidate.blocks) ? candidate.blocks : []
  const blocks = rawBlocks
    .map(normalizeBlock)
    .filter((block): block is OrganizerBlock => Boolean(block))

  const normalizedBlocks = blocks.length > 0 ? blocks : splitLegacyContent(content)

  return {
    id,
    title: title.trim() || 'Untitled',
    content: serializeBlocks(normalizedBlocks),
    blocks: normalizedBlocks.map((block) => ({
      ...block,
      level: normalizeLevel(block.level),
    })),
    parentId,
    favorite: Boolean(candidate.favorite),
    archived: Boolean(candidate.archived),
    isTemplate: Boolean(candidate.isTemplate),
    templateName: asString(candidate.templateName),
    tags: normalizeStringArray(candidate.tags),
    relatedPageIds: normalizeStringArray(candidate.relatedPageIds),
    relatedTaskIds: normalizeStringArray(candidate.relatedTaskIds),
    attachments: Array.isArray(candidate.attachments)
      ? candidate.attachments.map(normalizeAttachment).filter((item): item is OrganizerAttachment => Boolean(item))
      : [],
    history: Array.isArray(candidate.history)
      ? candidate.history.map(normalizePageRevision).filter((item): item is OrganizerPageRevision => Boolean(item))
      : [],
    createdAt,
    updatedAt,
  }
}

function normalizeTask(task: unknown): OrganizerTask | null {
  if (!task || typeof task !== 'object') return null
  const candidate = task as Partial<OrganizerTask>
  const id = asString(candidate.id)
  const title = asString(candidate.title)
  const createdAt = asString(candidate.createdAt)
  const updatedAt = asString(candidate.updatedAt)
  if (!id || !title || !createdAt || !updatedAt) return null

  const priority = candidate.priority === 'high' || candidate.priority === 'low' ? candidate.priority : 'medium'
  const status = normalizeTaskStatus(candidate.status ?? (candidate.done ? 'done' : 'todo'))

  return {
    id,
    title: title.trim() || 'Untitled',
    status,
    done: status === 'done',
    priority,
    pageId: candidate.pageId === null ? null : asString(candidate.pageId),
    dueDate: normalizeDateString(candidate.dueDate),
    startDate: normalizeDateString(candidate.startDate),
    tags: normalizeStringArray(candidate.tags),
    relatedPageIds: normalizeStringArray(candidate.relatedPageIds),
    relatedTaskIds: normalizeStringArray(candidate.relatedTaskIds),
    recurrence: normalizeRecurrence(candidate.recurrence),
    createdAt,
    updatedAt,
  }
}

function normalizeDatabaseField(value: unknown): OrganizerDatabaseField | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<OrganizerDatabaseField>
  const id = asString(candidate.id)
  const key = asString(candidate.key)
  const label = asString(candidate.label)
  const type = candidate.type
  if (!id || !key || !label) return null
  if (type !== 'title' && type !== 'status' && type !== 'date' && type !== 'tags' && type !== 'priority' && type !== 'page' && type !== 'relation') {
    return null
  }

  return {
    id,
    key: key.trim(),
    label: label.trim(),
    type,
  }
}

function normalizeDatabaseRecord(value: unknown): OrganizerDatabaseRecord | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<OrganizerDatabaseRecord>
  const id = asString(candidate.id)
  const title = asString(candidate.title)
  const createdAt = asString(candidate.createdAt)
  const updatedAt = asString(candidate.updatedAt)
  if (!id || !title || !createdAt || !updatedAt) return null

  const priority = candidate.priority === 'high' || candidate.priority === 'low' ? candidate.priority : 'medium'
  const status = normalizeTaskStatus(candidate.status)

  return {
    id,
    title: title.trim() || 'Untitled',
    status,
    date: normalizeDateString(candidate.date),
    tags: normalizeStringArray(candidate.tags),
    priority,
    pageId: candidate.pageId === null ? null : asString(candidate.pageId),
    relatedRecordIds: normalizeStringArray(candidate.relatedRecordIds),
    notes: asString(candidate.notes)?.trim() ?? '',
    createdAt,
    updatedAt,
  }
}

function normalizeDatabase(value: unknown): OrganizerDatabase | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<OrganizerDatabase>
  const id = asString(candidate.id)
  const name = asString(candidate.name)
  const description = asString(candidate.description)
  const createdAt = asString(candidate.createdAt)
  const updatedAt = asString(candidate.updatedAt)
  if (!id || !name || description === null || !createdAt || !updatedAt) return null

  const view = candidate.view === 'list' || candidate.view === 'board' || candidate.view === 'calendar' ? candidate.view : 'table'

  return {
    id,
    name: name.trim() || 'Database',
    description: description.trim(),
    view,
    pageId: candidate.pageId === null ? null : asString(candidate.pageId),
    fields: Array.isArray(candidate.fields)
      ? candidate.fields.map(normalizeDatabaseField).filter((field): field is OrganizerDatabaseField => Boolean(field))
      : [],
    records: Array.isArray(candidate.records)
      ? candidate.records.map(normalizeDatabaseRecord).filter((record): record is OrganizerDatabaseRecord => Boolean(record))
      : [],
    createdAt,
    updatedAt,
  }
}

function sanitizeState(input: unknown): OrganizerState {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return createEmptyState()

  const candidate = input as Partial<OrganizerState>
  const pages = Array.isArray(candidate.pages)
    ? candidate.pages.map(normalizePage).filter((page): page is OrganizerPage => Boolean(page))
    : []
  const pageIds = new Set(pages.map((page) => page.id))
  const tasks = Array.isArray(candidate.tasks)
    ? candidate.tasks.map(normalizeTask).filter((task): task is OrganizerTask => Boolean(task))
    : []

  const normalizedPages = pages.map((page) => ({
    ...page,
    parentId: page.parentId && pageIds.has(page.parentId) && page.parentId !== page.id ? page.parentId : null,
    blocks: page.blocks.length > 0
      ? page.blocks.map((block) => ({
        ...block,
        level: normalizeLevel(block.level),
      }))
      : [createEmptyBlock('paragraph')],
  }))
  const normalizedPageIds = new Set(normalizedPages.map((page) => page.id))

  const normalizedTasks = tasks.map((task) => ({
    ...task,
    pageId: task.pageId && normalizedPageIds.has(task.pageId) ? task.pageId : null,
    relatedPageIds: task.relatedPageIds.filter((id) => normalizedPageIds.has(id)),
    relatedTaskIds: task.relatedTaskIds,
  }))

  const rawDatabases = Array.isArray((candidate as { databases?: unknown }).databases)
    ? ((candidate as { databases?: unknown }).databases as unknown[])
    : []
  const databases = rawDatabases
    .map(normalizeDatabase)
    .filter((database): database is OrganizerDatabase => Boolean(database))
  const recordIds = new Set(databases.flatMap((database) => database.records.map((record) => record.id)))

  const defaultDatabaseFields: OrganizerDatabaseField[] = [
    { id: createId('field'), key: 'title', label: 'Название', type: 'title' },
    { id: createId('field'), key: 'status', label: 'Статус', type: 'status' },
    { id: createId('field'), key: 'date', label: 'Дата', type: 'date' },
    { id: createId('field'), key: 'tags', label: 'Теги', type: 'tags' },
    { id: createId('field'), key: 'priority', label: 'Приоритет', type: 'priority' },
    { id: createId('field'), key: 'page', label: 'Страница', type: 'page' },
  ]

  const normalizedDatabases: OrganizerDatabase[] = databases.map((database) => ({
    ...database,
    pageId: database.pageId && normalizedPageIds.has(database.pageId) ? database.pageId : null,
    fields: database.fields.length > 0
      ? database.fields
      : defaultDatabaseFields,
    records: database.records.map((record) => ({
      ...record,
      pageId: record.pageId && normalizedPageIds.has(record.pageId) ? record.pageId : null,
      relatedRecordIds: record.relatedRecordIds.filter((id) => recordIds.has(id)),
    })),
  }))

  const selectedPageId = asString(candidate.selectedPageId)
  const finalSelectedPageId = selectedPageId && normalizedPageIds.has(selectedPageId)
    ? selectedPageId
    : normalizedPages[0]?.id ?? null

  const activeView = normalizeWorkspaceView((candidate as Partial<{ activeView: unknown }>).activeView)

  return {
    selectedPageId: finalSelectedPageId,
    activeView,
    pages: normalizedPages.map((page) => ({
      ...page,
      content: serializeBlocks(page.blocks),
    })),
    tasks: normalizedTasks,
    databases: normalizedDatabases,
  }
}

export async function readOrganizerState(projectId: string): Promise<OrganizerState> {
  try {
    const raw = await readFile(organizerFilePath(projectId), 'utf8')
    return sanitizeState(JSON.parse(raw) as unknown)
  } catch {
    return createEmptyState()
  }
}

export async function writeOrganizerState(projectId: string, state: OrganizerState): Promise<void> {
  await mkdir(organizerDir(), { recursive: true })
  const clean = sanitizeState(state)
  await writeFile(organizerFilePath(projectId), `${JSON.stringify(clean, null, 2)}\n`, 'utf8')
}
