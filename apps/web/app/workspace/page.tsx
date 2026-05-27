'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Globe,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  ChevronDown,
  FolderOpen,
  FileText,
  Pencil,
} from 'lucide-react'

type ProjectEntry = {
  id: string
  slug: string
  name: string
  url?: string
  createdAt: string
  updatedAt: string
  pageCount: number
  firstPageKey: string | null
}

// ── Логотип ───────────────────────────────────────────────────────────────────
function RandeeLogo() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: 'linear-gradient(135deg,#0099FF,#6366F1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '-0.5px' }}>R</span>
    </div>
  )
}

// ── Карточка проекта ──────────────────────────────────────────────────────────
function SiteCard({
  project,
  onOpen,
  onRename,
  onDelete,
}: {
  project: ProjectEntry
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  // Скриншот через thumbnail API
  const thumbSrc = project.firstPageKey
    ? `/api/builder/thumbnail/${encodeURIComponent(project.firstPageKey)}`
    : null

  const date = new Date(project.updatedAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      style={{
        background: '#1C1C1C',
        border: '1px solid #2C2C2C',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#444'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#2C2C2C'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div style={{
        height: 168,
        background: '#141414',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt={project.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 8, color: '#333',
          }}>
            <Globe size={28} />
            <span style={{ fontSize: 11, color: '#444' }}>Нет страниц</span>
          </div>
        )}
        {/* Градиент снизу */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 55%, rgba(28,28,28,0.75) 100%)',
          pointerEvents: 'none',
        }} />
        {/* Бейдж кол-во страниц */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          borderRadius: 6,
          padding: '3px 8px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <FileText size={10} style={{ color: '#888' }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>
            {project.pageCount} {project.pageCount === 1 ? 'страница' : project.pageCount < 5 ? 'страницы' : 'страниц'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#E8E8E8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {project.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#555', marginTop: 2 }}>
            {project.url ? (
              <span style={{ color: '#4A9EFF' }}>{project.url}</span>
            ) : (
              <span>обновлён {date}</span>
            )}
          </p>
        </div>

        {/* Меню ⋯ */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: menuOpen ? '#2E2E2E' : 'transparent',
              border: 'none', cursor: 'pointer', color: '#555',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2E2E2E'; e.currentTarget.style.color = '#E8E8E8' }}
            onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' } }}
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
              background: '#1E1E1E', border: '1px solid #303030',
              borderRadius: 10, padding: 4, minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 50,
            }}>
              {[
                { icon: ExternalLink, label: 'Открыть проект', action: onOpen },
                { icon: Pencil, label: 'Переименовать', action: onRename },
                { icon: Trash2, label: 'Удалить проект', action: onDelete, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '7px 10px',
                    background: 'transparent', border: 'none',
                    borderRadius: 7, cursor: 'pointer',
                    fontSize: 12, color: danger ? '#ef4444' : '#C8C8C8',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2A2A2A' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { setMenuOpen(false); action() }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const router = useRouter()
  const [projects, setProjects] = React.useState<ProjectEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'name' | 'date'>('date')
  const [sortOpen, setSortOpen] = React.useState(false)
  const sortRef = React.useRef<HTMLDivElement>(null)

  // Загрузка списка проектов
  const loadProjects = React.useCallback(() => {
    setLoading(true)
    void fetch('/api/builder/projects')
      .then(r => r.ok ? r.json() : { projects: [] })
      .then((data: { projects?: ProjectEntry[] }) => {
        setProjects(data.projects ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { loadProjects() }, [loadProjects])

  // Закрытие sort-меню
  React.useEffect(() => {
    if (!sortOpen) return
    const onClick = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [sortOpen])

  // Фильтр + сортировка
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q
      ? projects.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.url ?? '').toLowerCase().includes(q),
        )
      : projects
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    if (sortBy === 'date') list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return list
  }, [projects, search, sortBy])

  // Создать новый проект
  const createProject = async () => {
    const name = window.prompt('Название нового сайта/проекта', 'Мой сайт')
    if (!name?.trim()) return
    const url = window.prompt('URL сайта (необязательно, напр. mysite.ru)', '') ?? ''
    try {
      const res = await fetch('/api/builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim() || undefined }),
      })
      const data = (await res.json()) as { ok: boolean; project?: { slug: string } }
      if (data.ok && data.project) {
        router.push(`/workspace/${data.project.slug}`)
      }
    } catch { /* ignore */ }
  }

  // Переименовать проект
  const renameProject = async (project: ProjectEntry) => {
    const name = window.prompt('Новое название', project.name)
    if (!name?.trim() || name.trim() === project.name) return
    await fetch(`/api/builder/projects/${project.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    loadProjects()
  }

  // Удалить проект
  const deleteProject = async (project: ProjectEntry) => {
    if (!window.confirm(`Удалить проект «${project.name}»?\n\nСтраницы не удаляются, просто отвязываются от проекта.`)) return
    await fetch(`/api/builder/projects/${project.slug}`, { method: 'DELETE' })
    loadProjects()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#111', color: '#E8E8E8', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>

      {/* ── Левая панель ── */}
      <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid #1E1E1E', display: 'flex', flexDirection: 'column', padding: '12px 0' }}>

        {/* Заголовок workspace */}
        <div style={{ padding: '4px 12px 12px', borderBottom: '1px solid #1E1E1E', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px' }}>
            <RandeeLogo />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#E8E8E8' }}>Randee</p>
              <p style={{ margin: 0, fontSize: 10, color: '#555' }}>Workspace</p>
            </div>
          </div>
        </div>

        {/* Поиск */}
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1C1C1C', borderRadius: 8, padding: '6px 10px', border: '1px solid #2C2C2C' }}>
            <Search size={12} style={{ color: '#555', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#E8E8E8', width: '100%' }}
            />
          </div>
        </div>

        {/* Навигация */}
        <nav style={{ padding: '0 8px', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 6px' }}>
            Сайты
          </p>

          {/* Список проектов в сайдбаре */}
          {projects.map(p => (
            <button
              key={p.id}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '5px 8px', borderRadius: 7,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 12, color: '#888', marginBottom: 1,
                textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#E8E8E8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' }}
              onClick={() => router.push(`/workspace/${p.slug}`)}
            >
              <Globe size={12} style={{ flexShrink: 0, color: '#555' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#444' }}>{p.pageCount}</span>
            </button>
          ))}

          <div style={{ borderTop: '1px solid #1E1E1E', margin: '8px 0' }} />

          {/* Кнопка "Новый сайт" */}
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 8px', borderRadius: 7,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#555',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#E8E8E8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            onClick={() => void createProject()}
          >
            <Plus size={13} />
            Новый сайт...
          </button>
        </nav>

        {/* Ссылка на билдер */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1E1E1E' }}>
          <button
            type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, width: '100%',
              padding: '6px 8px', borderRadius: 7,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#555',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            onClick={() => router.push('/builder')}
          >
            <FolderOpen size={13} />
            Открыть билдер
          </button>
        </div>
      </aside>

      {/* ── Основная область ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid #1E1E1E',
        }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E8E8E8' }}>
            Мои сайты
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Сортировка */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  background: '#1C1C1C', border: '1px solid #2C2C2C',
                  color: '#999', fontSize: 12, cursor: 'pointer',
                }}
                onClick={() => setSortOpen(v => !v)}
              >
                {sortBy === 'name' ? 'По названию' : 'По дате'}
                <ChevronDown size={11} />
              </button>
              {sortOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: '#1E1E1E', border: '1px solid #303030',
                  borderRadius: 10, padding: 4, minWidth: 140,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50,
                }}>
                  {[{ id: 'date', label: 'По дате' }, { id: 'name', label: 'По названию' }].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      style={{
                        display: 'block', width: '100%', padding: '7px 10px',
                        background: sortBy === opt.id ? '#2A2A2A' : 'transparent',
                        border: 'none', borderRadius: 7,
                        fontSize: 12, color: '#C8C8C8', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2A2A2A' }}
                      onMouseLeave={e => { e.currentTarget.style.background = sortBy === opt.id ? '#2A2A2A' : 'transparent' }}
                      onClick={() => { setSortBy(opt.id as 'name' | 'date'); setSortOpen(false) }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Создать сайт */}
            <button
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8,
                background: '#0099FF', border: 'none',
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#33AAFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0099FF' }}
              onClick={() => void createProject()}
            >
              <Plus size={13} />
              Новый сайт
            </button>
          </div>
        </div>

        {/* Сетка карточек */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#555', fontSize: 13 }}>
              Загрузка...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16, color: '#555' }}>
              <Globe size={48} style={{ opacity: 0.15 }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#666' }}>
                  {search ? 'Ничего не найдено' : 'Нет сайтов'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#444' }}>
                  {search ? 'Попробуйте другой запрос' : 'Создайте первый проект-сайт'}
                </p>
              </div>
              {!search && (
                <button
                  type="button"
                  style={{ padding: '8px 20px', background: '#0099FF', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => void createProject()}
                >
                  + Создать сайт
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {filtered.map(project => (
                <SiteCard
                  key={project.id}
                  project={project}
                  onOpen={() => router.push(`/workspace/${project.slug}`)}
                  onRename={() => void renameProject(project)}
                  onDelete={() => void deleteProject(project)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
