'use client'

import * as React from 'react'
import { useDialog } from '@/components/dialog'
import { OrganizerRichTextEditor } from './organizer-rich-text-editor'
import type {
  OrganizerAttachment,
  OrganizerBlock,
  OrganizerBlockType,
  OrganizerDatabase,
  OrganizerDatabaseRecord,
  OrganizerDatabaseView,
  OrganizerPage,
  OrganizerState,
  OrganizerTask,
  OrganizerTaskStatus,
  OrganizerWorkspaceView,
} from '@/lib/organizer-store'
import { Archive, Check, Circle, FileText, GripVertical, Link2, Plus, Search, Star, Trash2 } from 'lucide-react'

type OrganizerPanelProps = {
  projectSlug: string
}

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

function createId(prefix: string): string {
  const base = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  return `${prefix}_${base.replace(/-/g, '')}`
}

function now(): string {
  return new Date().toISOString()
}

function dateOnly(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDateInput(value: string): string | null {
  if (!value) return null
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildPageIndex(pages: OrganizerPage[]): Map<string, OrganizerPage> {
  return new Map(pages.map((page) => [page.id, page]))
}

function collectDescendants(pages: OrganizerPage[], pageId: string): Set<string> {
  const childrenByParent = new Map<string | null, string[]>()
  for (const page of pages) {
    const key = page.parentId ?? null
    const list = childrenByParent.get(key) ?? []
    list.push(page.id)
    childrenByParent.set(key, list)
  }

  const result = new Set<string>()
  const stack = [...(childrenByParent.get(pageId) ?? [])]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (result.has(current)) continue
    result.add(current)
    stack.push(...(childrenByParent.get(current) ?? []))
  }
  return result
}

function pagePriorityLabel(priority: OrganizerTask['priority']): string {
  if (priority === 'high') return 'Высокий'
  if (priority === 'low') return 'Низкий'
  return 'Средний'
}

function pagePriorityColor(priority: OrganizerTask['priority']): string {
  if (priority === 'high') return '#ef4444'
  if (priority === 'low') return '#888'
  return '#0099FF'
}

function taskStatusLabel(status: OrganizerTaskStatus): string {
  if (status === 'in_progress') return 'В работе'
  if (status === 'done') return 'Готово'
  return 'Нужно сделать'
}

function taskStatusColor(status: OrganizerTaskStatus): string {
  if (status === 'in_progress') return '#f59e0b'
  if (status === 'done') return '#34d399'
  return '#7cc0ff'
}

function viewLabel(view: OrganizerWorkspaceView): string {
  if (view === 'calendar') return 'Календарь'
  if (view === 'databases') return 'Базы'
  if (view === 'relations') return 'Связи'
  if (view === 'search') return 'Поиск'
  if (view === 'content') return 'Контент'
  return 'Страницы'
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit', month: 'short' })
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function addMonths(date: Date, months: number): Date {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

function startOfMonth(date: Date): Date {
  const copy = new Date(date)
  copy.setDate(1)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfMonth(date: Date): Date {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + 1, 0)
  copy.setHours(23, 59, 59, 999)
  return copy
}

function normalizeCalendarDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date()
  date.setHours(12, 0, 0, 0)
  return date
}

function expandTaskOccurrences(tasks: OrganizerTask[], rangeStart: Date, rangeEnd: Date): Map<string, Array<{ task: OrganizerTask; recurring: boolean }>> {
  const map = new Map<string, Array<{ task: OrganizerTask; recurring: boolean }>>()
  const start = new Date(rangeStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(rangeEnd)
  end.setHours(23, 59, 59, 999)

  const append = (date: Date, task: OrganizerTask, recurring: boolean) => {
    const key = dateKey(date)
    const list = map.get(key) ?? []
    list.push({ task, recurring })
    map.set(key, list)
  }

  for (const task of tasks) {
    const source = task.startDate ?? task.dueDate
    if (!source) continue

    const base = normalizeCalendarDate(source)
    if (task.recurrence === 'none') {
      if (base >= start && base <= end) append(base, task, false)
      continue
    }

    const cursor = new Date(base)
    while (cursor <= end) {
      if (cursor >= start) {
        append(cursor, task, true)
      }

      if (task.recurrence === 'daily') {
        cursor.setDate(cursor.getDate() + 1)
      } else if (task.recurrence === 'weekly') {
        cursor.setDate(cursor.getDate() + 7)
      } else {
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }
  }

  return map
}

const MAX_BLOCK_LEVEL = 4

function clampBlockLevel(level: number): number {
  if (!Number.isFinite(level)) return 0
  return Math.max(0, Math.min(MAX_BLOCK_LEVEL, Math.floor(level)))
}

function isTextBlock(type: OrganizerBlockType): boolean {
  return type !== 'divider'
}

function defaultNextBlockType(type: OrganizerBlockType): OrganizerBlockType {
  if (type === 'heading') return 'paragraph'
  return type
}

function adjustTextareaHeight(node: HTMLTextAreaElement | null): void {
  if (!node) return
  node.style.height = '0px'
  node.style.height = `${Math.max(node.scrollHeight, 52)}px`
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

const BLOCK_OPTIONS: Array<{ type: OrganizerBlockType; label: string }> = [
  { type: 'paragraph', label: 'Текст' },
  { type: 'heading', label: 'Заголовок' },
  { type: 'todo', label: 'Задача' },
  { type: 'bullet', label: 'Список' },
  { type: 'quote', label: 'Цитата' },
  { type: 'divider', label: 'Разделитель' },
]

function createBlock(type: OrganizerBlockType = 'paragraph', level = 0): OrganizerBlock {
  return {
    id: createId('block'),
    type,
    text: '',
    checked: type === 'todo' ? false : undefined,
    level: clampBlockLevel(level),
  }
}

function blocksToContent(blocks: OrganizerBlock[]): string {
  return blocks
    .map((block) => {
      const indent = '  '.repeat(clampBlockLevel(block.level ?? 0))
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

function pageSearchText(page: OrganizerPage): string {
  return [
    page.title,
    page.content,
    page.tags.join(' '),
    page.attachments.map((attachment) => `${attachment.title} ${attachment.url}`).join(' '),
    ...page.blocks.map((block) => block.text),
  ].join(' ').toLowerCase()
}

export function OrganizerPanel({ projectSlug }: OrganizerPanelProps) {
  const { prompt, confirm, Dialog } = useDialog()
  const [state, setState] = React.useState<OrganizerState | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [taskFilter, setTaskFilter] = React.useState<'all' | 'active' | 'done' | 'page'>('all')
  const [calendarView, setCalendarView] = React.useState<'month' | 'week' | 'day'>('month')
  const [calendarDate, setCalendarDate] = React.useState(() => new Date())
  const [databaseId, setDatabaseId] = React.useState<string | null>(null)
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null)
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>('idle')
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSaveRef = React.useRef(true)
  const blockRefs = React.useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null>>({})
  const [pendingFocusBlockId, setPendingFocusBlockId] = React.useState<string | null>(null)
  const [draggingBlockId, setDraggingBlockId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<{ blockId: string; position: 'before' | 'after' } | null>(null)
  const [slashMenuBlockId, setSlashMenuBlockId] = React.useState<string | null>(null)
  const [slashSearch, setSlashSearch] = React.useState('')
  const slashSearchRef = React.useRef<HTMLInputElement | null>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    void fetch(`/api/workspace/projects/${encodeURIComponent(projectSlug)}/organizer`)
      .then((response) => response.ok ? response.json() : null)
      .then((data: { ok: boolean; organizer?: OrganizerState } | null) => {
        skipSaveRef.current = true
        if (!data?.ok) {
          setState({ selectedPageId: null, activeView: 'pages', pages: [], tasks: [], databases: [] })
          setSyncStatus('error')
          return
        }
        setState(data.organizer ?? { selectedPageId: null, activeView: 'pages', pages: [], tasks: [], databases: [] })
        setSyncStatus('saved')
      })
      .catch(() => {
        skipSaveRef.current = true
        setState({ selectedPageId: null, activeView: 'pages', pages: [], tasks: [], databases: [] })
        setSyncStatus('error')
      })
      .finally(() => setLoading(false))
  }, [projectSlug])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    if (!state) return
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSyncStatus('saving')
    saveTimer.current = setTimeout(() => {
      void fetch(`/api/workspace/projects/${encodeURIComponent(projectSlug)}/organizer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizer: state }),
      })
        .then((response) => {
          if (!response.ok) throw new Error('save failed')
          setSyncStatus('saved')
        })
        .catch(() => setSyncStatus('error'))
    }, 300)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [projectSlug, state])

  const updateState = React.useCallback((updater: (current: OrganizerState) => OrganizerState) => {
    setState((current) => (current ? updater(current) : current))
  }, [])

  const updatePage = React.useCallback((pageId: string, updater: (page: OrganizerPage) => OrganizerPage) => {
    updateState((current) => ({
      ...current,
      pages: current.pages.map((page) => (page.id === pageId ? updater(page) : page)),
    }))
  }, [updateState])

  const updateDatabase = React.useCallback((databaseId: string, updater: (database: OrganizerDatabase) => OrganizerDatabase) => {
    updateState((current) => ({
      ...current,
      databases: current.databases.map((database) => (database.id === databaseId ? updater(database) : database)),
    }))
  }, [updateState])

  React.useEffect(() => {
    if (!pendingFocusBlockId) return
    const timer = setTimeout(() => {
      const node = blockRefs.current[pendingFocusBlockId]
      if (node) node.focus()
      setPendingFocusBlockId(null)
    }, 0)
    return () => clearTimeout(timer)
  }, [pendingFocusBlockId, state?.selectedPageId])

  React.useEffect(() => {
    if (!slashMenuBlockId) return
    const timer = setTimeout(() => slashSearchRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [slashMenuBlockId])

  const pageIndex = React.useMemo(() => buildPageIndex(state?.pages ?? []), [state?.pages])
  const activePageId = state?.selectedPageId ?? state?.pages[0]?.id ?? null
  const activePage = activePageId ? pageIndex.get(activePageId) ?? null : null

  React.useLayoutEffect(() => {
    if (!activePage) return
    for (const block of activePage.blocks) {
      const node = blockRefs.current[block.id]
      if (node instanceof HTMLTextAreaElement) adjustTextareaHeight(node)
    }
  }, [activePage?.blocks])

  const visiblePages = React.useMemo(() => {
    const pages = state?.pages ?? []
    const q = search.trim().toLowerCase()
    if (!q) return pages

    const visible = new Set<string>()
    for (const page of pages) {
      const matches = pageSearchText(page).includes(q)
      if (!matches) continue
      visible.add(page.id)

      let parentId = page.parentId
      while (parentId) {
        visible.add(parentId)
        parentId = pageIndex.get(parentId)?.parentId ?? null
      }
    }
    return pages.filter((page) => visible.has(page.id))
  }, [pageIndex, search, state?.pages])

  const pageCount = state?.pages.length ?? 0
  const taskCount = state?.tasks.length ?? 0
  const openTaskCount = state?.tasks.filter((task) => !task.done).length ?? 0
  const pageChildren = React.useMemo(() => {
    if (!activePage) return []
    return (state?.pages ?? []).filter((page) => page.parentId === activePage.id)
  }, [activePage, state?.pages])

  const setActiveView = React.useCallback((view: OrganizerWorkspaceView) => {
    updateState((current) => ({
      ...current,
      activeView: view,
    }))
  }, [updateState])

  React.useEffect(() => {
    if (state?.databases.length && !databaseId) {
      setDatabaseId(state.databases[0]?.id ?? null)
    }
  }, [databaseId, state?.databases])

  const tasksByDate = React.useMemo(() => {
    const rangeStart = calendarView === 'month'
      ? startOfWeek(startOfMonth(calendarDate))
      : calendarView === 'week'
        ? startOfWeek(calendarDate)
        : calendarDate
    const rangeEnd = calendarView === 'month'
      ? addDays(startOfWeek(endOfMonth(calendarDate)), 41)
      : calendarView === 'week'
        ? addDays(rangeStart, 6)
        : rangeStart
    return expandTaskOccurrences(state?.tasks ?? [], rangeStart, rangeEnd)
  }, [calendarDate, calendarView, state?.tasks])

  const recordsByDate = React.useMemo(() => {
    const map = new Map<string, OrganizerDatabaseRecord[]>()
    for (const database of state?.databases ?? []) {
      for (const record of database.records) {
        if (!record.date) continue
        const key = dateKey(normalizeCalendarDate(record.date))
        const list = map.get(key) ?? []
        list.push(record)
        map.set(key, list)
      }
    }
    return map
  }, [state?.databases])

  const breadcrumb = React.useMemo(() => {
    if (!activePage) return []
    const chain: OrganizerPage[] = []
    let current: OrganizerPage | undefined = activePage
    while (current) {
      chain.unshift(current)
      current = current.parentId ? pageIndex.get(current.parentId) : undefined
    }
    return chain
  }, [activePage, pageIndex])

  const filteredTasks = React.useMemo(() => {
    const tasks = state?.tasks ?? []
    return tasks
      .filter((task) => {
        if (taskFilter === 'active') return !task.done
        if (taskFilter === 'done') return task.done
        if (taskFilter === 'page') return Boolean(activePageId && task.pageId === activePageId)
        return true
      })
      .filter((task) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        const pageTitle = task.pageId ? pageIndex.get(task.pageId)?.title ?? '' : ''
        return `${task.title} ${pageTitle} ${task.tags.join(' ')}`.toLowerCase().includes(q)
      })
      .sort((a, b) => Number(a.done) - Number(b.done) || b.updatedAt.localeCompare(a.updatedAt))
  }, [activePageId, pageIndex, search, state?.tasks, taskFilter])

  const visibleDatabases = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const databases = state?.databases ?? []
    if (!q) return databases
    return databases.filter((database) => {
      const haystack = [
        database.name,
        database.description,
        ...database.records.map((record) => `${record.title} ${record.notes} ${record.tags.join(' ')}`),
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [search, state?.databases])

  const activeView = state?.activeView ?? 'pages'
  const activeDatabase = React.useMemo(() => {
    if (!state?.databases.length) return null
    const current = databaseId ? state.databases.find((database) => database.id === databaseId) ?? null : null
    return current ?? state.databases[0]
  }, [databaseId, state?.databases])
  const activeDatabaseId = activeDatabase?.id ?? null
  const activeRecord = React.useMemo(() => {
    if (!activeDatabase?.records.length) return null
    const current = selectedRecordId
      ? activeDatabase.records.find((record) => record.id === selectedRecordId) ?? null
      : null
    return current ?? activeDatabase.records[0] ?? null
  }, [activeDatabase, selectedRecordId])

  React.useEffect(() => {
    if (activeDatabase && (!selectedRecordId || !activeDatabase.records.some((record) => record.id === selectedRecordId))) {
      setSelectedRecordId(activeDatabase.records[0]?.id ?? null)
    }
  }, [activeDatabase, selectedRecordId])

  const savePageField = React.useCallback((pageId: string, patch: Partial<Pick<OrganizerPage, 'title' | 'parentId'>>) => {
    updatePage(pageId, (page) => ({
      ...page,
      ...patch,
      history: [{
        id: createId('revision'),
        title: page.title,
        content: page.content,
        updatedAt: page.updatedAt,
        note: 'Изменение страницы',
      }, ...page.history].slice(0, 20),
      updatedAt: now(),
    }))
  }, [updatePage])

  type BlockMutationResult = {
    blocks: OrganizerBlock[]
    focusBlockId?: string | null
  }

  const updatePageBlocks = React.useCallback((pageId: string, updater: (blocks: OrganizerBlock[]) => BlockMutationResult) => {
    let focusBlockId: string | null | undefined
    updatePage(pageId, (page) => {
      const result = updater(page.blocks)
      focusBlockId = result.focusBlockId
      return {
        ...page,
        blocks: result.blocks,
        content: blocksToContent(result.blocks),
        history: [{
          id: createId('revision'),
          title: page.title,
          content: page.content,
          updatedAt: page.updatedAt,
          note: 'Изменение содержимого',
        }, ...page.history].slice(0, 20),
        updatedAt: now(),
      }
    })
    if (focusBlockId) setPendingFocusBlockId(focusBlockId)
  }, [updatePage])

  const addBlockAfter = React.useCallback((
    pageId: string,
    afterBlockId: string | null,
    type: OrganizerBlockType = 'paragraph',
    options: { text?: string; checked?: boolean; level?: number } = {},
  ) => {
    const newBlock = createBlock(type, options.level ?? 0)
    if (options.text !== undefined) newBlock.text = options.text
    if (type === 'todo') newBlock.checked = options.checked ?? false

    updatePageBlocks(pageId, (blocks) => {
      const next = [...blocks]
      const index = afterBlockId ? next.findIndex((block) => block.id === afterBlockId) : -1
      const insertAt = index >= 0 ? index + 1 : next.length
      next.splice(insertAt, 0, newBlock)
      return { blocks: next, focusBlockId: newBlock.id }
    })
  }, [updatePageBlocks])

  const deleteBlock = React.useCallback((pageId: string, blockId: string) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }

      const next = blocks.filter((block) => block.id !== blockId)
      if (next.length === 0) {
        const empty = createBlock('paragraph')
        return { blocks: [empty], focusBlockId: empty.id }
      }

      const focusBlockId = next[Math.max(0, index - 1)]?.id ?? next[0]?.id ?? null
      return { blocks: next, focusBlockId }
    })
  }, [updatePageBlocks])

  const duplicateBlock = React.useCallback((pageId: string, blockId: string) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }
      const source = blocks[index]
      const copy: OrganizerBlock = {
        ...source,
        id: createId('block'),
        level: clampBlockLevel(source.level ?? 0),
      }
      const next = [...blocks]
      next.splice(index + 1, 0, copy)
      return { blocks: next, focusBlockId: copy.id }
    })
  }, [updatePageBlocks])

  const moveBlock = React.useCallback((pageId: string, blockId: string, direction: -1 | 1) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= blocks.length) return { blocks }
      return { blocks: moveArrayItem(blocks, index, targetIndex), focusBlockId: blockId }
    })
  }, [updatePageBlocks])

  const changeBlockType = React.useCallback((pageId: string, blockId: string, type: OrganizerBlockType) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }
      const next = [...blocks]
      const current = next[index]
      next[index] = {
        ...current,
        type,
        text: type === 'divider' ? '' : current.text,
        checked: type === 'todo' ? Boolean(current.checked) : undefined,
        level: clampBlockLevel(current.level ?? 0),
      }
      return { blocks: next, focusBlockId: blockId }
    })
  }, [updatePageBlocks])

  const setBlockLevel = React.useCallback((pageId: string, blockId: string, nextLevel: number) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }
      const next = [...blocks]
      next[index] = {
        ...next[index],
        level: clampBlockLevel(nextLevel),
      }
      return { blocks: next, focusBlockId: blockId }
    })
  }, [updatePageBlocks])

  const mergeBlockWithPrevious = React.useCallback((pageId: string, blockId: string) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index <= 0) return { blocks }

      const previous = blocks[index - 1]
      const current = blocks[index]
      if (!previous || !current) return { blocks }

      const joinedText = [previous.text, current.text].filter(Boolean).join(previous.text && current.text ? ' ' : '')
      const next = [...blocks]
      next[index - 1] = {
        ...previous,
        text: joinedText,
      }
      next.splice(index, 1)
      return { blocks: next, focusBlockId: previous.id }
    })
  }, [updatePageBlocks])

  const splitBlockAtCursor = React.useCallback((
    pageId: string,
    blockId: string,
    cursorStart: number,
    cursorEnd: number,
    currentValue: string,
  ) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }
      const current = blocks[index]
      if (!isTextBlock(current.type)) return { blocks }

      const start = Math.max(0, Math.min(cursorStart, currentValue.length))
      const end = Math.max(start, Math.min(cursorEnd, currentValue.length))
      const before = currentValue.slice(0, start)
      const after = currentValue.slice(end)

      const nextType = defaultNextBlockType(current.type)
      const nextBlock = createBlock(nextType, clampBlockLevel(current.level ?? 0))
      nextBlock.text = after
      if (nextType === 'todo') nextBlock.checked = false

      const next = [...blocks]
      next[index] = {
        ...current,
        text: before,
      }
      next.splice(index + 1, 0, nextBlock)
      return { blocks: next, focusBlockId: nextBlock.id }
    })
  }, [updatePageBlocks])

  const reorderBlock = React.useCallback((pageId: string, blockId: string, targetBlockId: string, position: 'before' | 'after') => {
    updatePageBlocks(pageId, (blocks) => {
      const fromIndex = blocks.findIndex((block) => block.id === blockId)
      const targetIndex = blocks.findIndex((block) => block.id === targetBlockId)
      if (fromIndex === -1 || targetIndex === -1 || fromIndex === targetIndex) return { blocks }

      const moving = blocks[fromIndex]
      let next = [...blocks]
      next.splice(fromIndex, 1)

      let insertAt = targetIndex
      if (fromIndex < targetIndex) insertAt -= 1
      if (position === 'after') insertAt += 1
      insertAt = Math.max(0, Math.min(next.length, insertAt))
      next.splice(insertAt, 0, moving)
      return { blocks: next, focusBlockId: moving.id }
    })
  }, [updatePageBlocks])

  const applySlashBlockType = React.useCallback((type: OrganizerBlockType) => {
    if (!activePage || !slashMenuBlockId) return
    const currentBlock = activePage.blocks.find((block) => block.id === slashMenuBlockId)
    if (!currentBlock) return

    if (currentBlock.text.trim() === '' && isTextBlock(currentBlock.type)) {
      changeBlockType(activePage.id, currentBlock.id, type)
      setPendingFocusBlockId(currentBlock.id)
    } else {
      addBlockAfter(activePage.id, currentBlock.id, type, { level: clampBlockLevel(currentBlock.level ?? 0) })
    }

    setSlashMenuBlockId(null)
    setSlashSearch('')
  }, [activePage, addBlockAfter, changeBlockType, slashMenuBlockId, setPendingFocusBlockId])

  const updateBlock = React.useCallback((pageId: string, blockId: string, patch: Partial<OrganizerBlock>) => {
    updatePageBlocks(pageId, (blocks) => {
      const index = blocks.findIndex((block) => block.id === blockId)
      if (index === -1) return { blocks }
      const current = blocks[index]
      const nextType = patch.type ?? current.type
      const next: OrganizerBlock = {
        ...current,
        ...patch,
        type: nextType,
        text: nextType === 'divider' ? '' : String(patch.text ?? current.text ?? ''),
        checked: nextType === 'todo' ? Boolean(patch.checked ?? current.checked) : undefined,
        level: clampBlockLevel(patch.level ?? current.level ?? 0),
      }

      const result = [...blocks]
      result[index] = next
      return { blocks: result, focusBlockId: blockId }
    })
  }, [updatePageBlocks])

  const createPage = React.useCallback(async () => {
    const pages = state?.pages ?? []
    if (!state) return
    const title = (await prompt('Название страницы', 'Новая страница'))?.trim()
    if (!title) return

    const parentId = activePageId && pages.some((page) => page.id === activePageId) ? activePageId : null
    const blocks = [createBlock('paragraph')]
    const page: OrganizerPage = {
      id: createId('page'),
      title,
      content: blocksToContent(blocks),
      blocks,
      parentId,
      favorite: false,
      archived: false,
      isTemplate: false,
      templateName: null,
      tags: [],
      relatedPageIds: [],
      relatedTaskIds: [],
      attachments: [],
      history: [],
      createdAt: now(),
      updatedAt: now(),
    }

    updateState((current) => ({
      ...current,
      pages: [...current.pages, page],
      selectedPageId: page.id,
    }))
  }, [activePageId, prompt, state, updateState])

  const deletePage = React.useCallback(async (pageId: string) => {
    const pages = state?.pages ?? []
    if (!state) return
    const page = pages.find((item) => item.id === pageId)
    if (!page) return
    if (!(await confirm(`Удалить страницу «${page.title}» и все вложенные страницы?`))) return

    const removed = new Set([pageId, ...Array.from(collectDescendants(pages, pageId))])
    const fallback = page.parentId && !removed.has(page.parentId)
      ? page.parentId
      : pages.find((item) => !removed.has(item.id) && item.parentId === null)?.id
        ?? pages.find((item) => !removed.has(item.id))?.id
        ?? null

    updateState((current) => ({
      ...current,
      selectedPageId: current.selectedPageId && removed.has(current.selectedPageId) ? fallback : current.selectedPageId,
      pages: current.pages.filter((item) => !removed.has(item.id)),
      tasks: current.tasks.map((task) => removed.has(task.pageId ?? '') ? { ...task, pageId: null, updatedAt: now() } : task),
    }))
  }, [confirm, state, updateState])

  const togglePageFlag = React.useCallback((pageId: string, key: 'favorite' | 'archived' | 'isTemplate') => {
    updatePage(pageId, (page) => ({
      ...page,
      [key]: !page[key],
      history: [{
        id: createId('revision'),
        title: page.title,
        content: page.content,
        updatedAt: page.updatedAt,
        note: key === 'favorite' ? 'Избранное' : key === 'archived' ? 'Архив' : 'Шаблон',
      }, ...page.history].slice(0, 20),
      updatedAt: now(),
    }))
  }, [updatePage])

  const updatePageTags = React.useCallback(async (pageId: string) => {
    if (!state) return
    const page = state.pages.find((item) => item.id === pageId)
    if (!page) return
    const raw = (await prompt('Теги через запятую', page.tags.join(', ')))?.trim()
    if (raw === null || raw === undefined) return
    updatePage(pageId, (current) => ({
      ...current,
      tags: uniqueStrings(raw.split(',')),
      history: [{
        id: createId('revision'),
        title: current.title,
        content: current.content,
        updatedAt: current.updatedAt,
        note: 'Теги',
      }, ...current.history].slice(0, 20),
      updatedAt: now(),
    }))
  }, [prompt, state, updatePage])

  const addPageRelation = React.useCallback(async (pageId: string, type: 'page' | 'task') => {
    if (!state) return
    const value = (await prompt(type === 'page' ? 'ID страницы для связи' : 'ID задачи для связи', ''))?.trim()
    if (!value) return

    updatePage(pageId, (page) => {
      if (type === 'page') {
        return {
          ...page,
          relatedPageIds: uniqueStrings([...page.relatedPageIds, value]),
          history: [{
            id: createId('revision'),
            title: page.title,
            content: page.content,
            updatedAt: page.updatedAt,
            note: 'Связь со страницей',
          }, ...page.history].slice(0, 20),
          updatedAt: now(),
        }
      }

      return {
        ...page,
        relatedTaskIds: uniqueStrings([...page.relatedTaskIds, value]),
        history: [{
          id: createId('revision'),
          title: page.title,
          content: page.content,
          updatedAt: page.updatedAt,
          note: 'Связь с задачей',
        }, ...page.history].slice(0, 20),
        updatedAt: now(),
      }
    })
  }, [prompt, state, updatePage])

  const addPageAttachment = React.useCallback(async (pageId: string, type: OrganizerAttachment['type']) => {
    const title = (await prompt('Название вложения', type === 'link' ? 'Ссылка' : type === 'file' ? 'Файл' : 'Картинка'))?.trim()
    if (!title) return
    const url = (await prompt('URL / путь', ''))?.trim()
    if (!url) return

    updatePage(pageId, (page) => ({
      ...page,
      attachments: [
        {
          id: createId('attachment'),
          type,
          title,
          url,
          createdAt: now(),
        },
        ...page.attachments,
      ],
      history: [{
        id: createId('revision'),
        title: page.title,
        content: page.content,
        updatedAt: page.updatedAt,
        note: 'Вложение',
      }, ...page.history].slice(0, 20),
      updatedAt: now(),
    }))
  }, [prompt, updatePage])

  const registerMentionRelation = React.useCallback((pageId: string, mention: { kind: 'page' | 'task'; id: string; title: string }) => {
    updatePage(pageId, (page) => {
      if (mention.kind === 'page') {
        return {
          ...page,
          relatedPageIds: uniqueStrings([...page.relatedPageIds, mention.id]),
          history: [{
            id: createId('revision'),
            title: page.title,
            content: page.content,
            updatedAt: page.updatedAt,
            note: `Упоминание страницы: ${mention.title}`,
          }, ...page.history].slice(0, 20),
          updatedAt: now(),
        }
      }

      return {
        ...page,
        relatedTaskIds: uniqueStrings([...page.relatedTaskIds, mention.id]),
        history: [{
          id: createId('revision'),
          title: page.title,
          content: page.content,
          updatedAt: page.updatedAt,
          note: `Упоминание задачи: ${mention.title}`,
        }, ...page.history].slice(0, 20),
        updatedAt: now(),
      }
    })
  }, [updatePage])

  const createTask = React.useCallback(async () => {
    if (!state) return
    const title = (await prompt('Название задачи', 'Новая задача'))?.trim()
    if (!title) return
    const dueDate = parseDateInput((await prompt('Дата дедлайна (YYYY-MM-DD)', ''))?.trim() ?? '')
    const startDate = parseDateInput((await prompt('Дата старта (YYYY-MM-DD)', ''))?.trim() ?? '')
    const tags = uniqueStrings((await prompt('Теги через запятую', '') ?? '').split(','))
    const recurrenceInput = (await prompt('Повторение: none, daily, weekly, monthly', 'none'))?.trim() ?? 'none'
    const recurrence = recurrenceInput === 'daily' || recurrenceInput === 'weekly' || recurrenceInput === 'monthly' ? recurrenceInput : 'none'

    const task: OrganizerTask = {
      id: createId('task'),
      title,
      status: 'todo',
      done: false,
      priority: 'medium',
      pageId: activePageId,
      dueDate,
      startDate,
      tags,
      relatedPageIds: activePageId ? [activePageId] : [],
      relatedTaskIds: [],
      recurrence,
      createdAt: now(),
      updatedAt: now(),
    }

    updateState((current) => ({
      ...current,
      tasks: [task, ...current.tasks],
    }))
  }, [activePageId, prompt, state, updateState])

  const updateTask = React.useCallback((taskId: string, patch: Partial<Pick<OrganizerTask, 'title' | 'status' | 'done' | 'priority' | 'pageId' | 'dueDate' | 'startDate' | 'tags' | 'relatedPageIds' | 'relatedTaskIds' | 'recurrence'>>) => {
    updateState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => {
        if (task.id !== taskId) return task
        const nextStatus = patch.status ?? task.status
        const nextDone = patch.done ?? nextStatus === 'done'
        return {
          ...task,
          ...patch,
          status: nextStatus,
          done: nextDone,
          tags: patch.tags ? uniqueStrings(patch.tags) : task.tags,
          relatedPageIds: patch.relatedPageIds ? uniqueStrings(patch.relatedPageIds) : task.relatedPageIds,
          relatedTaskIds: patch.relatedTaskIds ? uniqueStrings(patch.relatedTaskIds) : task.relatedTaskIds,
          updatedAt: now(),
        }
      }),
    }))
  }, [updateState])

  const deleteTask = React.useCallback(async (taskId: string) => {
    const task = state?.tasks.find((item) => item.id === taskId)
    if (!task) return
    if (!(await confirm(`Удалить задачу «${task.title}»?`))) return

    updateState((current) => ({
      ...current,
      tasks: current.tasks.filter((item) => item.id !== taskId),
    }))
  }, [confirm, state?.tasks, updateState])

  const createDatabase = React.useCallback(async () => {
    if (!state) return
    const name = (await prompt('Название базы', 'Новая база'))?.trim()
    if (!name) return
    const database: OrganizerDatabase = {
      id: createId('database'),
      name,
      description: 'База записей и представлений',
      view: 'table',
      pageId: activePageId,
      fields: [
        { id: createId('field'), key: 'title', label: 'Название', type: 'title' },
        { id: createId('field'), key: 'status', label: 'Статус', type: 'status' },
        { id: createId('field'), key: 'date', label: 'Дата', type: 'date' },
        { id: createId('field'), key: 'tags', label: 'Теги', type: 'tags' },
        { id: createId('field'), key: 'priority', label: 'Приоритет', type: 'priority' },
        { id: createId('field'), key: 'page', label: 'Страница', type: 'page' },
      ],
      records: [],
      createdAt: now(),
      updatedAt: now(),
    }

    updateState((current) => ({
      ...current,
      databases: [...current.databases, database],
      activeView: 'databases',
    }))
    setDatabaseId(database.id)
    setSelectedRecordId(null)
  }, [activePageId, prompt, state, updateState])

  const updateRecord = React.useCallback((databaseId: string, recordId: string, patch: Partial<Pick<OrganizerDatabaseRecord, 'title' | 'status' | 'date' | 'tags' | 'priority' | 'pageId' | 'relatedRecordIds' | 'notes'>>) => {
    updateDatabase(databaseId, (database) => ({
      ...database,
      updatedAt: now(),
      records: database.records.map((record) => {
        if (record.id !== recordId) return record
        return {
          ...record,
          ...patch,
          tags: patch.tags ? uniqueStrings(patch.tags) : record.tags,
          relatedRecordIds: patch.relatedRecordIds ? uniqueStrings(patch.relatedRecordIds) : record.relatedRecordIds,
          updatedAt: now(),
        }
      }),
    }))
  }, [updateDatabase])

  const createRecord = React.useCallback(async (databaseId: string) => {
    if (!state) return
    const database = state.databases.find((item) => item.id === databaseId)
    if (!database) return
    const title = (await prompt('Название записи', 'Новая запись'))?.trim()
    if (!title) return
    const record: OrganizerDatabaseRecord = {
      id: createId('record'),
      title,
      status: 'todo',
      date: null,
      tags: [],
      priority: 'medium',
      pageId: activePageId,
      relatedRecordIds: [],
      notes: '',
      createdAt: now(),
      updatedAt: now(),
    }

    updateDatabase(databaseId, (current) => ({
      ...current,
      records: [record, ...current.records],
      updatedAt: now(),
    }))
    setSelectedRecordId(record.id)
  }, [activePageId, prompt, state, updateDatabase])

  const renderPageTree = React.useCallback((parentId: string | null, depth = 0): React.ReactNode => {
    const pages = (state?.pages ?? [])
      .filter((page) => page.parentId === parentId)
      .filter((page) => {
        if (!search.trim()) return true
        const list = visiblePages.map((item) => item.id)
        return list.includes(page.id)
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    return pages.map((page) => {
      const active = page.id === activePageId
      const childCount = (state?.pages ?? []).filter((item) => item.parentId === page.id).length
      return (
        <div key={page.id}>
          <button
            type="button"
            onClick={() => updateState((current) => ({ ...current, selectedPageId: page.id }))}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              paddingLeft: 10 + depth * 14,
              border: 'none',
              borderRadius: 10,
              background: active ? '#1E2A3A' : 'transparent',
              color: active ? '#7CC0FF' : '#CFCFCF',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(event) => {
              if (!active) event.currentTarget.style.background = '#161616'
            }}
            onMouseLeave={(event) => {
              if (!active) event.currentTarget.style.background = 'transparent'
            }}
          >
            <FileText size={13} style={{ flexShrink: 0, color: active ? '#7CC0FF' : '#666' }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {page.title}
            </span>
            {childCount > 0 && (
              <span style={{ fontSize: 10, color: '#666', background: '#1A1A1A', border: '1px solid #262626', borderRadius: 999, padding: '1px 6px' }}>
                {childCount}
              </span>
            )}
          </button>
          {renderPageTree(page.id, depth + 1)}
        </div>
      )
    })
  }, [activePageId, search, state?.pages, updateState, visiblePages])

  const renderBlock = React.useCallback((block: OrganizerBlock, _index: number) => {
    if (!activePage) return null

    const blockLevel = clampBlockLevel(block.level ?? 0)
    const isDragging = draggingBlockId === block.id
    const isDropBefore = dropTarget?.blockId === block.id && dropTarget.position === 'before'
    const isDropAfter = dropTarget?.blockId === block.id && dropTarget.position === 'after'

    const handleEnter = () => {
      addBlockAfter(activePage.id, block.id, block.type === 'heading' ? 'paragraph' : block.type, { level: blockLevel })
    }

    const handleBackspaceEmpty = () => {
      deleteBlock(activePage.id, block.id)
    }

    const handleTab = (direction: 1 | -1) => {
      setBlockLevel(activePage.id, block.id, blockLevel + direction)
    }

    const handleMove = (direction: -1 | 1) => {
      moveBlock(activePage.id, block.id, direction)
    }

    const dragHandleStyle: React.CSSProperties = {
      width: 20,
      minHeight: 24,
      color: '#444',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 4,
      cursor: 'grab',
    }

    return (
      <div
        key={block.id}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '6px 0',
          paddingLeft: blockLevel * 18,
          borderRadius: 12,
          transition: 'background 0.15s, opacity 0.15s, box-shadow 0.15s',
          opacity: isDragging ? 0.45 : 1,
          boxShadow: isDropBefore
            ? 'inset 0 2px 0 #0099FF'
            : isDropAfter
              ? 'inset 0 -2px 0 #0099FF'
              : 'none',
        }}
        onDragOver={(event) => {
          if (!draggingBlockId || draggingBlockId === block.id) return
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
          setDropTarget({ blockId: block.id, position })
        }}
        onDrop={(event) => {
          event.preventDefault()
          if (draggingBlockId && draggingBlockId !== block.id) {
            const position = dropTarget?.blockId === block.id ? dropTarget.position : 'after'
            reorderBlock(activePage.id, draggingBlockId, block.id, position)
          }
          setDraggingBlockId(null)
          setDropTarget(null)
        }}
        onDragEnd={() => {
          setDraggingBlockId(null)
          setDropTarget(null)
        }}
      >
        <div
          title="Перетащить"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', block.id)
            setDraggingBlockId(block.id)
          }}
          style={dragHandleStyle}
        >
          <GripVertical size={14} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <select
              value={block.type}
              onChange={(event) => changeBlockType(activePage.id, block.id, event.target.value as OrganizerBlockType)}
              style={{
                background: '#151515',
                color: '#D8D8D8',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                padding: '5px 8px',
                fontSize: 11,
              }}
            >
              {BLOCK_OPTIONS.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => addBlockAfter(activePage.id, block.id, 'paragraph', { level: blockLevel })}
              style={{
                padding: '5px 9px',
                borderRadius: 8,
                border: '1px solid #2A2A2A',
                background: '#151515',
                color: '#CFCFCF',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              + Блок
            </button>

            <button
              type="button"
              onClick={() => duplicateBlock(activePage.id, block.id)}
              style={{
                padding: '5px 9px',
                borderRadius: 8,
                border: '1px solid #2A2A2A',
                background: '#151515',
                color: '#CFCFCF',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Дублировать
            </button>

            <button
              type="button"
              onClick={() => deleteBlock(activePage.id, block.id)}
              style={{
                padding: '5px 9px',
                borderRadius: 8,
                border: '1px solid #3A1F1F',
                background: '#201313',
                color: '#fca5a5',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Удалить
            </button>
          </div>

          {block.type === 'divider' ? (
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #2D2D2D, transparent)', margin: '18px 0' }} />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                ...(block.type === 'todo'
                  ? {}
                  : {}),
              }}
            >
              {block.type === 'todo' && (
                <button
                  type="button"
                  onClick={() => updateBlock(activePage.id, block.id, { checked: !block.checked })}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    border: 'none',
                    background: block.checked ? '#0A2A18' : '#161616',
                    color: block.checked ? '#34d399' : '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  {block.checked ? <Check size={14} /> : <Circle size={13} />}
                </button>
              )}

              <OrganizerRichTextEditor
                blockId={block.id}
                value={block.text}
                richText={block.richText}
                variant={block.type}
                mentionTargets={{
                  pages: (state?.pages ?? []).map((page) => ({ id: page.id, title: page.title })),
                  tasks: (state?.tasks ?? []).map((task) => ({ id: task.id, title: task.title })),
                }}
                placeholder={
                  block.type === 'heading'
                    ? 'Заголовок'
                    : block.type === 'quote'
                      ? 'Цитата'
                      : block.type === 'bullet'
                        ? 'Пункт списка'
                        : block.type === 'todo'
                          ? 'Пункт задачи'
                          : 'Начните писать...'
                }
                contentRef={(node) => {
                  blockRefs.current[block.id] = node
                }}
                onFocusChange={() => {
                  // no-op: toolbar visibility handled inside the editor
                }}
                onChange={(next) => updateBlock(activePage.id, block.id, {
                  text: next.text,
                  richText: next.richText,
                })}
                onMentionInsert={(mention) => registerMentionRelation(activePage.id, mention)}
                onEnter={handleEnter}
                onBackspaceEmpty={handleBackspaceEmpty}
                onTab={handleTab}
                onMove={handleMove}
                onSlash={() => {
                  setSlashMenuBlockId(block.id)
                  setSlashSearch('')
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }, [
    activePage,
    addBlockAfter,
    changeBlockType,
    deleteBlock,
    draggingBlockId,
    duplicateBlock,
    dropTarget,
    moveBlock,
    reorderBlock,
    registerMentionRelation,
    setBlockLevel,
    state,
    updateBlock,
  ])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420, color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface-app)' }}>
        Загрузка органайзера...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--surface-app)', color: 'var(--foreground)' }}>
      {Dialog}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-panel)' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#F1F1F1' }}>Органайзер</p>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: '#666' }}>
            Страницы, заметки и задачи в стиле Notion
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', minWidth: 250 }}>
            <Search size={13} style={{ color: '#555', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по страницам и задачам"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12 }}
            />
          </div>

          <button
            type="button"
            onClick={() => void createPage()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: '#0099FF', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={13} />
            Новая страница
          </button>

          <button
            type="button"
            onClick={() => void createTask()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '1px solid #2A2A2A', background: '#161616', color: '#D8D8D8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={13} />
            Новая задача
          </button>

          <div style={{ fontSize: 11, color: syncStatus === 'error' ? '#ef4444' : syncStatus === 'saving' ? '#F59E0B' : '#666' }}>
            {syncStatus === 'saving' ? 'Сохраняем...' : syncStatus === 'error' ? 'Ошибка сохранения' : 'Сохранено'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px 0', flexWrap: 'wrap' }}>
        {([
          'pages',
          'calendar',
          'databases',
          'relations',
          'search',
          'content',
        ] as OrganizerWorkspaceView[]).map((view) => {
          const active = activeView === view
          return (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view)}
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #2A2A2A',
                background: active ? '#1E2A3A' : '#151515',
                color: active ? '#7CC0FF' : '#CFCFCF',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {viewLabel(view)}
            </button>
          )
        })}
      </div>

      <div style={{ display: activeView === 'pages' ? 'grid' : 'none', gridTemplateColumns: '280px minmax(0, 1fr)', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <aside style={{ borderRight: '1px solid var(--border-subtle)', background: 'var(--surface-panel)', padding: 16, minHeight: 0, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Страницы</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>{pageCount} страниц</p>
            </div>
            <button
              type="button"
              onClick={() => void createPage()}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#171717', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}
            >
              + Страница
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pageCount === 0 ? (
              <div style={{ border: '1px dashed #2A2A2A', borderRadius: 14, padding: 16, color: '#666', fontSize: 12, lineHeight: 1.6 }}>
                Пока пусто. Создайте первую страницу, чтобы начать вести заметки и структуру проекта.
              </div>
            ) : (
              renderPageTree(null)
            )}
          </div>
        </aside>

        <section style={{ minHeight: 0, overflow: 'auto', padding: 20 }}>
          {!activePage ? (
            <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ maxWidth: 420, textAlign: 'center', color: '#666' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: '#171717', border: '1px solid #262626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={30} style={{ color: '#4A9EFF' }} />
                </div>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#E8E8E8' }}>Выберите или создайте страницу</p>
                <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.7, color: '#666' }}>
                  Здесь будут заметки, списки, связи и задача для этой страницы.
                </p>
                <button
                  type="button"
                  onClick={() => void createPage()}
                  style={{ marginTop: 18, padding: '10px 16px', borderRadius: 10, border: 'none', background: '#0099FF', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Создать первую страницу
                </button>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16, color: '#666', fontSize: 11 }}>
                {breadcrumb.map((page, index) => (
                  <React.Fragment key={page.id}>
                    {index > 0 && <span style={{ color: '#333' }}>/</span>}
                    <button
                      type="button"
                      onClick={() => updateState((current) => ({ ...current, selectedPageId: page.id }))}
                      style={{ border: 'none', background: 'transparent', color: index === breadcrumb.length - 1 ? '#CFE8FF' : '#666', fontSize: 11, cursor: 'pointer', padding: 0 }}
                    >
                      {page.title}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={activePage.title}
                    onChange={(event) => savePageField(activePage.id, { title: event.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#F4F4F4',
                      fontSize: 30,
                      fontWeight: 900,
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      padding: 0,
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#666' }}>
                      Создано {formatDate(activePage.createdAt)}
                    </span>
                    <span style={{ fontSize: 11, color: '#2A2A2A' }}>•</span>
                    <span style={{ fontSize: 11, color: '#666' }}>
                      Обновлено {formatDate(activePage.updatedAt)}
                    </span>
                    <span style={{ fontSize: 11, color: '#2A2A2A' }}>•</span>
                    <span style={{ fontSize: 11, color: '#666' }}>
                      {pageChildren.length} подстраниц
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => void createPage()}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #2A2A2A', background: '#171717', color: '#D8D8D8', fontSize: 12, cursor: 'pointer' }}
                  >
                    + Подстраница
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePage(activePage.id)}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #3A1F1F', background: '#201313', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 18 }}>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Содержание</p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>Блоки текста, заголовки, списки и задачи</p>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#666' }}>
                      Родитель
                      <select
                        value={activePage.parentId ?? ''}
                        onChange={(event) => savePageField(activePage.id, { parentId: event.target.value || null })}
                        style={{ background: 'var(--surface-subtle)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '6px 8px', fontSize: 11 }}
                      >
                        <option value="">Нет</option>
                        {(state?.pages ?? [])
                          .filter((page) => page.id !== activePage.id && !collectDescendants(state?.pages ?? [], activePage.id).has(page.id))
                          .map((page) => (
                            <option key={page.id} value={page.id}>
                              {page.title}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ padding: 12, borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {BLOCK_OPTIONS.map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => addBlockAfter(activePage.id, activePage.blocks[activePage.blocks.length - 1]?.id ?? null, option.type)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #2A2A2A',
                          background: '#151515',
                          color: '#D8D8D8',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        + {option.label}
                      </button>
                    ))}
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#555' }}>
                      Enter = новый блок, Shift+Enter = перенос строки, Tab = вложенность, Alt+↑↓ = перенос
                    </span>
                  </div>

                  {slashMenuBlockId && (
                    <div style={{ padding: 12, borderBottom: '1px solid #1E1E1E', background: '#101010' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: '1px solid #2A2A2A', background: '#151515', marginBottom: 10 }}>
                        <Search size={12} style={{ color: '#555', flexShrink: 0 }} />
                        <input
                          ref={slashSearchRef}
                          value={slashSearch}
                          onChange={(event) => setSlashSearch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              setSlashMenuBlockId(null)
                              setSlashSearch('')
                              return
                            }
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              const option = (BLOCK_OPTIONS.filter((item) => item.label.toLowerCase().includes(slashSearch.toLowerCase()))[0] ?? BLOCK_OPTIONS[0])!
                              applySlashBlockType(option.type)
                            }
                          }}
                          placeholder="Slash menu: выбрать блок"
                          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12 }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                        {BLOCK_OPTIONS
                          .filter((option) => option.label.toLowerCase().includes(slashSearch.toLowerCase()))
                          .map((option) => (
                            <button
                              key={option.type}
                              type="button"
                              onClick={() => applySlashBlockType(option.type)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 4,
                                padding: '10px 12px',
                                borderRadius: 12,
                                border: '1px solid #2A2A2A',
                                background: '#151515',
                                color: '#D8D8D8',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 700 }}>
                                /{option.label}
                              </span>
                              <span style={{ fontSize: 11, color: '#666' }}>
                                {option.type === 'paragraph'
                                  ? 'Обычный текст'
                                  : option.type === 'heading'
                                    ? 'Заголовок'
                                    : option.type === 'todo'
                                      ? 'Чеклист'
                                      : option.type === 'bullet'
                                        ? 'Маркированный список'
                                        : option.type === 'quote'
                                          ? 'Цитата'
                                          : 'Разделитель'}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {activePage.blocks.length === 0 ? (
                      <div style={{ border: '1px dashed #2A2A2A', borderRadius: 14, padding: 16, color: '#666', fontSize: 12, lineHeight: 1.6 }}>
                        Страница пока пустая. Добавьте первый блок, чтобы начать писать в структуре Notion.
                      </div>
                    ) : (
                      activePage.blocks.map((block, index) => renderBlock(block, index))
                    )}
                  </div>
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Задачи</p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>{taskCount} всего, {openTaskCount} открыто</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void createTask()}
                        style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: '#0099FF', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Задача
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: 12, flexWrap: 'wrap', borderBottom: '1px solid #1E1E1E' }}>
                      {[
                        { id: 'all', label: 'Все' },
                        { id: 'page', label: 'Страница' },
                        { id: 'active', label: 'Открытые' },
                        { id: 'done', label: 'Готово' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTaskFilter(item.id as typeof taskFilter)}
                          style={{
                            padding: '5px 9px',
                            borderRadius: 999,
                            border: '1px solid #2A2A2A',
                            background: taskFilter === item.id ? '#1E2A3A' : '#111',
                            color: taskFilter === item.id ? '#7CC0FF' : '#666',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ maxHeight: 520, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredTasks.length === 0 ? (
                        <div style={{ border: '1px dashed #2A2A2A', borderRadius: 14, padding: 16, color: '#666', fontSize: 12, lineHeight: 1.6 }}>
                          Пока нет задач. Добавьте первую задачу для этой страницы или проекта.
                        </div>
                      ) : (
                        filteredTasks.map((task) => {
                          const linkedPage = task.pageId ? pageIndex.get(task.pageId) ?? null : null
                          return (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                padding: 10,
                                borderRadius: 14,
                                background: 'var(--surface-subtle)',
                                border: '1px solid #232323',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => updateTask(task.id, { done: !task.done })}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 999,
                                  border: 'none',
                                  background: task.done ? '#0A2A18' : '#161616',
                                  color: task.done ? '#34d399' : '#666',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              >
                                {task.done ? <Check size={14} /> : <Circle size={13} />}
                              </button>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <input
                                  value={task.title}
                                  onChange={(event) => updateTask(task.id, { title: event.target.value })}
                                  style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: task.done ? '#6B7280' : '#E8E8E8',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textDecoration: task.done ? 'line-through' : 'none',
                                    padding: 0,
                                    marginBottom: 6,
                                  }}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <select
                                    value={task.priority}
                                    onChange={(event) => updateTask(task.id, { priority: event.target.value as OrganizerTask['priority'] })}
                                    style={{ background: '#151515', color: pagePriorityColor(task.priority), border: '1px solid #252525', borderRadius: 8, padding: '4px 7px', fontSize: 10 }}
                                  >
                                    <option value="low">Низкий</option>
                                    <option value="medium">Средний</option>
                                    <option value="high">Высокий</option>
                                  </select>

                                  <span style={{ fontSize: 10, color: '#666' }}>
                                    {pagePriorityLabel(task.priority)}
                                  </span>

                                  <span style={{ fontSize: 10, color: '#2A2A2A' }}>•</span>

                                  <span style={{ fontSize: 10, color: linkedPage ? '#7CC0FF' : '#666' }}>
                                    {linkedPage ? linkedPage.title : 'Без страницы'}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => void deleteTask(task.id)}
                                style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.7 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Подсказка</p>
                    <p style={{ margin: '8px 0 0' }}>
                      Это базовый `Notion-lite` слой: страницы, вложенность, заметки и задачи.
                      Следующим шагом сюда можно добавить блоки, таблицы, календари и общие базы данных.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </section>
      </div>

      {activeView !== 'pages' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 20 }}>
          {activeView === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#F1F1F1' }}>Календарь</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666' }}>
                    Дедлайны, события и повторяющиеся задачи
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {(['month', 'week', 'day'] as const).map((view) => (
                    <button
                      key={view}
                      type="button"
                      onClick={() => setCalendarView(view)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid #2A2A2A',
                        background: calendarView === view ? '#1E2A3A' : '#151515',
                        color: calendarView === view ? '#7CC0FF' : '#CFCFCF',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {view === 'month' ? 'Месяц' : view === 'week' ? 'Неделя' : 'День'}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => void createTask()}
                    style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#0099FF', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Задача
                  </button>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', overflow: 'hidden' }}>
                <div style={{ padding: 14, borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setCalendarDate((date) => {
                        if (calendarView === 'month') return addMonths(date, -1)
                        if (calendarView === 'week') return addDays(date, -7)
                        return addDays(date, -1)
                      })}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDate(new Date())}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}
                    >
                      Сегодня
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarDate((date) => {
                        if (calendarView === 'month') return addMonths(date, 1)
                        if (calendarView === 'week') return addDays(date, 7)
                        return addDays(date, 1)
                      })}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}
                    >
                      →
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#CFCFCF', fontWeight: 700 }}>
                    {calendarDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {calendarView === 'month' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                      <div key={day} style={{ padding: 8, borderBottom: '1px solid #1E1E1E', color: '#666', fontSize: 11, fontWeight: 700 }}>
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 42 }, (_, index) => {
                      const firstDay = startOfWeek(startOfMonth(calendarDate))
                      const cellDate = addDays(firstDay, index)
                      const key = dateKey(cellDate)
                      const items = tasksByDate.get(key) ?? []
                      const isCurrentMonth = cellDate.getMonth() === calendarDate.getMonth()
                      const isToday = key === dateKey(new Date())

                      return (
                        <button
                          key={key + index}
                          type="button"
                          onClick={() => setCalendarDate(cellDate)}
                          style={{
                            minHeight: 94,
                            textAlign: 'left',
                            padding: 8,
                            border: 'none',
                            borderRight: '1px solid #1E1E1E',
                            borderBottom: '1px solid #1E1E1E',
                            background: isToday ? '#182233' : 'transparent',
                            color: isCurrentMonth ? '#E8E8E8' : '#555',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{cellDate.getDate()}</span>
                            {items.length > 0 && (
                              <span style={{ fontSize: 10, color: '#7CC0FF', background: '#1E2A3A', borderRadius: 999, padding: '2px 6px' }}>
                                {items.length}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {items.slice(0, 3).map((occurrence) => (
                              <div key={`${occurrence.task.id}-${key}`} style={{ fontSize: 10, color: occurrence.task.done ? '#6B7280' : '#D8D8D8', textDecoration: occurrence.task.done ? 'line-through' : 'none', background: occurrence.recurring ? '#152033' : '#151515', border: '1px solid #262626', borderRadius: 8, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{occurrence.task.title}</span>
                                {occurrence.recurring && <span style={{ color: '#7CC0FF', fontSize: 9 }}>↻</span>}
                              </div>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 12, display: 'grid', gap: 10 }}>
                    {Array.from({ length: calendarView === 'week' ? 7 : 1 }, (_, offset) => {
                      const base = calendarView === 'week' ? startOfWeek(calendarDate) : calendarDate
                      const day = addDays(base, offset)
                      const key = dateKey(day)
                      const items = tasksByDate.get(key) ?? []
                      return (
                        <div key={key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-subtle)', padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <strong style={{ color: '#E8E8E8', fontSize: 13 }}>{formatDayLabel(day)}</strong>
                            <span style={{ color: '#666', fontSize: 11 }}>{items.length} задач</span>
                          </div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {items.length === 0 ? (
                              <div style={{ color: '#666', fontSize: 12 }}>Нет задач на этот день.</div>
                            ) : items.map((occurrence) => (
                              <div key={`${occurrence.task.id}-${key}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, border: '1px solid var(--border-subtle)', background: occurrence.recurring ? 'var(--accent-soft)' : 'var(--surface-elevated)' }}>
                                <button
                                  type="button"
                                  onClick={() => updateTask(occurrence.task.id, { done: !occurrence.task.done, status: occurrence.task.done ? 'todo' : 'done' })}
                                  style={{ width: 22, height: 22, borderRadius: 999, border: 'none', background: occurrence.task.done ? '#0A2A18' : '#161616', color: occurrence.task.done ? '#34d399' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  {occurrence.task.done ? <Check size={14} /> : <Circle size={13} />}
                                </button>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <input value={occurrence.task.title} onChange={(event) => updateTask(occurrence.task.id, { title: event.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12, fontWeight: 600 }} />
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                    <select value={occurrence.task.status} onChange={(event) => updateTask(occurrence.task.id, { status: event.target.value as OrganizerTaskStatus })} style={{ background: '#151515', color: taskStatusColor(occurrence.task.status), border: '1px solid #252525', borderRadius: 8, padding: '4px 7px', fontSize: 10 }}>
                                      <option value="todo">Нужно сделать</option>
                                      <option value="in_progress">В работе</option>
                                      <option value="done">Готово</option>
                                    </select>
                                    <input type="date" value={occurrence.task.dueDate ? dateOnly(occurrence.task.dueDate) : ''} onChange={(event) => updateTask(occurrence.task.id, { dueDate: parseDateInput(event.target.value) })} style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 7px', fontSize: 10 }} />
                                    <input value={occurrence.task.tags.join(', ')} onChange={(event) => updateTask(occurrence.task.id, { tags: uniqueStrings(event.target.value.split(',')) })} placeholder="теги" style={{ minWidth: 120, background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 7px', fontSize: 10 }} />
                                    {occurrence.recurring && <span style={{ color: '#7CC0FF', fontSize: 10 }}>повторяется</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'databases' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#F1F1F1' }}>Таблицы и базы</p>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666' }}>
                    Таблица, список, доска и календарь для записей
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => void createDatabase()} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#0099FF', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    + База
                  </button>
                  <button type="button" onClick={() => activeDatabaseId && void createRecord(activeDatabaseId)} disabled={!activeDatabaseId} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #2A2A2A', background: '#161616', color: '#D8D8D8', fontSize: 12, fontWeight: 700, cursor: activeDatabaseId ? 'pointer' : 'not-allowed', opacity: activeDatabaseId ? 1 : 0.5 }}>
                    + Запись
                  </button>
                </div>
              </div>

              {!activeDatabase ? (
                <div style={{ border: '1px dashed #2A2A2A', borderRadius: 18, padding: 20, color: '#666', fontSize: 13 }}>
                  Пока нет баз. Создайте первую базу, чтобы начать работать с таблицами и представлениями.
                </div>
              ) : (
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', overflow: 'hidden' }}>
                  <div style={{ padding: 14, borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <input value={activeDatabase.name} onChange={(event) => updateDatabase(activeDatabase.id, (db) => ({ ...db, name: event.target.value, updatedAt: now() }))} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#F1F1F1', fontSize: 18, fontWeight: 800 }} />
                      <input value={activeDatabase.description} onChange={(event) => updateDatabase(activeDatabase.id, (db) => ({ ...db, description: event.target.value, updatedAt: now() }))} placeholder="Описание базы" style={{ width: '100%', marginTop: 4, background: 'transparent', border: 'none', outline: 'none', color: '#666', fontSize: 12 }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <select value={activeDatabase.view} onChange={(event) => updateDatabase(activeDatabase.id, (db) => ({ ...db, view: event.target.value as OrganizerDatabaseView, updatedAt: now() }))} style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '6px 8px', fontSize: 11 }}>
                        <option value="table">Таблица</option>
                        <option value="list">Список</option>
                        <option value="board">Доска</option>
                        <option value="calendar">Календарь</option>
                      </select>

                      <select value={activeDatabaseId ?? ''} onChange={(event) => setDatabaseId(event.target.value || null)} style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '6px 8px', fontSize: 11 }}>
                        {visibleDatabases.map((database) => (
                          <option key={database.id} value={database.id}>{database.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ padding: 12, display: 'grid', gap: 10 }}>
                    {activeDatabase.records.length === 0 ? (
                      <div style={{ border: '1px dashed #2A2A2A', borderRadius: 14, padding: 16, color: '#666', fontSize: 12 }}>Пока нет записей. Добавьте первую запись в базу.</div>
                    ) : activeDatabase.view === 'board' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                        {(['todo', 'in_progress', 'done'] as OrganizerTaskStatus[]).map((status) => (
                          <div key={status} style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, background: 'var(--surface-subtle)', padding: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <strong style={{ color: taskStatusColor(status), fontSize: 12 }}>{taskStatusLabel(status)}</strong>
                              <span style={{ color: '#666', fontSize: 11 }}>{activeDatabase.records.filter((record) => record.status === status).length}</span>
                            </div>
                            <div style={{ display: 'grid', gap: 8 }}>
                              {activeDatabase.records.filter((record) => record.status === status).map((record) => (
                                <div key={record.id} onClick={() => setSelectedRecordId(record.id)} style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--surface-elevated)', padding: 10, cursor: 'pointer' }}>
                                  <input value={record.title} onChange={(event) => updateRecord(activeDatabase.id, record.id, { title: event.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12, fontWeight: 700 }} />
                                  <input value={record.notes} onChange={(event) => updateRecord(activeDatabase.id, record.id, { notes: event.target.value })} placeholder="Заметка" style={{ width: '100%', marginTop: 6, background: 'transparent', border: '1px solid #252525', borderRadius: 8, padding: '6px 8px', color: '#D8D8D8', fontSize: 11 }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activeDatabase.view === 'calendar' ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {Array.from(recordsByDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, records]) => (
                          <div key={day} style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--surface-subtle)', padding: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <strong style={{ color: '#E8E8E8', fontSize: 12 }}>{day}</strong>
                              <span style={{ color: '#666', fontSize: 11 }}>{records.length}</span>
                            </div>
                            <div style={{ display: 'grid', gap: 6 }}>
                              {records.map((record) => (
                                <div key={record.id} onClick={() => setSelectedRecordId(record.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--surface-elevated)', padding: '8px 10px', cursor: 'pointer' }}>
                                  <input value={record.title} onChange={(event) => updateRecord(activeDatabase.id, record.id, { title: event.target.value })} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12 }} />
                                  <input type="date" value={record.date ? dateOnly(record.date) : ''} onChange={(event) => updateRecord(activeDatabase.id, record.id, { date: parseDateInput(event.target.value) })} style={{ background: 'var(--surface-subtle)', color: 'var(--foreground)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '4px 6px', fontSize: 10 }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activeDatabase.view === 'list' ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        {activeDatabase.records.map((record) => (
                          <div key={record.id} onClick={() => setSelectedRecordId(record.id)} style={{ border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--surface-subtle)', padding: 10, cursor: 'pointer' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) repeat(5, minmax(0, 1fr))', gap: 8, alignItems: 'center' }}>
                              <input value={record.title} onChange={(event) => updateRecord(activeDatabase.id, record.id, { title: event.target.value })} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12, fontWeight: 700 }} />
                              <select value={record.status} onChange={(event) => updateRecord(activeDatabase.id, record.id, { status: event.target.value as OrganizerTaskStatus })} style={{ background: '#151515', color: taskStatusColor(record.status), border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }}>
                                <option value="todo">Нужно сделать</option>
                                <option value="in_progress">В работе</option>
                                <option value="done">Готово</option>
                              </select>
                              <input type="date" value={record.date ? dateOnly(record.date) : ''} onChange={(event) => updateRecord(activeDatabase.id, record.id, { date: parseDateInput(event.target.value) })} style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }} />
                              <input value={record.tags.join(', ')} onChange={(event) => updateRecord(activeDatabase.id, record.id, { tags: uniqueStrings(event.target.value.split(',')) })} style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }} />
                              <select value={record.priority} onChange={(event) => updateRecord(activeDatabase.id, record.id, { priority: event.target.value as OrganizerDatabaseRecord['priority'] })} style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }}>
                                <option value="low">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                              </select>
                              <input value={record.notes} onChange={(event) => updateRecord(activeDatabase.id, record.id, { notes: event.target.value })} placeholder="Заметка" style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Название', 'Статус', 'Дата', 'Теги', 'Приоритет', 'Страница'].map((heading) => (
                              <th key={heading} style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, color: '#666', borderBottom: '1px solid #1E1E1E' }}>{heading}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeDatabase.records.map((record) => (
                            <tr key={record.id} onClick={() => setSelectedRecordId(record.id)} style={{ cursor: 'pointer' }}>
                              <td style={{ padding: 8, borderBottom: '1px solid #1E1E1E' }}><input value={record.title} onChange={(event) => updateRecord(activeDatabase.id, record.id, { title: event.target.value })} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#E8E8E8', fontSize: 12 }} /></td>
                              <td style={{ padding: 8, borderBottom: '1px solid #1E1E1E' }}><select value={record.status} onChange={(event) => updateRecord(activeDatabase.id, record.id, { status: event.target.value as OrganizerTaskStatus })} style={{ width: '100%', background: '#151515', color: taskStatusColor(record.status), border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }}><option value="todo">Нужно сделать</option><option value="in_progress">В работе</option><option value="done">Готово</option></select></td>
                              <td style={{ padding: 8, borderBottom: '1px solid #1E1E1E' }}><input type="date" value={record.date ? dateOnly(record.date) : ''} onChange={(event) => updateRecord(activeDatabase.id, record.id, { date: parseDateInput(event.target.value) })} style={{ width: '100%', background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }} /></td>
                              <td style={{ padding: 8, borderBottom: '1px solid #1E1E1E' }}><input value={record.tags.join(', ')} onChange={(event) => updateRecord(activeDatabase.id, record.id, { tags: uniqueStrings(event.target.value.split(',')) })} style={{ width: '100%', background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }} /></td>
                              <td style={{ padding: 8, borderBottom: '1px solid #1E1E1E' }}><select value={record.priority} onChange={(event) => updateRecord(activeDatabase.id, record.id, { priority: event.target.value as OrganizerDatabaseRecord['priority'] })} style={{ width: '100%', background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 8, padding: '4px 6px', fontSize: 10 }}><option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option></select></td>
                              <td style={{ padding: 8, borderBottom: '1px solid #1E1E1E', color: '#666', fontSize: 11 }}>{record.pageId ? pageIndex.get(record.pageId)?.title ?? '—' : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeDatabase && activeRecord && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 16 }}>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Запись базы</p>
                    <p style={{ margin: '6px 0 0', color: '#666', fontSize: 12 }}>
                      Выберите запись в таблице, списке или доске и редактируйте свойства справа.
                    </p>
                    <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: '#666', fontSize: 11 }}>Название</span>
                        <input
                          value={activeRecord.title}
                          onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { title: event.target.value })}
                          style={{ background: '#151515', color: '#F1F1F1', border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 13, fontWeight: 700 }}
                        />
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                        <label style={{ display: 'grid', gap: 6 }}>
                          <span style={{ color: '#666', fontSize: 11 }}>Статус</span>
                          <select
                            value={activeRecord.status}
                            onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { status: event.target.value as OrganizerTaskStatus })}
                            style={{ background: '#151515', color: taskStatusColor(activeRecord.status), border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 12 }}
                          >
                            <option value="todo">Нужно сделать</option>
                            <option value="in_progress">В работе</option>
                            <option value="done">Готово</option>
                          </select>
                        </label>

                        <label style={{ display: 'grid', gap: 6 }}>
                          <span style={{ color: '#666', fontSize: 11 }}>Приоритет</span>
                          <select
                            value={activeRecord.priority}
                            onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { priority: event.target.value as OrganizerDatabaseRecord['priority'] })}
                            style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 12 }}
                          >
                            <option value="low">Низкий</option>
                            <option value="medium">Средний</option>
                            <option value="high">Высокий</option>
                          </select>
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                        <label style={{ display: 'grid', gap: 6 }}>
                          <span style={{ color: '#666', fontSize: 11 }}>Дата</span>
                          <input
                            type="date"
                            value={activeRecord.date ? dateOnly(activeRecord.date) : ''}
                            onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { date: parseDateInput(event.target.value) })}
                            style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 12 }}
                          />
                        </label>

                        <label style={{ display: 'grid', gap: 6 }}>
                          <span style={{ color: '#666', fontSize: 11 }}>Страница</span>
                          <select
                            value={activeRecord.pageId ?? ''}
                            onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { pageId: event.target.value || null })}
                            style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 12 }}
                          >
                            <option value="">Без страницы</option>
                            {state?.pages.map((page) => (
                              <option key={page.id} value={page.id}>
                                {page.title}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: '#666', fontSize: 11 }}>Теги</span>
                        <input
                          value={activeRecord.tags.join(', ')}
                          onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { tags: uniqueStrings(event.target.value.split(',')) })}
                          placeholder="например: маркетинг, срочно"
                          style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 12 }}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: '#666', fontSize: 11 }}>Связанные записи</span>
                        <select
                          defaultValue=""
                          onChange={(event) => {
                            const nextId = event.target.value
                            if (!nextId) return
                            updateRecord(activeDatabase.id, activeRecord.id, {
                              relatedRecordIds: uniqueStrings([...activeRecord.relatedRecordIds, nextId]),
                            })
                            event.currentTarget.value = ''
                          }}
                          style={{ background: '#151515', color: '#D8D8D8', border: '1px solid #252525', borderRadius: 10, padding: '9px 10px', fontSize: 12 }}
                        >
                          <option value="">Добавить связь</option>
                          {activeDatabase.records
                            .filter((record) => record.id !== activeRecord.id && !activeRecord.relatedRecordIds.includes(record.id))
                            .map((record) => (
                              <option key={record.id} value={record.id}>
                                {record.title}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: 6 }}>
                        <span style={{ color: '#666', fontSize: 11 }}>Заметка</span>
                        <textarea
                          value={activeRecord.notes}
                          onChange={(event) => updateRecord(activeDatabase.id, activeRecord.id, { notes: event.target.value })}
                          rows={6}
                          style={{ resize: 'vertical', background: '#151515', color: '#E8E8E8', border: '1px solid #252525', borderRadius: 10, padding: '10px 12px', fontSize: 12, lineHeight: 1.6 }}
                        />
                      </label>
                    </div>
                  </div>

                  <aside style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Свойства</p>
                    <div style={{ display: 'grid', gap: 8, marginTop: 10, color: '#666', fontSize: 12 }}>
                      <div>ID: {activeRecord.id}</div>
                      <div>Статус: {taskStatusLabel(activeRecord.status)}</div>
                      <div>Приоритет: {pagePriorityLabel(activeRecord.priority)}</div>
                      <div>Связей: {activeRecord.relatedRecordIds.length}</div>
                      <div>Тегов: {activeRecord.tags.length}</div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

          {activeView === 'relations' && activePage && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 16 }}>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F1F1F1' }}>Связи и система страниц</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666' }}>Избранное, архив, шаблоны, теги и связи.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <button type="button" onClick={() => togglePageFlag(activePage.id, 'favorite')} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #2A2A2A', background: activePage.favorite ? '#2A1F32' : '#161616', color: activePage.favorite ? '#f9a8d4' : '#D8D8D8', cursor: 'pointer' }}>
                    <Star size={13} style={{ display: 'inline', marginRight: 6 }} />
                    {activePage.favorite ? 'В избранном' : 'В избранное'}
                  </button>
                  <button type="button" onClick={() => togglePageFlag(activePage.id, 'archived')} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #2A2A2A', background: activePage.archived ? '#2A251B' : '#161616', color: activePage.archived ? '#fbbf24' : '#D8D8D8', cursor: 'pointer' }}>
                    <Archive size={13} style={{ display: 'inline', marginRight: 6 }} />
                    {activePage.archived ? 'В архиве' : 'Архивировать'}
                  </button>
                  <button type="button" onClick={() => togglePageFlag(activePage.id, 'isTemplate')} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #2A2A2A', background: activePage.isTemplate ? '#13261c' : '#161616', color: activePage.isTemplate ? '#34d399' : '#D8D8D8', cursor: 'pointer' }}>
                    Шаблон
                  </button>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ color: '#B8B8B8', fontSize: 12 }}>Теги</strong>
                    <button type="button" onClick={() => void updatePageTags(activePage.id)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                      Изменить
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {activePage.tags.length === 0 ? (
                      <span style={{ color: '#666', fontSize: 12 }}>Тегов пока нет.</span>
                    ) : activePage.tags.map((tag) => (
                      <span key={tag} style={{ padding: '4px 8px', borderRadius: 999, background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--foreground)', fontSize: 11 }}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ color: '#B8B8B8', fontSize: 12 }}>Связи</strong>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => void addPageRelation(activePage.id, 'page')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                        + Страница
                      </button>
                      <button type="button" onClick={() => void addPageRelation(activePage.id, 'task')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                        + Задача
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    <div style={{ color: '#666', fontSize: 12 }}>Связанные страницы: {activePage.relatedPageIds.length}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>Связанные задачи: {activePage.relatedTaskIds.length}</div>
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ color: '#B8B8B8', fontSize: 12 }}>Вложения</strong>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => void addPageAttachment(activePage.id, 'link')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                        <Link2 size={12} style={{ display: 'inline', marginRight: 6 }} />
                        Ссылка
                      </button>
                      <button type="button" onClick={() => void addPageAttachment(activePage.id, 'file')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                        Файл
                      </button>
                      <button type="button" onClick={() => void addPageAttachment(activePage.id, 'image')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                        Картинка
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {activePage.attachments.length === 0 ? (
                      <div style={{ color: '#666', fontSize: 12 }}>Пока нет вложений.</div>
                    ) : activePage.attachments.map((attachment) => (
                      <div key={attachment.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#E8E8E8', fontSize: 12, fontWeight: 700 }}>{attachment.title}</div>
                          <div style={{ color: '#666', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.url}</div>
                        </div>
                        <span style={{ color: '#666', fontSize: 11 }}>{attachment.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 18 }}>
                  <strong style={{ color: '#B8B8B8', fontSize: 12 }}>История</strong>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                    {activePage.history.length === 0 ? (
                      <div style={{ color: '#666', fontSize: 12 }}>История пока пуста.</div>
                    ) : activePage.history.map((revision) => (
                      <div key={revision.id} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <strong style={{ color: '#E8E8E8', fontSize: 12 }}>{revision.note}</strong>
                          <span style={{ color: '#666', fontSize: 11 }}>{formatDate(revision.updatedAt)}</span>
                        </div>
                        <div style={{ marginTop: 6, color: '#666', fontSize: 11 }}>{revision.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#B8B8B8' }}>Сводка</p>
                  <div style={{ display: 'grid', gap: 8, marginTop: 10, color: '#666', fontSize: 12 }}>
                    <div>Связанные страницы: {activePage.relatedPageIds.length}</div>
                    <div>Связанные задачи: {activePage.relatedTaskIds.length}</div>
                    <div>Вложений: {activePage.attachments.length}</div>
                    <div>Теги: {activePage.tags.length}</div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {activeView === 'search' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#F1F1F1' }}>Поиск и фильтрация</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666' }}>Ищем по страницам, задачам и записям баз.</p>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {search.trim() ? (
                  <>
                    {(state?.pages ?? []).filter((page) => pageSearchText(page).includes(search.trim().toLowerCase())).map((page) => (
                      <div key={page.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                        <div style={{ color: '#7CC0FF', fontWeight: 700 }}>{page.title}</div>
                        <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{page.content}</div>
                      </div>
                    ))}
                    {filteredTasks.map((task) => (
                      <div key={task.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                        <div style={{ color: '#E8E8E8', fontWeight: 700 }}>{task.title}</div>
                        <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{taskStatusLabel(task.status)} · {task.priority}</div>
                      </div>
                    ))}
                    {visibleDatabases.flatMap((database) => database.records.map((record) => ({ database, record }))).filter(({ record }) => `${record.title} ${record.notes} ${record.tags.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())).map(({ database, record }) => (
                      <div key={record.id} style={{ padding: 12, borderRadius: 12, border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                        <div style={{ color: '#F1F1F1', fontWeight: 700 }}>{record.title}</div>
                        <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{database.name}</div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: '#666', fontSize: 12 }}>Введите запрос в верхней строке поиска.</div>
                )}
              </div>
            </div>
          )}

          {activeView === 'content' && activePage && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16 }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F1F1F1' }}>Контент страницы</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#666' }}>Блоки, вложения и быстрые вставки для будущих таблиц и callout-блоков.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  {BLOCK_OPTIONS.map((option) => (
                    <button key={option.type} type="button" onClick={() => addBlockAfter(activePage.id, activePage.blocks[activePage.blocks.length - 1]?.id ?? null, option.type)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #2A2A2A', background: '#151515', color: '#D8D8D8', fontSize: 11, cursor: 'pointer' }}>
                      + {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 18, background: 'var(--surface-card)', padding: 16 }}>
                <strong style={{ color: '#B8B8B8', fontSize: 12 }}>Вложения</strong>
                <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                  {activePage.attachments.length === 0 ? (
                    <div style={{ color: '#666', fontSize: 12 }}>Пока нет вложений.</div>
                  ) : activePage.attachments.map((attachment) => (
                    <div key={attachment.id} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
                      <div style={{ color: '#E8E8E8', fontSize: 12, fontWeight: 700 }}>{attachment.title}</div>
                      <div style={{ color: '#666', fontSize: 11, marginTop: 4 }}>{attachment.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
