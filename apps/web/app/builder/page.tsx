'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  buildBuilderWebPageJsonLd,
  createBuilderStore,
  exportPageToHtml,
  exportPageToJson,
  listBlockDefinitions,
  selectedBlock,
  type PageBlock,
  type ViewportMode
} from '@randee/builder'
import { useStore } from 'zustand'
import { Cta, Faq, Features, Hero } from '@randee/ui'
import {
  Bell,
  Boxes,
  CircleUserRound,
  Code2,
  Copy,
  Download,
  FileText,
  FolderKanban,
  Grid2X2,
  GripVertical,
  Home,
  Layers3,
  LayoutDashboard,
  Monitor,
  Moon,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Settings2,
  Smartphone,
  Sparkles,
  Store,
  Sun,
  Tablet,
  Trash2,
  Wand2
} from 'lucide-react'

type UiTheme = 'light' | 'dark'

type LibraryVariant = {
  type: ReturnType<typeof listBlockDefinitions>[number]['type']
  group: string
  name: string
  template: string
  description: string
}

const libraryVariants: LibraryVariant[] = [
  { type: 'hero', group: 'Hero', name: 'Hero Classic', template: 'hero-01', description: 'Заголовок, текст и CTA' },
  { type: 'hero', group: 'Hero', name: 'Hero Split', template: 'hero-02', description: 'Текст + медиа справа' },
  { type: 'hero', group: 'Hero', name: 'Hero Product', template: 'hero-03', description: 'Для продукта или сервиса' },
  { type: 'features', group: 'Features', name: 'Feature Grid', template: 'features-01', description: 'Сетка преимуществ' },
  { type: 'features', group: 'Features', name: 'Feature Cards', template: 'features-02', description: 'Карточки с иконками' },
  { type: 'faq', group: 'FAQ', name: 'FAQ Accordion', template: 'faq-01', description: 'Классический список вопросов' },
  { type: 'cta', group: 'CTA', name: 'CTA Banner', template: 'cta-01', description: 'Финальный призыв' },
  { type: 'catalog.section', group: 'Catalog', name: 'Catalog Section', template: 'catalog-01', description: 'Bitrix catalog.section' },
  { type: 'news.list', group: 'News', name: 'News List', template: 'news-01', description: 'Bitrix news.list' }
]

const viewportClass: Record<ViewportMode, string> = {
  desktop: 'w-full',
  tablet: 'mx-auto w-[820px] max-w-full',
  mobile: 'mx-auto w-[420px] max-w-full'
}

const viewportSize: Record<ViewportMode, { width: number; label: string }> = {
  desktop: { width: 1440, label: '1440px fluid' },
  tablet: { width: 820, label: '820px' },
  mobile: { width: 420, label: '420px' }
}

const rulerMarks = Array.from({ length: 15 }, (_, index) => index * 100)

const viewportIcon: Record<ViewportMode, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function renderPreviewBlock(block: PageBlock | undefined) {
  if (!block) return null

  if (block.type === 'hero') {
    return (
      <Hero
        title={block.props.title ?? 'Hero'}
        description={block.props.description ?? ''}
        ctaText={block.props.buttonText ?? 'Подробнее'}
      />
    )
  }

  if (block.type === 'features') {
    return (
      <Features
        title={block.props.title ?? 'Features'}
        items={[
          { id: '1', title: block.props.item1 ?? 'Пункт 1', description: 'Описание' },
          { id: '2', title: block.props.item2 ?? 'Пункт 2', description: 'Описание' },
          { id: '3', title: block.props.item3 ?? 'Пункт 3', description: 'Описание' }
        ]}
      />
    )
  }

  if (block.type === 'faq') {
    return (
      <Faq
        title={block.props.title ?? 'FAQ'}
        items={[{ id: '1', question: 'Вопрос', answer: 'Ответ' }]}
      />
    )
  }

  if (block.type === 'cta') {
    return (
      <Cta
        title={block.props.title ?? 'CTA'}
        description={block.props.description ?? ''}
        buttonText={block.props.buttonText ?? 'Подробнее'}
      />
    )
  }

  return (
    <section className="rounded-[18px] border border-stone-200 bg-white p-6">
      <h3 className="text-lg font-semibold">{block.type}</h3>
      <p className="text-sm text-stone-500">Template: {block.template}</p>
    </section>
  )
}

export default function BuilderPage() {
  const [store] = React.useState(() => createBuilderStore())
  const [theme, setTheme] = React.useState<UiTheme>('light')
  const [leftOpen, setLeftOpen] = React.useState(true)
  const [rightOpen, setRightOpen] = React.useState(true)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [isReady, setIsReady] = React.useState(false)
  const [librarySearch, setLibrarySearch] = React.useState('')
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({ Hero: true })

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem('randee-builder-theme') as UiTheme | null
      setTheme(saved === 'light' || saved === 'dark' ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      setIsReady(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem('randee-builder-theme', theme)
  }, [theme])

  const isDark = theme === 'dark'
  const page = useStore(store, (state) => state.page)
  const activeId = useStore(store, (state) => state.selectedBlockId)
  const viewport = useStore(store, (state) => state.viewport)
  const block = useStore(store, selectedBlock)
  const seoJsonLd = buildBuilderWebPageJsonLd(page.seo)
  const filteredVariants = libraryVariants.filter((item) => {
    const query = librarySearch.trim().toLowerCase()
    if (!query) return true

    return [item.group, item.name, item.template, item.description, item.type]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
  const groupedVariants = filteredVariants.reduce<Record<string, LibraryVariant[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item]
    return acc
  }, {})

  const exportJson = () => download('page.json', exportPageToJson(page))
  const exportHtml = () => download('page.html', exportPageToHtml(page))
  const exportBitrix = () => download('bitrix-page.schema.json', exportPageToJson(page))

  function addVariant(variant: LibraryVariant) {
    const beforeIds = new Set(store.getState().page.blocks.map((item) => item.id))
    store.getState().addBlock(variant.type)
    const added = store.getState().page.blocks.find((item) => !beforeIds.has(item.id))
    if (!added) return

    store.setState((state) => ({
      page: {
        ...state.page,
        blocks: state.page.blocks.map((item) =>
          item.id === added.id ? { ...item, template: variant.template } : item
        )
      }
    }))
  }

  const gridClass =
    leftOpen && rightOpen
      ? 'xl:grid-cols-[320px_minmax(0,1fr)_390px]'
      : leftOpen
        ? 'xl:grid-cols-[320px_minmax(0,1fr)]'
        : rightOpen
          ? 'xl:grid-cols-[minmax(0,1fr)_390px]'
          : 'xl:grid-cols-[minmax(0,1fr)]'

  const surface = isDark
    ? 'border-white/[0.07] bg-[#17181b]/88 shadow-[0_24px_90px_rgba(0,0,0,0.45)]'
    : 'border-white/85 bg-white/82 shadow-[0_24px_90px_rgba(30,38,34,0.12)]'

  const panel = isDark ? 'border-white/[0.08] bg-[#191a1d]/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' : 'border-white/85 bg-white/86'
  const textMuted = isDark ? 'text-zinc-500' : 'text-stone-500'
  const buttonGhost = isDark
    ? 'border-white/[0.08] bg-white/[0.045] text-zinc-200 hover:border-violet-400/35 hover:bg-white/[0.075]'
    : 'border-stone-200 bg-white/80 text-stone-700 hover:border-emerald-200 hover:bg-white'
  const fieldClass = isDark
    ? 'border-white/[0.08] bg-black/25 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/15'
    : 'border-stone-200 bg-white/85 text-stone-950 placeholder:text-stone-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100'
  const activeGlow = isDark
    ? 'border-violet-400/45 bg-violet-500/12 text-violet-100 shadow-[0_0_34px_rgba(124,58,237,0.18)]'
    : 'border-stone-950 bg-stone-950 text-white shadow-[0_18px_40px_rgba(39,42,34,0.16)]'

  return (
    <main
      data-randee-page="builder"
      data-builder-ready={isReady ? 'true' : 'false'}
      className={cx(
        'randee-builder-shell min-h-screen w-screen overflow-x-hidden px-4 py-4 text-[15px]',
        isDark
          ? 'bg-[#121211] text-zinc-100'
          : 'bg-[radial-gradient(circle_at_18%_0%,#f8fff9_0%,#eef4ef_42%,#e4e9e4_100%)] text-stone-950'
      )}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className={cx('absolute inset-0', isDark ? 'opacity-60' : 'opacity-75')}
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(circle at 18% 8%, rgba(124,58,237,.24), transparent 34%), radial-gradient(circle at 76% 18%, rgba(34,211,238,.12), transparent 28%), linear-gradient(120deg, rgba(255,255,255,.045) 1px, transparent 1px)'
              : 'radial-gradient(circle at 18% 8%, rgba(16,185,129,.18), transparent 34%), radial-gradient(circle at 76% 18%, rgba(124,58,237,.10), transparent 28%), linear-gradient(120deg, rgba(30,38,34,.045) 1px, transparent 1px)',
            backgroundSize: 'auto, auto, 180px 180px'
          }}
        />
        <div className={cx('absolute left-[6%] top-[16%] h-px w-[78vw] rotate-[-8deg]', isDark ? 'bg-white/8' : 'bg-stone-950/8')} />
        <div className={cx('absolute bottom-[-220px] right-[10%] h-[440px] w-[520px] rounded-full blur-3xl', isDark ? 'bg-violet-600/12' : 'bg-emerald-200/45')} />
      </div>

      <div className={cx('mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1780px] overflow-hidden rounded-[34px] border p-2 backdrop-blur-2xl', surface)}>
        <nav className={cx('hidden w-[76px] shrink-0 flex-col items-center justify-between rounded-[28px] border px-3 py-4 lg:flex', isDark ? 'border-white/[0.06] bg-black/30' : 'border-white/75 bg-white/45')}>
          <div className="grid gap-5">
            <div className={cx('flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.28)]', isDark ? 'bg-white text-black' : 'bg-stone-950 text-white')}>
              <Sparkles className="h-6 w-6" />
            </div>
            {[
              [Grid2X2, 'Workspace', true],
              [FolderKanban, 'Projects', false],
              [Store, 'Marketplace', false],
              [PackagePlus, 'Packages', false],
              [Settings2, 'Settings', false]
            ].map(([Icon, label, active]) => {
              const NavIcon = Icon as React.ComponentType<{ className?: string }>
              return (
                <button
                  key={label as string}
                  type="button"
                  className={cx(
                    'group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition',
                    active
                      ? isDark
                        ? 'border-violet-300/25 bg-violet-500/25 text-white shadow-[0_0_28px_rgba(124,58,237,0.35)]'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : isDark
                        ? 'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100'
                        : 'border-transparent text-stone-500 hover:border-stone-200 hover:bg-white/70 hover:text-stone-950'
                  )}
                  aria-label={label as string}
                >
                  <NavIcon className="h-5 w-5" />
                  {active ? <span className="absolute -left-3 h-7 w-1 rounded-full bg-violet-400" /> : null}
                </button>
              )
            })}
          </div>

          <button type="button" className={cx('flex h-11 w-11 items-center justify-center rounded-2xl border transition', buttonGhost)} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-3 pl-0 lg:pl-2">
        <header className={cx('rounded-[28px] border px-4 py-3 backdrop-blur-2xl', isDark ? 'border-white/[0.06] bg-[#1a1b1f]/88' : 'border-white/75 bg-white/72')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cx('flex h-11 w-11 items-center justify-center rounded-2xl', isDark ? 'bg-violet-500 text-white shadow-[0_0_34px_rgba(124,58,237,0.45)]' : 'bg-stone-950 text-white')}>
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold leading-none tracking-normal">Randee Builder</h1>
                <p className={cx('mt-1 text-sm', textMuted)}>Visual Bitrix assembly · reusable blocks · export pipeline</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={cx('flex rounded-2xl border p-1', isDark ? 'border-white/[0.08] bg-black/25' : 'border-stone-200 bg-stone-100/80')}>
                <button
                  type="button"
                  className={cx('flex h-9 items-center gap-1 rounded-xl px-3 text-sm transition', theme === 'light' ? 'bg-white text-stone-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-200')}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  type="button"
                  className={cx('flex h-9 items-center gap-1 rounded-xl px-3 text-sm transition', theme === 'dark' ? 'bg-violet-500 text-white shadow-[0_0_24px_rgba(124,58,237,0.35)]' : 'text-stone-600')}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </button>
              </div>

              <Link className={cx('flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm transition', buttonGhost)} href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link className={cx('flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm transition', buttonGhost)} href="/marketplace">
                <Store className="h-4 w-4" />
                Marketplace
              </Link>
              <button type="button" className={cx('flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm transition', buttonGhost)} onClick={exportJson}>
                <Code2 className="h-4 w-4" />
                JSON
              </button>
              <button
                type="button"
                className={cx(
                  'flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition',
                  isDark ? 'border-violet-300/30 bg-violet-500/20 text-violet-100 shadow-[0_0_28px_rgba(124,58,237,0.22)] hover:bg-violet-500/28' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                )}
                onClick={exportBitrix}
              >
                <Boxes className="h-4 w-4" />
                Export Bitrix
              </button>
              <button
                type="button"
                className={cx('flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition', isDark ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-stone-950 text-white')}
                onClick={exportHtml}
              >
                <Download className="h-4 w-4" />
                HTML
              </button>
              <button type="button" className={cx('hidden h-10 w-10 items-center justify-center rounded-2xl border md:flex', buttonGhost)} aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <button type="button" className={cx('hidden h-10 items-center gap-2 rounded-2xl border px-2 pr-3 md:flex', buttonGhost)} aria-label="Profile">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-cyan-300 text-xs font-bold text-black">R</span>
                <span className="text-sm">Randee</span>
                <CircleUserRound className="h-4 w-4 opacity-55" />
              </button>
            </div>
          </div>
        </header>

        <section className={cx('grid flex-1 grid-cols-1 gap-4', gridClass)}>
          {leftOpen ? (
            <aside className={cx('rounded-[30px] border p-4 backdrop-blur-xl', panel)}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Library</p>
                  <h2 className="mt-1 text-lg font-semibold">Blocks</h2>
                </div>
                <button
                  type="button"
                  data-testid="hide-blocks-panel"
                  className={cx('flex h-9 w-9 items-center justify-center rounded-xl border transition', buttonGhost)}
                  onClick={() => setLeftOpen(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="sr-only">Hide Blocks</span>
                </button>
              </div>

              <div className={cx('mb-3 flex h-12 items-center gap-2 rounded-2xl border px-3 shadow-inner', fieldClass)}>
                <Search className={cx('h-4 w-4', textMuted)} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Search blocks, hero, catalog..."
                />
              </div>

              <div className="grid gap-2">
                {Object.entries(groupedVariants).map(([group, items]) => {
                  const isOpen = openGroups[group] ?? Boolean(librarySearch)
                  return (
                    <div key={group} className={cx('rounded-[22px] border', isDark ? 'border-white/[0.075] bg-white/[0.035]' : 'border-stone-200 bg-white')}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-3.5 text-left"
                        onClick={() => setOpenGroups((current) => ({ ...current, [group]: !isOpen }))}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <LayoutDashboard className={cx('h-4 w-4', isDark ? 'text-violet-300' : 'text-emerald-700')} />
                          {group}
                          <span className={cx('rounded-full px-2 py-0.5 text-xs', isDark ? 'bg-violet-400/12 text-violet-200' : 'bg-stone-100 text-stone-500')}>
                            {items.length}
                          </span>
                        </span>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      {isOpen ? (
                        <div className="grid gap-2 px-2 pb-2">
                          {items.map((item) => (
                            <button
                              key={`${item.group}-${item.template}`}
                              type="button"
                              className={cx(
                                'group rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
                                isDark ? 'border-white/[0.07] bg-[#202126]/80 hover:border-violet-300/25 hover:bg-[#252630]' : 'border-stone-100 bg-stone-50 hover:bg-white'
                              )}
                              onClick={() => addVariant(item)}
                            >
                              <span className="flex items-start justify-between gap-2">
                                <span>
                                  <span className="block text-sm font-semibold">{item.name}</span>
                                  <span className={cx('mt-1 block text-xs leading-5', textMuted)}>
                                    {item.description}
                                  </span>
                                </span>
                                <Plus className={cx('mt-0.5 h-4 w-4 shrink-0 transition group-hover:scale-110', isDark ? 'text-violet-300' : textMuted)} />
                              </span>
                              <span className={cx('mt-2 inline-flex rounded-full px-2 py-1 text-[11px]', isDark ? 'bg-black/25 text-zinc-400' : 'bg-white text-stone-500')}>
                                {item.template}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })}

                {filteredVariants.length === 0 ? (
                  <div className={cx('rounded-2xl border p-4 text-sm', isDark ? 'border-white/10 bg-white/[0.03] text-zinc-400' : 'border-stone-200 bg-white text-stone-500')}>
                    Ничего не найдено. Попробуйте `hero`, `catalog` или `faq`.
                  </div>
                ) : null}
              </div>

              <div className="mt-5">
                <p className={cx('mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Page order</p>
                <div className="grid gap-2">
                  {page.blocks.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      draggable
                      onDragStart={() => setDragId(item.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (!dragId) return
                        const from = page.blocks.findIndex((entry) => entry.id === dragId)
                        if (from >= 0 && from !== index) store.getState().moveBlock(from, index)
                        setDragId(null)
                      }}
                      onClick={() => store.getState().selectBlock(item.id)}
                      className={cx(
                        'flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
                        activeId === item.id
                          ? activeGlow
                          : isDark
                            ? 'border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.07]'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                      )}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 opacity-55" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.type}</span>
                        <span className={cx('block truncate text-xs', activeId === item.id && !isDark ? 'text-white/70' : textMuted)}>
                          {item.template}
                        </span>
                      </span>
                      <span className={cx('rounded-full px-2 py-1 text-xs', activeId === item.id && !isDark ? 'bg-white/15 text-white' : isDark ? 'bg-violet-400/12 text-violet-200' : 'bg-stone-100 text-stone-500')}>
                        {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}

          <section className={cx('rounded-[30px] border p-4 backdrop-blur-xl', panel)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={cx('hidden h-10 w-10 items-center justify-center rounded-2xl border md:flex', isDark ? 'border-violet-300/20 bg-violet-500/15 text-violet-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                  <Wand2 className="h-4 w-4" />
                </div>
                <div>
                  <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Canvas</p>
                  <p className="mt-1 text-sm font-medium">
                    {page.page} · {viewportSize[viewport].label}
                  </p>
                </div>
              </div>

              <div className={cx('flex rounded-2xl border p-1', isDark ? 'border-white/[0.08] bg-black/25' : 'border-stone-200 bg-stone-100/80')}>
                {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((mode) => {
                  const Icon = viewportIcon[mode]
                  return (
                    <button
                      key={mode}
                      type="button"
                      className={cx(
                        'flex h-9 items-center gap-1 rounded-xl px-3 text-sm capitalize transition',
                        viewport === mode ? (isDark ? 'bg-violet-500 text-white shadow-[0_0_22px_rgba(124,58,237,0.28)]' : 'bg-white text-stone-950 shadow-sm') : textMuted
                      )}
                      onClick={() => store.getState().setViewport(mode)}
                    >
                      <Icon className="h-4 w-4" />
                      {mode}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ['1', 'Add blocks', 'Pick reusable sections'],
                ['2', 'Edit content', 'Tune text, SEO and responsive view'],
                ['3', 'Export Bitrix', 'Use schema with local/components/randee']
              ].map(([step, title, description]) => (
                <div key={step} className={cx('rounded-[22px] border p-3', isDark ? 'border-white/[0.07] bg-[#202126]/72' : 'border-stone-200 bg-white/70')}>
                  <div className="flex items-center gap-2">
                    <span className={cx('flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', isDark ? 'bg-violet-500 text-white shadow-[0_0_18px_rgba(124,58,237,0.35)]' : 'bg-stone-950 text-white')}>
                      {step}
                    </span>
                    <span className="text-sm font-semibold">{title}</span>
                  </div>
                  <p className={cx('mt-1 text-xs leading-5', textMuted)}>{description}</p>
                </div>
              ))}
            </div>

            <div className={cx('mt-4 min-h-[680px] overflow-auto rounded-[28px] border', isDark ? 'border-white/[0.07] bg-[#0d0e10]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]' : 'border-stone-300 bg-[#f8faf7]')}>
              <div className="min-w-[760px]">
                <div className={cx('sticky top-0 z-10 grid grid-cols-[48px_1fr] border-b backdrop-blur', isDark ? 'border-white/[0.07] bg-[#111215]/92' : 'border-stone-200 bg-[#f8faf7]/90')}>
                  <div className={cx('h-8 border-r', isDark ? 'border-white/10' : 'border-stone-200')} />
                  <div
                    className="relative h-8"
                    style={{
                      backgroundImage: isDark
                        ? 'linear-gradient(to right, rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,.08) 1px, transparent 1px)'
                        : 'linear-gradient(to right, rgba(41,37,36,.28) 1px, transparent 1px), linear-gradient(to right, rgba(41,37,36,.10) 1px, transparent 1px)',
                      backgroundSize: '100px 100%, 20px 100%'
                    }}
                  >
                    {rulerMarks.map((mark) => (
                      <span
                        key={mark}
                        className={cx('absolute top-2 text-[10px]', textMuted)}
                        style={{ left: `${mark}px` }}
                      >
                        {mark}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-[48px_1fr]">
                  <div
                    className={cx('border-r', isDark ? 'border-white/10' : 'border-stone-200')}
                    style={{
                      backgroundImage: isDark
                        ? 'linear-gradient(to bottom, rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.08) 1px, transparent 1px)'
                        : 'linear-gradient(to bottom, rgba(41,37,36,.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(41,37,36,.10) 1px, transparent 1px)',
                      backgroundSize: '100% 100px, 100% 20px'
                    }}
                  />

                  <div
                    className="p-5"
                    style={{
                      backgroundImage: isDark
                        ? 'linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)'
                        : 'linear-gradient(rgba(41,37,36,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(41,37,36,.045) 1px, transparent 1px), linear-gradient(rgba(41,37,36,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(41,37,36,.10) 1px, transparent 1px)',
                      backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px'
                    }}
                  >
                    <div className={cx('transition-all', viewportClass[viewport])}>
                      <div className={cx('mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 text-xs', isDark ? 'border-white/[0.07] bg-black/35 text-zinc-400' : 'border-stone-200 bg-white/80 text-stone-500')}>
                        <span>{viewportSize[viewport].label}</span>
                        <span>{viewport === 'desktop' ? 'fluid width' : `fixed ${viewportSize[viewport].width}px preview`}</span>
                      </div>
                      <div className="grid gap-4">
                        {page.blocks.map((item) => (
                          <section
                            key={item.id}
                            className={cx(
                              'group rounded-[26px] border p-3 transition hover:-translate-y-0.5',
                              activeId === item.id
                                ? isDark
                                  ? 'border-violet-300/45 bg-violet-500/10 shadow-[0_0_38px_rgba(124,58,237,0.18)]'
                                  : 'border-stone-950 bg-white shadow-[0_18px_50px_rgba(39,42,34,0.12)]'
                                : isDark
                                  ? 'border-white/[0.06] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.045]'
                                  : 'border-transparent bg-transparent hover:border-stone-200 hover:bg-white/60'
                            )}
                            onClick={() => store.getState().selectBlock(item.id)}
                          >
                            <div className="mb-2 flex items-center justify-between px-1">
                              <span className={cx('text-xs font-semibold uppercase tracking-[0.14em]', textMuted)}>
                                {item.type}
                              </span>
                              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                                <button
                                  type="button"
                                  className={cx('flex h-8 w-8 items-center justify-center rounded-xl border', buttonGhost)}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    store.getState().duplicateBlock(item.id)
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className={cx('flex h-8 w-8 items-center justify-center rounded-xl border', isDark ? 'border-red-300/20 bg-red-300/10 text-red-100' : 'border-red-100 bg-red-50 text-red-700')}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    store.getState().removeBlock(item.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className={cx('overflow-hidden rounded-[22px] text-stone-950', isDark ? 'bg-zinc-100 shadow-[0_24px_80px_rgba(0,0,0,0.32)]' : 'bg-white')}>
                              {renderPreviewBlock(item)}
                            </div>
                          </section>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {rightOpen ? (
            <aside className={cx('rounded-[30px] border p-4 backdrop-blur-xl', panel)}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Inspector</p>
                  <h2 className="mt-1 text-lg font-semibold">Settings</h2>
                </div>
                <button
                  type="button"
                  data-testid="hide-inspector-panel"
                  className={cx('flex h-9 w-9 items-center justify-center rounded-xl border transition', buttonGhost)}
                  onClick={() => setRightOpen(false)}
                >
                  <PanelRightClose className="h-4 w-4" />
                  <span className="sr-only">Hide Inspector</span>
                </button>
              </div>

              <div className={cx('rounded-[22px] border p-3', isDark ? 'border-white/[0.07] bg-white/[0.035]' : 'border-stone-200 bg-white')}>
                <div className="mb-3 flex items-center gap-2">
                  <FileText className={cx('h-4 w-4', isDark ? 'text-violet-300' : 'text-emerald-700')} />
                  <p className="text-sm font-semibold">Page</p>
                </div>
                <label className={cx('text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Name</label>
                <input
                  className={cx('mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none transition', fieldClass)}
                  value={page.page}
                  onChange={(event) => store.getState().setPageMeta({ page: event.target.value, slug: page.slug })}
                />
                <label className={cx('mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Slug</label>
                <input
                  className={cx('mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none transition', fieldClass)}
                  value={page.slug}
                  onChange={(event) => store.getState().setPageMeta({ page: page.page, slug: event.target.value })}
                />
              </div>

              <div className={cx('mt-3 rounded-[22px] border p-3', isDark ? 'border-white/[0.07] bg-white/[0.035]' : 'border-stone-200 bg-white')}>
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className={cx('h-4 w-4', isDark ? 'text-violet-300' : 'text-emerald-700')} />
                  <p className="text-sm font-semibold">{block ? `${block.type} block` : 'No block selected'}</p>
                </div>

                {block ? (
                  <div className="grid gap-3">
                    {Object.entries(block.props).map(([key, value]) => (
                      <label key={key} className="grid gap-1">
                        <span className={cx('text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>{key}</span>
                        <input
                          className={cx('h-10 rounded-xl border px-3 text-sm outline-none transition', fieldClass)}
                          value={value}
                          onChange={(event) => store.getState().updateBlockProps(block.id, { [key]: event.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className={cx('text-sm leading-6', textMuted)}>Select a block on the canvas or in the page order list.</p>
                )}
              </div>

              <div className={cx('mt-3 rounded-[22px] border p-3', isDark ? 'border-white/[0.07] bg-white/[0.035]' : 'border-stone-200 bg-white')}>
                <p className="text-sm font-semibold">SEO</p>
                <label className={cx('mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Title</label>
                <input
                  className={cx('mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none transition', fieldClass)}
                  value={page.seo.title}
                  onChange={(event) => store.getState().setSeoMeta({ title: event.target.value })}
                />
                <label className={cx('mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Description</label>
                <textarea
                  className={cx('mt-1 min-h-20 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition', fieldClass)}
                  value={page.seo.description}
                  onChange={(event) => store.getState().setSeoMeta({ description: event.target.value })}
                />
              </div>

              <button
                type="button"
                className={cx('mt-3 flex h-11 w-full items-center justify-center rounded-2xl border text-sm transition', buttonGhost)}
                onClick={() => setAdvancedOpen((value) => !value)}
              >
                {advancedOpen ? 'Hide advanced JSON' : 'Show advanced JSON'}
              </button>

              {advancedOpen ? (
                <div className="mt-3 grid gap-3">
                  <textarea
                    className={cx('min-h-36 resize-none rounded-2xl border p-3 font-mono text-xs outline-none', isDark ? 'border-white/10 bg-black/25 text-stone-200' : 'border-stone-200 bg-white text-stone-700')}
                    value={JSON.stringify(seoJsonLd, null, 2)}
                    readOnly
                  />
                  <textarea
                    className={cx('min-h-48 resize-none rounded-2xl border p-3 font-mono text-xs outline-none', isDark ? 'border-white/10 bg-black/25 text-stone-200' : 'border-stone-200 bg-white text-stone-700')}
                    value={JSON.stringify(page, null, 2)}
                    readOnly
                  />
                </div>
              ) : null}
            </aside>
          ) : null}
        </section>
        </div>
      </div>

      {!leftOpen ? (
        <button
          type="button"
          data-testid="open-blocks-fab"
          className={cx(
            'fixed bottom-24 left-6 z-30 flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:scale-105',
            isDark
              ? 'border-violet-300/30 bg-violet-500 text-white shadow-[0_0_34px_rgba(124,58,237,0.35)]'
              : 'border-white/80 bg-stone-950 text-white'
          )}
          onClick={() => setLeftOpen(true)}
          aria-label="Show Blocks"
        >
          <PanelLeftOpen className="h-6 w-6" />
          <span className="sr-only">Show Blocks</span>
        </button>
      ) : null}

      {!rightOpen ? (
        <button
          type="button"
          data-testid="open-inspector-fab"
          className={cx(
            'fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:scale-105',
            isDark
              ? 'border-cyan-300/25 bg-cyan-400/90 text-black shadow-[0_0_34px_rgba(34,211,238,0.22)]'
              : 'border-white/80 bg-stone-950 text-white'
          )}
          onClick={() => setRightOpen(true)}
          aria-label="Open Inspector"
        >
          <Settings2 className="h-6 w-6" />
          <span className="sr-only">Open Inspector</span>
        </button>
      ) : null}
    </main>
  )
}
