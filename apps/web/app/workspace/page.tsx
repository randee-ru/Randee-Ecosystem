'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useDialog } from '@/components/dialog'
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
  LogOut,
  User,
  Layers,
} from 'lucide-react'

type SessionUser = { id: string; email: string; name: string }

type ProjectEntry = {
  id: string
  slug: string
  name: string
  url?: string
  type: string
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
function ProjectCard({ project, onOpen, onRename, onDelete }: {
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

  const thumbSrc = project.firstPageKey
    ? `/api/builder/thumbnail/${encodeURIComponent(project.firstPageKey)}`
    : null

  const date = new Date(project.updatedAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div
      style={{ background: '#1C1C1C', border: '1px solid #2C2C2C', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2C2C2C'; e.currentTarget.style.transform = 'translateY(0)' }}
      onClick={onOpen}
    >
      <div style={{ height: 168, background: '#141414', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbSrc} alt={project.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#333' }}>
            <Globe size={28} />
            <span style={{ fontSize: 11, color: '#444' }}>Нет страниц</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 55%, rgba(28,28,28,0.75) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={10} style={{ color: '#888' }} />
          <span style={{ fontSize: 11, color: '#aaa' }}>
            {project.pageCount} {project.pageCount === 1 ? 'страница' : project.pageCount < 5 ? 'страницы' : 'страниц'}
          </span>
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#E8E8E8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#555', marginTop: 2 }}>
            {project.url ? <span style={{ color: '#4A9EFF' }}>{project.url}</span> : <span>обновлён {date}</span>}
          </p>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button type="button"
            style={{ width: 28, height: 28, borderRadius: 6, background: menuOpen ? '#2E2E2E' : 'transparent', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.1s, color 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2E2E2E'; e.currentTarget.style.color = '#E8E8E8' }}
            onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' } }}
            onClick={() => setMenuOpen(v => !v)}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: '#1E1E1E', border: '1px solid #303030', borderRadius: 10, padding: 4, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 50 }}>
              {[
                { icon: ExternalLink, label: 'Открыть проект', action: onOpen },
                { icon: Pencil, label: 'Переименовать', action: onRename },
                { icon: Trash2, label: 'Удалить проект', action: onDelete, danger: true },
              ].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: danger ? '#ef4444' : '#C8C8C8', textAlign: 'left' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2A2A2A' }}
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

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function WorkspacePage() {
  const router = useRouter()
  const { prompt, confirm, Dialog } = useDialog()
  const [projects, setProjects] = React.useState<ProjectEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [sortBy, setSortBy] = React.useState<'name' | 'date'>('date')
  const [sortOpen, setSortOpen] = React.useState(false)
  const sortRef = React.useRef<HTMLDivElement>(null)
  const [currentUser, setCurrentUser] = React.useState<SessionUser | null>(null)

  const loadProjects = React.useCallback(() => {
    setLoading(true)
    void fetch('/api/builder/projects')
      .then(r => r.ok ? r.json() : { projects: [] })
      .then((data: { projects?: ProjectEntry[] }) => setProjects(data.projects ?? []))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { loadProjects() }, [loadProjects])

  React.useEffect(() => {
    void fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((data: { ok: boolean; user?: SessionUser } | null) => {
        if (data?.ok && data.user) setCurrentUser(data.user)
      })
  }, [])

  React.useEffect(() => {
    if (!sortOpen) return
    const onClick = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [sortOpen])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = q ? projects.filter(p => p.name.toLowerCase().includes(q) || (p.url ?? '').toLowerCase().includes(q)) : projects
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    if (sortBy === 'date') list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return list
  }, [projects, search, sortBy])

  const createProject = async () => {
    const name = await prompt('Название нового проекта', 'Мой проект')
    if (!name?.trim()) return
    const url = (await prompt('URL сайта (необязательно, напр. mysite.ru)', '')) ?? ''
    try {
      const res = await fetch('/api/builder/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim() || undefined, type: 'site' }),
      })
      const data = (await res.json()) as { ok: boolean; project?: { slug: string } }
      if (data.ok && data.project) {
        router.push(`/workspace/${data.project.slug}`)
      }
    } catch { /* ignore */ }
  }

  const renameProject = async (project: ProjectEntry) => {
    const name = await prompt('Новое название', project.name)
    if (!name?.trim() || name.trim() === project.name) return
    await fetch(`/api/builder/projects/${project.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    loadProjects()
  }

  const deleteProject = async (project: ProjectEntry) => {
    if (!(await confirm(`Удалить «${project.name}»?`))) return
    await fetch(`/api/builder/projects/${project.slug}`, { method: 'DELETE' })
    loadProjects()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#111', color: '#E8E8E8', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {Dialog}

      {/* ── Левая панель ── */}
      <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid #1E1E1E', display: 'flex', flexDirection: 'column', padding: '12px 0' }}>

        {/* Логотип */}
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..."
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#E8E8E8', width: '100%' }} />
          </div>
        </div>

        {/* Навигация */}
        <nav style={{ padding: '0 8px', flex: 1, overflow: 'auto' }}>
          {/* Заголовок Проекты */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 2 }}>
            <Layers size={13} style={{ color: '#4A9EFF', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#4A9EFF', fontWeight: 600, flex: 1 }}>Проекты</span>
            <span style={{ fontSize: 10, color: '#4A9EFF' }}>{projects.length}</span>
          </div>

          <div style={{ borderTop: '1px solid #1E1E1E', margin: '4px 0 8px' }} />

          {/* Список проектов */}
          <p style={{ fontSize: 10, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px 6px' }}>
            Все проекты
          </p>
          {projects.map(p => (
            <button key={p.id} type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 8px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#666', marginBottom: 1, textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#E8E8E8' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }}
              onClick={() => router.push(`/workspace/${p.slug}`)}
            >
              <Globe size={12} style={{ flexShrink: 0, color: '#444' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            </button>
          ))}

          <div style={{ borderTop: '1px solid #1E1E1E', margin: '8px 0' }} />

          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#555' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#E8E8E8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            onClick={() => void createProject()}
          >
            <Plus size={13} />
            Новый проект...
          </button>
        </nav>

        {/* Открыть билдер */}
        <div style={{ padding: '8px 12px', borderTop: '1px solid #1E1E1E' }}>
          <button type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 8px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#555' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#888' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            onClick={() => router.push('/builder')}
          >
            <FolderOpen size={13} />
            Открыть билдер
          </button>
        </div>

        {/* Пользователь */}
        {currentUser && (
          <div style={{ padding: '8px 12px', borderTop: '1px solid #1E1E1E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px 6px' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#6366F1,#0099FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={13} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#C8C8C8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.email}</p>
              </div>
            </div>
            <button type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '5px 8px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: '#555' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1C1C1C'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
              onClick={() => void logout()}
            >
              <LogOut size={13} />
              Выйти
            </button>
          </div>
        )}
      </aside>

      {/* ── Основная область ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #1E1E1E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} style={{ color: '#4A9EFF' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#E8E8E8' }}>Проекты</span>
            {projects.length > 0 && (
              <span style={{ fontSize: 11, color: '#444', background: '#1A1A1A', borderRadius: 5, padding: '1px 7px', border: '1px solid #2A2A2A' }}>
                {projects.length}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Сортировка */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button type="button"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: '#1C1C1C', border: '1px solid #2C2C2C', color: '#999', fontSize: 12, cursor: 'pointer' }}
                onClick={() => setSortOpen(v => !v)}
              >
                {sortBy === 'name' ? 'По названию' : 'По дате'}
                <ChevronDown size={11} />
              </button>
              {sortOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#1E1E1E', border: '1px solid #303030', borderRadius: 10, padding: 4, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 50 }}>
                  {[{ id: 'date', label: 'По дате' }, { id: 'name', label: 'По названию' }].map(opt => (
                    <button key={opt.id} type="button"
                      style={{ display: 'block', width: '100%', padding: '7px 10px', background: sortBy === opt.id ? '#2A2A2A' : 'transparent', border: 'none', borderRadius: 7, fontSize: 12, color: '#C8C8C8', cursor: 'pointer', textAlign: 'left' }}
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

            {/* Кнопка создания */}
            <button type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: '#0099FF', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              onClick={() => void createProject()}
            >
              <Plus size={13} />
              Новый проект
            </button>
          </div>
        </div>

        {/* Сетка карточек */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#555', fontSize: 13 }}>Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
              <Layers size={48} style={{ opacity: 0.1, color: '#E8E8E8' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#555' }}>
                  {search ? 'Ничего не найдено' : 'Нет проектов'}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#3A3A3A' }}>
                  {search ? 'Попробуйте другой запрос' : 'Создайте первый проект'}
                </p>
              </div>
              {!search && (
                <button type="button"
                  style={{ padding: '8px 20px', background: '#0099FF', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => void createProject()}
                >
                  + Создать проект
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
              {filtered.map(project => (
                <ProjectCard key={project.id} project={project}
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
