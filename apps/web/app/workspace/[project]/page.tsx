'use client'

import * as React from 'react'
import { usePathname, useRouter, useParams, useSearchParams } from 'next/navigation'
import { useDialog } from '@/components/dialog'
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Globe,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  ChevronDown,
  LayoutGrid,
  Pencil,
  BarChart2,
  Inbox,
  FolderOpen,
  FileText,
  Construction,
  Settings,
  Palette,
  Frame,
} from 'lucide-react'
import { OrganizerPanel } from './organizer-panel'
import { ThemeToggle } from '@/components/theme-toggle'

type PageEntry = {
  slug: string
  page: string
  pageKey: string
  projectId?: string
}

type Project = {
  id: string
  slug: string
  name: string
  url?: string
  createdAt: string
  updatedAt: string
}

type Section = 'site' | 'design' | 'crm' | 'organizer' | 'metrics' | 'files'

const SECTION_VALUES: Section[] = ['site', 'design', 'crm', 'organizer', 'metrics', 'files']

function parseSection(value: string | null): Section {
  return SECTION_VALUES.includes(value as Section) ? (value as Section) : 'site'
}

// ── Логотип ───────────────────────────────────────────────────────────────────
function ProjectAvatar({ name }: { name: string }) {
  const letter = name.trim()[0]?.toUpperCase() ?? 'P'
  const colors = [
    ['#0099FF', '#6366F1'],
    ['#10B981', '#059669'],
    ['#F59E0B', '#EF4444'],
    ['#8B5CF6', '#EC4899'],
  ]
  const pair = colors[name.charCodeAt(0) % colors.length]!
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 9,
      background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#fff',
    }}>
      {letter}
    </div>
  )
}

// ── Карточка страницы ─────────────────────────────────────────────────────────
function PageCard({
  entry, onOpen, onPreview, onDuplicate, onDelete, onDetach,
}: {
  entry: PageEntry
  onOpen: () => void; onPreview: () => void
  onDuplicate: () => void; onDelete: () => void; onDetach: () => void
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--surface-hover)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
      onClick={onOpen}
    >
      <div style={{ height: 160, background: 'var(--surface-subtle)', position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/builder/thumbnail/${encodeURIComponent(entry.pageKey)}`}
          alt={entry.page}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
        {entry.slug === '/' && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent-soft)', border: '1px solid rgb(0 153 255 / 0.3)', borderRadius: 5, padding: '2px 7px', fontSize: 10, color: 'var(--accent)' }}>
            Главная
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.page}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{entry.slug}</p>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button type="button"
            style={{ width: 28, height: 28, borderRadius: 6, background: menuOpen ? 'var(--surface-hover)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--foreground)' }}
            onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 4, minWidth: 170, boxShadow: '0 8px 32px rgb(0 0 0 / 0.18)', zIndex: 50 }}>
              {[
                { icon: ExternalLink, label: 'Открыть в билдере', action: onOpen },
                { icon: Globe, label: 'Предпросмотр', action: onPreview },
                { icon: Copy, label: 'Дублировать', action: onDuplicate },
                { icon: LayoutGrid, label: 'Отвязать от проекта', action: onDetach },
                { icon: Trash2, label: 'Удалить страницу', action: onDelete, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: danger ? 'var(--danger)' : 'var(--foreground)', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { setMenuOpen(false); action() }}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Заглушка для разделов в разработке ───────────────────────────────────────
function ComingSoon({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--text-muted)', textAlign: 'center', padding: 48 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{title}</p>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.6 }}>{description}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <Construction size={12} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>В разработке</span>
      </div>
    </div>
  )
}

// ── Навигация проекта ─────────────────────────────────────────────────────────
const NAV_ITEMS: Array<{ id: Section; icon: React.ElementType; label: string; badge?: string }> = [
  { id: 'site',    icon: Globe,     label: 'Сайт' },
  { id: 'design',  icon: Palette,   label: 'Дизайн',  badge: 'Скоро' },
  { id: 'crm',     icon: Inbox,     label: 'CRM',     badge: 'Скоро' },
  { id: 'organizer', icon: FileText, label: 'Органайзер' },
  { id: 'metrics', icon: BarChart2, label: 'Метрика', badge: 'Скоро' },
  { id: 'files',   icon: FolderOpen, label: 'Файлы',  badge: 'Скоро' },
]

type DesignFileEntry = { id: string; name: string; updatedAt: string }

// ── Список дизайн-файлов ──────────────────────────────────────────────────────
function DesignFileList({ projectSlug, projectId }: { projectSlug: string; projectId: string }) {
  const router = useRouter()
  const { prompt, confirm, Dialog } = useDialog()
  const [files, setFiles] = React.useState<DesignFileEntry[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    void fetch(`/api/builder/projects/${encodeURIComponent(projectSlug)}/design-files`)
      .then(r => r.ok ? r.json() : { files: [] })
      .then((d: { files?: DesignFileEntry[] }) => setFiles(d.files ?? []))
      .finally(() => setLoading(false))
  }, [projectSlug])

  React.useEffect(() => { load() }, [load])

  const createFile = async () => {
    const name = await prompt('Название дизайн-файла', 'Untitled')
    if (!name?.trim()) return
    const res = await fetch(`/api/builder/projects/${encodeURIComponent(projectSlug)}/design-files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    const data = (await res.json()) as { ok: boolean; file?: DesignFileEntry }
    if (data.ok && data.file) router.push(`/workspace/${projectSlug}/design/${data.file.id}`)
  }

  const deleteFile = async (id: string, name: string) => {
    if (!(await confirm(`Удалить файл «${name}»?`))) return
    await fetch(`/api/design/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Загрузка...</div>

  return (
    <div style={{ padding: 24 }}>
      {Dialog}
      {files.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 16, color: 'var(--text-muted)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Frame size={28} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>Нет дизайн-файлов</p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>Создайте первый макет для этого проекта</p>
          </div>
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => void createFile()}
          >
            <Plus size={14} /> Создать дизайн-файл
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => void createFile()}
            >
              <Plus size={12} /> Новый файл
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {files.map(f => {
              const date = new Date(f.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
              const colors = ['#8B5CF6', '#0099FF', '#EC4899', '#F59E0B', '#10B981']
              const accent = colors[f.name.charCodeAt(0) % colors.length]!
              return (
                <div key={f.id}
                  style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--surface-hover)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  onClick={() => router.push(`/workspace/${projectSlug}/design/${f.id}`)}
                >
                  <div style={{ height: 120, background: 'var(--surface-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 16 }}>
                      {[0.8, 0.4, 0.6, 0.3].map((op, i) => (
                        <div key={i} style={{ borderRadius: 4, background: accent, opacity: op, height: i % 2 === 0 ? 36 : 24 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{date}</p>
                    </div>
                    <button type="button"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4 }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                      onClick={e => { e.stopPropagation(); void deleteFile(f.id, f.name) }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function ProjectPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams<{ project: string }>()
  const projectSlug = params.project
  const { prompt, confirm, Dialog } = useDialog()

  const [project, setProject] = React.useState<Project | null>(null)
  const [pages, setPages] = React.useState<PageEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'name' | 'slug'>('name')
  const [sortOpen, setSortOpen] = React.useState(false)
  const sortRef = React.useRef<HTMLDivElement>(null)
  const activeSection = React.useMemo(() => parseSection(searchParams.get('section')), [searchParams])

  const setActiveSection = React.useCallback((section: Section) => {
    const current = new URLSearchParams(searchParams.toString())
    if (current.get('section') === section) return
    current.set('section', section)
    router.replace(`${pathname}?${current.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

  const load = React.useCallback(() => {
    setLoading(true)
    void fetch(`/api/builder/projects/${encodeURIComponent(projectSlug)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { ok: boolean; project?: Project; pages?: PageEntry[] } | null) => {
        if (!data?.ok) { router.replace('/workspace'); return }
        setProject(data.project ?? null)
        setPages(data.pages ?? [])
      })
      .finally(() => setLoading(false))
  }, [projectSlug, router])

  React.useEffect(() => { load() }, [load])

  React.useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q ? pages.filter(p => p.page.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)) : pages
    if (sortBy === 'name') list = [...list].sort((a, b) => a.page.localeCompare(b.page, 'ru'))
    if (sortBy === 'slug') list = [...list].sort((a, b) => a.slug.localeCompare(b.slug, 'ru'))
    return list
  }, [pages, search, sortBy])

  const openInBuilder = (entry: PageEntry) => router.push(`/builder?slug=${encodeURIComponent(entry.pageKey)}`)
  const openPreview = (entry: PageEntry) => window.open(`/preview/${encodeURIComponent(entry.pageKey)}`, '_blank', 'noopener')

  const duplicatePage = async (entry: PageEntry) => {
    const copyKey = entry.pageKey + '-copy'
    const src = await fetch(`/api/builder/pages/${encodeURIComponent(entry.pageKey)}`).then(r => r.ok ? r.json() : null)
    if (!src || !project) return
    await fetch(`/api/builder/pages/${encodeURIComponent(copyKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...src, page: entry.page + ' Copy', slug: '/' + copyKey }) })
    await fetch('/api/builder/page-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: copyKey, projectId: project.id }) })
    load()
  }

  const detachPage = async (entry: PageEntry) => {
    if (!(await confirm(`Отвязать «${entry.page}» от проекта? Страница не удалится.`))) return
    await fetch('/api/builder/page-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: entry.pageKey, projectId: null }) })
    load()
  }

  const deletePage = async (entry: PageEntry) => {
    if (!(await confirm(`Удалить страницу «${entry.page}»?`))) return
    await fetch(`/api/builder/pages/${encodeURIComponent(entry.pageKey)}`, { method: 'DELETE' })
    await fetch('/api/builder/page-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: entry.pageKey, projectId: null }) })
    load()
  }

  const createPage = async () => {
    if (!project) return
    const name = await prompt('Название новой страницы', 'Новая страница')
    if (!name?.trim()) return
    const pageKey = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9а-яё-]/gi, '').replace(/-+/g, '-') || 'page'
    await fetch(`/api/builder/pages/${encodeURIComponent(pageKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: name.trim(), slug: '/' + pageKey, seo: { title: name.trim(), description: '' }, blocks: [] }) })
    await fetch('/api/builder/page-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: pageKey, projectId: project.id }) })
    router.push(`/builder?slug=${encodeURIComponent(pageKey)}`)
  }

  const renameProject = async () => {
    if (!project) return
    const name = await prompt('Новое название', project.name)
    if (!name?.trim() || name.trim() === project.name) return
    await fetch(`/api/builder/projects/${project.slug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) })
    load()
  }

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-app)', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>Загрузка...</div>
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--surface-app)', color: 'var(--foreground)', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {Dialog}

      {/* ── Левая панель ── */}
      <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', background: 'var(--surface-panel)' }}>

        {/* Шапка проекта */}
        <div style={{ padding: '14px 12px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          {/* Назад */}
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 10px', color: '#444', fontSize: 11 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#777' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
            onClick={() => router.push('/workspace')}
          >
            <ArrowLeft size={10} />
            Все проекты
          </button>

          {/* Название проекта */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ProjectAvatar name={project?.name ?? 'P'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#E8E8E8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project?.name}
              </p>
              {project?.url
                ? <p style={{ margin: 0, fontSize: 10, color: '#4A9EFF', marginTop: 1 }}>{project.url}</p>
                : <p style={{ margin: 0, fontSize: 10, color: '#444', marginTop: 1 }}>Нет домена</p>
              }
            </div>
            <button type="button" title="Переименовать"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#333', padding: 4, borderRadius: 4, flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#777' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#333' }}
              onClick={() => void renameProject()}
            >
              <Pencil size={11} />
            </button>
          </div>
        </div>

        {/* Навигация */}
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px 8px' }}>
            Разделы
          </p>

          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                  padding: '7px 10px', borderRadius: 8, marginBottom: 2,
                  background: isActive ? '#1E2A3A' : 'transparent',
                  border: `1px solid ${isActive ? '#1E4A7A' : 'transparent'}`,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: isActive ? '#4A9EFF' : '#888',
                  transition: 'background 0.1s, color 0.1s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#CCC' } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' } }}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ fontSize: 9, color: '#555', background: '#1C1C1C', border: '1px solid #2A2A2A', borderRadius: 4, padding: '1px 5px' }}>
                    {item.badge}
                  </span>
                )}
                {item.id === 'site' && pages.length > 0 && (
                  <span style={{ fontSize: 10, color: isActive ? '#4A9EFF' : '#444' }}>{pages.length}</span>
                )}
              </button>
            )
          })}

          <div style={{ borderTop: '1px solid #1A1A1A', margin: '10px 0' }} />

          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 10px', borderRadius: 8, background: 'transparent', border: '1px solid transparent', cursor: 'pointer', fontSize: 13, color: '#555', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
          >
            <Settings size={14} style={{ flexShrink: 0 }} />
            Настройки
          </button>
        </nav>
      </aside>

      {/* ── Основная область ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-panel)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: '#444', fontSize: 12, padding: '4px 6px', borderRadius: 6 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#777'; e.currentTarget.style.background = '#1A1A1A' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.background = 'transparent' }}
              onClick={() => router.push('/workspace')}
            >
              <ArrowLeft size={12} />
              Workspace
            </button>
            <span style={{ color: '#282828' }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8E8' }}>{project?.name}</span>
            <span style={{ color: '#282828' }}>/</span>
            <span style={{ fontSize: 13, color: '#666' }}>
              {NAV_ITEMS.find(n => n.id === activeSection)?.label}
            </span>
          </div>

          {/* Кнопки — только для раздела "Сайт" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle />

            {activeSection === 'site' && (
              <>
                <div ref={sortRef} style={{ position: 'relative' }}>
                  <button type="button"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: '#1C1C1C', border: '1px solid #2C2C2C', color: '#888', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => setSortOpen(v => !v)}
                  >
                    {sortBy === 'name' ? 'По названию' : 'По slug'}
                    <ChevronDown size={11} />
                  </button>
                  {sortOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#1E1E1E', border: '1px solid #303030', borderRadius: 10, padding: 4, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50 }}>
                      {[{ id: 'name', label: 'По названию' }, { id: 'slug', label: 'По slug' }].map(opt => (
                        <button key={opt.id} type="button"
                          style={{ display: 'block', width: '100%', padding: '7px 10px', background: sortBy === opt.id ? '#2A2A2A' : 'transparent', border: 'none', borderRadius: 7, fontSize: 12, color: '#C8C8C8', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#2A2A2A' }}
                          onMouseLeave={e => { e.currentTarget.style.background = sortBy === opt.id ? '#2A2A2A' : 'transparent' }}
                          onClick={() => { setSortBy(opt.id as 'name' | 'slug'); setSortOpen(false) }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: '#0099FF', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#33AAFF' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0099FF' }}
                  onClick={() => void createPage()}
                >
                  <Plus size={13} />
                  Новая страница
                </button>
              </>
            )}
          </div>
        </div>

        {/* Контент раздела */}
        <div style={{ flex: 1, overflow: 'auto' }}>

          {/* ── Сайт ── */}
          {activeSection === 'site' && (
            <div style={{ padding: 24 }}>
              {/* Поиск */}
              {pages.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#181818', borderRadius: 9, padding: '7px 12px', border: '1px solid #222', marginBottom: 20, maxWidth: 320 }}>
                  <Search size={12} style={{ color: '#444', flexShrink: 0 }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск страниц..."
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#E8E8E8', width: '100%' }} />
                </div>
              )}

              {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12, color: '#555' }}>
                  <FileText size={40} style={{ opacity: 0.15 }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#555' }}>{search ? 'Ничего не найдено' : 'Нет страниц'}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#3A3A3A' }}>{search ? 'Попробуйте другой запрос' : 'Создайте первую страницу для этого сайта'}</p>
                  </div>
                  {!search && (
                    <button type="button"
                      style={{ padding: '7px 16px', background: '#0099FF', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => void createPage()}
                    >
                      + Новая страница
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {filtered.map(entry => (
                    <PageCard key={entry.pageKey} entry={entry}
                      onOpen={() => openInBuilder(entry)}
                      onPreview={() => openPreview(entry)}
                      onDuplicate={() => void duplicatePage(entry)}
                      onDelete={() => void deletePage(entry)}
                      onDetach={() => void detachPage(entry)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Дизайн ── */}
          {activeSection === 'design' && project && (
            <DesignFileList projectSlug={projectSlug} projectId={project.id} />
          )}

          {/* ── CRM ── */}
          {activeSection === 'crm' && (
            <ComingSoon
              icon={Inbox}
              title="CRM — Входящие заявки"
              description="Здесь будут отображаться все заявки и обращения с сайта. Автоматическая сборка из форм, мессенджеров и почты."
            />
          )}

          {/* ── Органайзер ── */}
          {activeSection === 'organizer' && project && (
            <OrganizerPanel projectSlug={projectSlug} />
          )}

          {/* ── Метрика ── */}
          {activeSection === 'metrics' && (
            <ComingSoon
              icon={BarChart2}
              title="Метрика"
              description="Собственная аналитика: посещаемость, источники трафика, конверсии и поведение пользователей — без сторонних сервисов."
            />
          )}

          {/* ── Файлы ── */}
          {activeSection === 'files' && (
            <ComingSoon
              icon={FolderOpen}
              title="Файлы проекта"
              description="Исходники, макеты, договоры и медиафайлы проекта. Всё в одном месте, рядом с сайтом."
            />
          )}

        </div>
      </main>
    </div>
  )
}
