'use client'

import * as React from 'react'
import {
  createBuilderStore,
  exportPageToHtml,
  exportPageToJson,
  listBlockDefinitions,
  selectedBlock,
  type BlockType,
  type ViewportMode
} from '@randee/builder'
import { useStore } from 'zustand'
import {
  Alert,
  Badge,
  Button,
  Cta,
  Faq,
  Features,
  Hero,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@randee/ui'

const viewportClass: Record<ViewportMode, string> = {
  desktop: 'w-full',
  tablet: 'mx-auto w-[768px] max-w-full',
  mobile: 'mx-auto w-[390px] max-w-full'
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
    <section className="rounded-xl border border-neutral-200 bg-white p-6">
      <h3 className="text-lg font-semibold">{block.type}</h3>
      <p className="text-sm text-neutral-600">Template: {block.template}</p>
    </section>
  )
}

export default function BuilderPage() {
  const [store] = React.useState(() => createBuilderStore())

  const page = useStore(store, (state) => state.page)
  const activeId = useStore(store, (state) => state.selectedBlockId)
  const viewport = useStore(store, (state) => state.viewport)
  const block = useStore(store, selectedBlock)

  const [dragId, setDragId] = React.useState<string | null>(null)

  const exportJson = () => download('page.json', exportPageToJson(page))
  const exportHtml = () => download('page.html', exportPageToHtml(page))

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Randee Builder MVP</h1>
          <p className="text-sm text-neutral-600">
            CRUD блоков, reorder, props editor, responsive preview и экспорт JSON/HTML.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportJson}>Export JSON</Button>
          <Button onClick={exportHtml}>Export HTML</Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr_360px]">
        <aside className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Blocks</h2>
          <div className="space-y-2">
            {listBlockDefinitions().map((item) => (
              <Button key={item.type} variant="secondary" className="w-full justify-start" onClick={() => store.getState().addBlock(item.type)}>
                + {item.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {page.blocks.map((item, index) => (
              <div
                key={item.id}
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
                className={`cursor-pointer rounded-lg border p-3 ${activeId === item.id ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{item.type}</div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); store.getState().duplicateBlock(item.id) }}>
                    Duplicate
                  </Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); store.getState().removeBlock(item.id) }}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <Tabs value={viewport} onValueChange={(value) => store.getState().setViewport(value as ViewportMode)}>
            <TabsList>
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="tablet">Tablet</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>
            <TabsContent value="desktop" />
            <TabsContent value="tablet" />
            <TabsContent value="mobile" />
          </Tabs>

          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
            <div className={viewportClass[viewport]}>{renderPreviewBlock(block)}</div>
          </div>
        </section>

        <aside className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Inspector</h2>
          {block ? (
            <div className="space-y-3">
              <Alert title={`Selected: ${block.type}`}>ID: {block.id}</Alert>
              {Object.entries(block.props).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs uppercase tracking-wide text-neutral-500">{key}</label>
                  <Input
                    value={value}
                    onChange={(event) => store.getState().updateBlockProps(block.id, { [key]: event.target.value })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Alert title="No block selected">Выберите блок для редактирования.</Alert>
          )}

          <div>
            <h3 className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Live JSON</h3>
            <pre className="max-h-[300px] overflow-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-100">
              {JSON.stringify(page, null, 2)}
            </pre>
          </div>
        </aside>
      </section>
    </main>
  )
}
