'use client'

import * as React from 'react'
import {
  buildBuilderWebPageJsonLd,
  createBuilderStore,
  exportPageToHtml,
  exportPageToJson,
  listBlockDefinitions,
  selectedBlock,
  type ViewportMode
} from '@randee/builder'
import { useStore } from 'zustand'
import { Cta, Faq, Features, Hero } from '@randee/ui'
import { Button, Card, Chip, Input, Separator, Tab, Tabs, TextArea } from '@heroui/react'
import {
  Boxes,
  Code2,
  Download,
  Home,
  LayoutDashboard,
  Moon,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  Sun
} from 'lucide-react'

type UiTheme = 'light' | 'dark'

const viewportClass: Record<ViewportMode, string> = {
  desktop: 'w-full',
  tablet: 'mx-auto w-[820px] max-w-full',
  mobile: 'mx-auto w-[420px] max-w-full'
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

function renderPreviewBlock(block: ReturnType<typeof selectedBlock>) {
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
    return <Faq title={block.props.title ?? 'FAQ'} items={[{ id: '1', question: 'Вопрос', answer: 'Ответ' }]} />
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
    <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{block.type}</h3>
      <p className="text-sm text-slate-500">Template: {block.template}</p>
    </section>
  )
}

export default function BuilderPage() {
  const [store] = React.useState(() => createBuilderStore())
  const [theme, setTheme] = React.useState<UiTheme>('light')
  const [leftOpen, setLeftOpen] = React.useState(true)
  const [rightOpen, setRightOpen] = React.useState(true)
  const [advancedOpen, setAdvancedOpen] = React.useState(false)

  React.useEffect(() => {
    const saved = window.localStorage.getItem('randee-builder-theme') as UiTheme | null
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(prefersDark ? 'dark' : 'light')
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem('randee-builder-theme', theme)
  }, [theme])

  const isDark = theme === 'dark'

  const page = useStore(store, (state) => state.page)
  const activeId = useStore(store, (state) => state.selectedBlockId)
  const viewport = useStore(store, (state) => state.viewport)
  const block = useStore(store, selectedBlock)

  const [dragId, setDragId] = React.useState<string | null>(null)

  const exportJson = () => download('page.json', exportPageToJson(page))
  const exportHtml = () => download('page.html', exportPageToHtml(page))
  const exportBitrix = () => download('bitrix-page.schema.json', exportPageToJson(page))
  const seoJsonLd = buildBuilderWebPageJsonLd(page.seo)

  const gridClass =
    leftOpen && rightOpen
      ? 'xl:grid-cols-[320px_1fr_420px]'
      : leftOpen
        ? 'xl:grid-cols-[320px_1fr]'
        : rightOpen
          ? 'xl:grid-cols-[1fr_420px]'
          : 'xl:grid-cols-[1fr]'

  return (
    <main
      data-randee-page="builder"
      className={`min-h-screen w-screen px-4 py-4 md:px-6 ${
        isDark
          ? 'bg-[radial-gradient(circle_at_0%_0%,#1b2438_0%,#0f172a_38%,#0b1020_100%)] text-slate-100'
          : 'bg-[radial-gradient(circle_at_0%_0%,#f2f6ff_0%,#eef3fb_42%,#e8edf5_100%)] text-slate-900'
      }`}
    >
      <div className="mx-auto w-full max-w-[1720px]">
        <header
          className={`mb-4 rounded-3xl border px-5 py-4 backdrop-blur-xl ${
            isDark
              ? 'border-white/10 bg-white/5'
              : 'border-white/70 bg-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.08)]'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className={`text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Randee Builder
              </h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Compose pages, inspect content, export to Bitrix
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={`rounded-2xl border p-1 ${isDark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
                <Button
                  size="sm"
                  variant="tertiary"
                  className={`${!isDark ? 'bg-white text-slate-950 shadow-sm' : 'text-white'}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun className="mr-1 h-4 w-4" />
                  Light
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  className={`${isDark ? 'bg-white/15 text-white shadow-sm' : 'text-slate-700'}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="mr-1 h-4 w-4" />
                  Dark
                </Button>
              </div>
              <a href="/">
                <Button variant="tertiary" className={`${isDark ? 'border border-white/20 bg-white/10 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
              </a>
              <a href="/marketplace">
                <Button variant="tertiary" className={`${isDark ? 'border border-white/20 bg-white/10 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Marketplace
                </Button>
              </a>
              <Button variant="tertiary" className={`${isDark ? 'border border-white/20 bg-white/10 text-white' : 'border border-slate-200 bg-white text-slate-700'}`} onClick={exportJson}>
                <Code2 className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="tertiary" className={`${isDark ? 'border border-emerald-300/30 bg-emerald-400/20 text-emerald-100' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`} onClick={exportBitrix}>
                <Boxes className="mr-2 h-4 w-4" />
                Export Bitrix
              </Button>
              <Button variant="primary" className={`${isDark ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-white'}`} onClick={exportHtml}>
                <Download className="mr-2 h-4 w-4" />
                Export HTML
              </Button>
            </div>
          </div>
        </header>

        <section className={`grid min-h-[calc(100vh-170px)] grid-cols-1 gap-4 ${gridClass}`}>
          {leftOpen ? (
            <aside className={`rounded-3xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.06)]'}`}>
              <div className="mb-3 flex justify-between">
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                  Blocks
                </p>
                <Button size="sm" variant="tertiary" onClick={() => setLeftOpen(false)}>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="sr-only">Hide Blocks</span>
                </Button>
              </div>

              <Card variant="secondary" className={`${isDark ? 'border border-white/10 bg-slate-900/60' : 'border border-slate-200 bg-white'}`}>
                <Card.Content className="space-y-2 p-3">
                  {listBlockDefinitions().map((item) => (
                    <Button
                      key={item.type}
                      variant="tertiary"
                      className={`w-full justify-start rounded-xl ${isDark ? 'border border-white/10 bg-white/5 text-slate-100 hover:bg-cyan-400/20' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                      onClick={() => store.getState().addBlock(item.type)}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </Card.Content>
              </Card>

              <div className="mt-3 space-y-2">
                {page.blocks.map((item, index) => (
                  <Card
                    key={item.id}
                    variant="secondary"
                    draggable
                    onDragStart={() => setDragId(item.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!dragId) return
                      const from = page.blocks.findIndex((b) => b.id === dragId)
                      if (from >= 0 && from !== index) store.getState().moveBlock(from, index)
                      setDragId(null)
                    }}
                    onClick={() => store.getState().selectBlock(item.id)}
                    className={`cursor-pointer rounded-2xl border ${
                      activeId === item.id
                        ? isDark
                          ? 'border-cyan-300/80 bg-cyan-400/15'
                          : 'border-slate-900 bg-slate-900 text-white'
                        : isDark
                          ? 'border-white/10 bg-slate-900/60'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Card.Content className="space-y-3 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{item.type}</span>
                        <Chip variant="soft" className={`${activeId === item.id && !isDark ? 'bg-white/20 text-white' : ''}`}>
                          #{index + 1}
                        </Chip>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="tertiary" onClick={() => store.getState().duplicateBlock(item.id)}>
                          Duplicate
                        </Button>
                        <Button size="sm" variant="danger-soft" onClick={() => store.getState().removeBlock(item.id)}>
                          Remove
                        </Button>
                      </div>
                    </Card.Content>
                  </Card>
                ))}
              </div>
            </aside>
          ) : null}

          <section className={`rounded-3xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.06)]'}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-[120px] items-center gap-2">
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                  Canvas
                </span>
              </div>

              <Tabs selectedKey={viewport} onSelectionChange={(value) => store.getState().setViewport(String(value) as ViewportMode)} variant="secondary">
                <Tabs.List className={`${isDark ? 'rounded-2xl border border-white/10 bg-white/5 p-1' : 'rounded-2xl border border-slate-200 bg-slate-100 p-1'}`}>
                  <Tab id="desktop" className="rounded-xl px-3 py-1.5">Desktop</Tab>
                  <Tab id="tablet" className="rounded-xl px-3 py-1.5">Tablet</Tab>
                  <Tab id="mobile" className="rounded-xl px-3 py-1.5">Mobile</Tab>
                </Tabs.List>
              </Tabs>
            </div>

            <Separator className={isDark ? 'bg-white/10' : 'bg-slate-200'} />

            {(!leftOpen || !rightOpen) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {!leftOpen ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    className={`${isDark ? 'border border-white/15 bg-white/10 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}
                    onClick={() => setLeftOpen(true)}
                  >
                    <PanelLeftOpen className="mr-1 h-4 w-4" />
                    Show Blocks
                  </Button>
                ) : null}
                {!rightOpen ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    className={`${isDark ? 'border border-white/15 bg-white/10 text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}
                    onClick={() => setRightOpen(true)}
                  >
                    <PanelRightOpen className="mr-1 h-4 w-4" />
                    Show Inspector
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3 py-4 md:grid-cols-3">
              {[
                ['1', 'Add blocks', 'Choose reusable Randee sections'],
                ['2', 'Edit content', 'Change text, SEO and responsive mode'],
                ['3', 'Export Bitrix', 'Generate schema for local/components/randee']
              ].map(([step, title, text]) => (
                <div
                  key={step}
                  className={`rounded-2xl border p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/70'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${isDark ? 'bg-cyan-300 text-slate-950' : 'bg-slate-900 text-white'} flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold`}>
                      {step}
                    </span>
                    <span className="text-sm font-semibold">{title}</span>
                  </div>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{text}</p>
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-3xl border border-dashed p-4 ${isDark ? 'border-cyan-200/25 bg-slate-950/40' : 'border-slate-300 bg-white'}`}>
              <div className={viewportClass[viewport]}>{renderPreviewBlock(block)}</div>
            </div>
          </section>

          {rightOpen ? (
            <aside className={`rounded-3xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-white/70 bg-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.06)]'}`}>
              <div className="mb-3 flex justify-between">
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                  Inspector
                </p>
                <Button size="sm" variant="tertiary" onClick={() => setRightOpen(false)}>
                  <PanelRightClose className="h-4 w-4" />
                  <span className="sr-only">Hide Inspector</span>
                </Button>
              </div>

              <Card variant="secondary" className={`${isDark ? 'border border-white/10 bg-slate-900/60' : 'border border-slate-200 bg-white'}`}>
                <Card.Content className="space-y-3 p-3">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Page Name</label>
                  <Input value={page.page} onChange={(event) => store.getState().setPageMeta({ page: event.target.value, slug: page.slug })} />
                  <label className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Slug</label>
                  <Input value={page.slug} onChange={(event) => store.getState().setPageMeta({ page: page.page, slug: event.target.value })} />

                  <Separator className={isDark ? 'bg-white/10' : 'bg-slate-200'} />

                  <label className="text-[11px] uppercase tracking-[0.14em] text-slate-500">SEO Title</label>
                  <Input value={page.seo.title} onChange={(event) => store.getState().setSeoMeta({ title: event.target.value })} />
                  <label className="text-[11px] uppercase tracking-[0.14em] text-slate-500">SEO Description</label>
                  <Input value={page.seo.description} onChange={(event) => store.getState().setSeoMeta({ description: event.target.value })} />

                  {block ? (
                    <>
                      <Chip color="accent" variant="soft">Selected: {block.type} / {block.id}</Chip>
                      {Object.entries(block.props).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{key}</label>
                          <Input
                            value={value}
                            onChange={(event) =>
                              store.getState().updateBlockProps(block.id, { [key]: event.target.value })
                            }
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <Chip variant="soft">Выберите блок</Chip>
                  )}

                  <Button
                    variant="tertiary"
                    className="justify-start"
                    onClick={() => setAdvancedOpen((value) => !value)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {advancedOpen ? 'Hide advanced JSON' : 'Show advanced JSON'}
                  </Button>

                  {advancedOpen ? (
                    <>
                      <TextArea className="font-mono text-xs" value={JSON.stringify(seoJsonLd, null, 2)} rows={6} readOnly />
                      <TextArea className="font-mono text-xs" value={JSON.stringify(page, null, 2)} rows={10} readOnly />
                    </>
                  ) : null}
                </Card.Content>
              </Card>
            </aside>
          ) : null}
        </section>
      </div>
    </main>
  )
}
