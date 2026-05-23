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
  Boxes,
  Code2,
  Copy,
  Download,
  FileText,
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
  PanelRightOpen,
  Plus,
  Settings2,
  Smartphone,
  Store,
  Sun,
  Tablet,
  Trash2
} from 'lucide-react'

type UiTheme = 'light' | 'dark'

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

  React.useEffect(() => {
    const saved = window.localStorage.getItem('randee-builder-theme') as UiTheme | null
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      return
    }

    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
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

  const exportJson = () => download('page.json', exportPageToJson(page))
  const exportHtml = () => download('page.html', exportPageToHtml(page))
  const exportBitrix = () => download('bitrix-page.schema.json', exportPageToJson(page))

  const gridClass =
    leftOpen && rightOpen
      ? 'xl:grid-cols-[300px_minmax(0,1fr)_380px]'
      : leftOpen
        ? 'xl:grid-cols-[300px_minmax(0,1fr)]'
        : rightOpen
          ? 'xl:grid-cols-[minmax(0,1fr)_380px]'
          : 'xl:grid-cols-[minmax(0,1fr)]'

  const surface = isDark
    ? 'border-white/10 bg-white/[0.06] shadow-[0_22px_80px_rgba(0,0,0,0.28)]'
    : 'border-white/80 bg-white/78 shadow-[0_22px_70px_rgba(39,42,34,0.10)]'

  const panel = isDark ? 'border-white/10 bg-[#121819]/92' : 'border-white/80 bg-white/88'
  const textMuted = isDark ? 'text-stone-300' : 'text-stone-500'
  const buttonGhost = isDark
    ? 'border-white/10 bg-white/[0.07] text-stone-100 hover:bg-white/[0.12]'
    : 'border-stone-200 bg-white/80 text-stone-700 hover:bg-stone-50'

  return (
    <main
      data-randee-page="builder"
      className={cx(
        'randee-builder-shell min-h-screen w-screen overflow-x-hidden px-4 py-4 text-[15px]',
        isDark
          ? 'bg-[#0b1010] text-stone-100'
          : 'bg-[radial-gradient(circle_at_18%_0%,#f8fff9_0%,#eef4ef_42%,#e4e9e4_100%)] text-stone-950'
      )}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
        <div className="absolute right-[8%] top-[-180px] h-[420px] w-[520px] rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[10%] h-[440px] w-[520px] rounded-full bg-lime-100/40 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1760px] flex-col gap-4">
        <header className={cx('rounded-[28px] border px-4 py-3 backdrop-blur-2xl', surface)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cx('flex h-11 w-11 items-center justify-center rounded-2xl', isDark ? 'bg-emerald-300 text-stone-950' : 'bg-stone-950 text-white')}>
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold leading-none tracking-normal">Randee Builder</h1>
                <p className={cx('mt-1 text-sm', textMuted)}>Page assembly for Bitrix components</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={cx('flex rounded-2xl border p-1', isDark ? 'border-white/10 bg-white/[0.06]' : 'border-stone-200 bg-stone-100/80')}>
                <button
                  type="button"
                  className={cx('flex h-9 items-center gap-1 rounded-xl px-3 text-sm transition', theme === 'light' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-300')}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </button>
                <button
                  type="button"
                  className={cx('flex h-9 items-center gap-1 rounded-xl px-3 text-sm transition', theme === 'dark' ? 'bg-white/15 text-white shadow-sm' : 'text-stone-600')}
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
                  isDark ? 'border-emerald-300/25 bg-emerald-300/15 text-emerald-100' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                )}
                onClick={exportBitrix}
              >
                <Boxes className="h-4 w-4" />
                Export Bitrix
              </button>
              <button
                type="button"
                className={cx('flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition', isDark ? 'bg-emerald-300 text-stone-950' : 'bg-stone-950 text-white')}
                onClick={exportHtml}
              >
                <Download className="h-4 w-4" />
                HTML
              </button>
            </div>
          </div>
        </header>

        <section className={cx('grid flex-1 grid-cols-1 gap-4', gridClass)}>
          {leftOpen ? (
            <aside className={cx('rounded-[28px] border p-4 backdrop-blur-xl', panel)}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Library</p>
                  <h2 className="mt-1 text-lg font-semibold">Blocks</h2>
                </div>
                <button
                  type="button"
                  className={cx('flex h-9 w-9 items-center justify-center rounded-xl border transition', buttonGhost)}
                  onClick={() => setLeftOpen(false)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="sr-only">Hide Blocks</span>
                </button>
              </div>

              <div className="grid gap-2">
                {listBlockDefinitions().map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={cx(
                      'group flex h-12 items-center justify-between rounded-2xl border px-3 text-left transition',
                      isDark ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.09]' : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                    )}
                    onClick={() => store.getState().addBlock(item.type)}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <LayoutDashboard className="h-4 w-4 text-emerald-700" />
                      {item.label}
                    </span>
                    <Plus className={cx('h-4 w-4 transition group-hover:scale-110', textMuted)} />
                  </button>
                ))}
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
                        'flex items-center gap-3 rounded-2xl border p-3 text-left transition',
                        activeId === item.id
                          ? isDark
                            ? 'border-emerald-300/50 bg-emerald-300/12'
                            : 'border-stone-950 bg-stone-950 text-white'
                          : isDark
                            ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
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
                      <span className={cx('rounded-full px-2 py-1 text-xs', activeId === item.id && !isDark ? 'bg-white/15 text-white' : isDark ? 'bg-white/8 text-stone-300' : 'bg-stone-100 text-stone-500')}>
                        {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}

          <section className={cx('rounded-[28px] border p-4 backdrop-blur-xl', panel)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {!leftOpen ? (
                  <button type="button" className={cx('flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm transition', buttonGhost)} onClick={() => setLeftOpen(true)}>
                    <PanelLeftOpen className="h-4 w-4" />
                    Show Blocks
                  </button>
                ) : null}
                {!rightOpen ? (
                  <button type="button" className={cx('flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm transition', buttonGhost)} onClick={() => setRightOpen(true)}>
                    <PanelRightOpen className="h-4 w-4" />
                    Show Inspector
                  </button>
                ) : null}
                <div>
                  <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Canvas</p>
                  <p className="mt-1 text-sm font-medium">
                    {page.page} · {viewportSize[viewport].label}
                  </p>
                </div>
              </div>

              <div className={cx('flex rounded-2xl border p-1', isDark ? 'border-white/10 bg-white/[0.05]' : 'border-stone-200 bg-stone-100/80')}>
                {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map((mode) => {
                  const Icon = viewportIcon[mode]
                  return (
                    <button
                      key={mode}
                      type="button"
                      className={cx(
                        'flex h-9 items-center gap-1 rounded-xl px-3 text-sm capitalize transition',
                        viewport === mode ? (isDark ? 'bg-white/15 text-white' : 'bg-white text-stone-950 shadow-sm') : textMuted
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
                <div key={step} className={cx('rounded-2xl border p-3', isDark ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white/70')}>
                  <div className="flex items-center gap-2">
                    <span className={cx('flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold', isDark ? 'bg-emerald-300 text-stone-950' : 'bg-stone-950 text-white')}>
                      {step}
                    </span>
                    <span className="text-sm font-semibold">{title}</span>
                  </div>
                  <p className={cx('mt-1 text-xs leading-5', textMuted)}>{description}</p>
                </div>
              ))}
            </div>

            <div className={cx('mt-4 min-h-[680px] overflow-auto rounded-[26px] border', isDark ? 'border-emerald-200/20 bg-[#090d0b]/50' : 'border-stone-300 bg-[#f8faf7]')}>
              <div className="min-w-[760px]">
                <div className={cx('sticky top-0 z-10 grid grid-cols-[48px_1fr] border-b backdrop-blur', isDark ? 'border-white/10 bg-[#090d0b]/90' : 'border-stone-200 bg-[#f8faf7]/90')}>
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
                    className={cx('relative border-r', isDark ? 'border-white/10' : 'border-stone-200')}
                    style={{
                      backgroundImage: isDark
                        ? 'linear-gradient(to bottom, rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.08) 1px, transparent 1px)'
                        : 'linear-gradient(to bottom, rgba(41,37,36,.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(41,37,36,.10) 1px, transparent 1px)',
                      backgroundSize: '100% 100px, 100% 20px'
                    }}
                  >
                    {rulerMarks.slice(1, 9).map((mark) => (
                      <span
                        key={mark}
                        className={cx('absolute left-2 text-[10px]', textMuted)}
                        style={{ top: `${mark}px` }}
                      >
                        {mark}
                      </span>
                    ))}
                  </div>

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
                      <div className={cx('mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 text-xs', isDark ? 'border-white/10 bg-black/25 text-stone-300' : 'border-stone-200 bg-white/80 text-stone-500')}>
                        <span>{viewportSize[viewport].label}</span>
                        <span>{viewport === 'desktop' ? 'fluid width' : `fixed ${viewportSize[viewport].width}px preview`}</span>
                      </div>
                      <div className="grid gap-4">
                        {page.blocks.map((item) => (
                          <section
                            key={item.id}
                            className={cx(
                              'group rounded-[24px] border p-3 transition',
                              activeId === item.id
                                ? isDark
                                  ? 'border-emerald-300/60 bg-emerald-300/8'
                                  : 'border-stone-950 bg-white shadow-[0_18px_50px_rgba(39,42,34,0.12)]'
                                : isDark
                                  ? 'border-white/8 bg-white/[0.03]'
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
                            <div className="overflow-hidden rounded-[20px] bg-white text-stone-950">
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
            <aside className={cx('rounded-[28px] border p-4 backdrop-blur-xl', panel)}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={cx('text-[11px] font-semibold uppercase tracking-[0.18em]', textMuted)}>Inspector</p>
                  <h2 className="mt-1 text-lg font-semibold">Settings</h2>
                </div>
                <button
                  type="button"
                  className={cx('flex h-9 w-9 items-center justify-center rounded-xl border transition', buttonGhost)}
                  onClick={() => setRightOpen(false)}
                >
                  <PanelRightClose className="h-4 w-4" />
                  <span className="sr-only">Hide Inspector</span>
                </button>
              </div>

              <div className={cx('rounded-2xl border p-3', isDark ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white')}>
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-semibold">Page</p>
                </div>
                <label className={cx('text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Name</label>
                <input
                  className={cx('mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none', isDark ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-stone-50 text-stone-950')}
                  value={page.page}
                  onChange={(event) => store.getState().setPageMeta({ page: event.target.value, slug: page.slug })}
                />
                <label className={cx('mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Slug</label>
                <input
                  className={cx('mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none', isDark ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-stone-50 text-stone-950')}
                  value={page.slug}
                  onChange={(event) => store.getState().setPageMeta({ page: page.page, slug: event.target.value })}
                />
              </div>

              <div className={cx('mt-3 rounded-2xl border p-3', isDark ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white')}>
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-emerald-700" />
                  <p className="text-sm font-semibold">{block ? `${block.type} block` : 'No block selected'}</p>
                </div>

                {block ? (
                  <div className="grid gap-3">
                    {Object.entries(block.props).map(([key, value]) => (
                      <label key={key} className="grid gap-1">
                        <span className={cx('text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>{key}</span>
                        <input
                          className={cx('h-10 rounded-xl border px-3 text-sm outline-none', isDark ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-stone-50 text-stone-950')}
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

              <div className={cx('mt-3 rounded-2xl border p-3', isDark ? 'border-white/10 bg-white/[0.04]' : 'border-stone-200 bg-white')}>
                <p className="text-sm font-semibold">SEO</p>
                <label className={cx('mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Title</label>
                <input
                  className={cx('mt-1 h-10 w-full rounded-xl border px-3 text-sm outline-none', isDark ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-stone-50 text-stone-950')}
                  value={page.seo.title}
                  onChange={(event) => store.getState().setSeoMeta({ title: event.target.value })}
                />
                <label className={cx('mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>Description</label>
                <textarea
                  className={cx('mt-1 min-h-20 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none', isDark ? 'border-white/10 bg-black/20 text-white' : 'border-stone-200 bg-stone-50 text-stone-950')}
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
    </main>
  )
}
