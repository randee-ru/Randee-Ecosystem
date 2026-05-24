'use client'

import * as React from 'react'
import { ElementTreePreview, UI_READY_ELEMENT_IDS } from '@randee/blocks'
import type { ComponentElement } from '@randee/builder'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input
} from '@randee/ui'
import {
  ArrowRight,
  Boxes,
  ChevronRight,
  Code2,
  FileCode2,
  FolderTree,
  MousePointer2,
  Pencil,
  Plus,
  SquarePlus
} from 'lucide-react'
export type InstructionsTheme = {
  bg: string
  panel: string
  panelElevated: string
  divider: string
  text: string
  textSecondary: string
  textMuted: string
  hover: string
  inputBg: string
  accent: string
  chromeBorder: string
}

function VisualLabel({ children, t }: { children: React.ReactNode; t: InstructionsTheme }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
      {children}
    </p>
  )
}

function DemoLightSurface({ children, t }: { children: React.ReactNode; t: InstructionsTheme }) {
  return (
    <div
      className="rounded-xl p-4 text-neutral-900 shadow-inner"
      style={{ background: '#ffffff', border: `1px solid ${t.divider}` }}
    >
      {children}
    </div>
  )
}

function MockBtn({
  label,
  active,
  accent,
  muted
}: {
  label: string
  active?: boolean
  accent: string
  muted: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
      style={{
        background: active ? accent : 'rgba(128,128,128,0.12)',
        color: active ? '#fff' : muted,
        boxShadow: active ? `0 0 0 2px ${accent}55` : 'none'
      }}
    >
      {label}
    </span>
  )
}

/** Мини-макет интерфейса Builder: панели + canvas */
export function GuideBuilderLayoutVisual({ t }: { t: InstructionsTheme }) {
  return (
    <div className="mb-4">
      <VisualLabel t={t}>Как устроен экран</VisualLabel>
      <div
        className="overflow-hidden rounded-xl"
        style={{ border: `1px solid ${t.divider}`, background: t.inputBg }}
      >
        <div className="flex h-7 items-center gap-1 border-b px-2" style={{ borderColor: t.divider, background: t.panelElevated }}>
          <MockBtn label="+ Insert" accent={t.accent} muted={t.textMuted} />
          <MockBtn label="Edit Component" active accent={t.accent} muted={t.textMuted} />
          <MockBtn label="Инструкция" accent={t.accent} muted={t.textMuted} />
        </div>
        <div className="flex h-36">
          <div className="w-[22%] border-r p-2" style={{ borderColor: t.divider, background: t.panel }}>
            <p className="mb-1 text-[8px] font-bold uppercase" style={{ color: t.textMuted }}>
              Blocks
            </p>
            <div className="space-y-1">
              {['Hero', 'Component'].map((name, i) => (
                <div
                  key={name}
                  className="rounded px-1.5 py-1 text-[9px]"
                  style={{
                    background: i === 1 ? `${t.accent}22` : t.inputBg,
                    color: i === 1 ? t.accent : t.textSecondary,
                    border: i === 1 ? `1px solid ${t.accent}44` : `1px solid transparent`
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-1 flex-col" style={{ background: '#e5e5e5' }}>
            <div className="flex flex-1 items-center justify-center p-2">
              <div
                className="w-[85%] rounded-md bg-white p-3 shadow-lg"
                style={{ border: `2px dashed ${t.accent}66` }}
              >
                <div className="mb-2 h-2 w-1/2 rounded bg-neutral-200" />
                <div className="flex gap-2">
                  <div className="h-7 flex-1 rounded bg-neutral-100" />
                  <div className="h-7 w-16 rounded" style={{ background: t.accent }} />
                </div>
              </div>
            </div>
            <p className="pb-1 text-center text-[8px]" style={{ color: t.textMuted }}>
              Canvas — клик по элементу
            </p>
          </div>
          <div className="w-[24%] border-l p-2" style={{ borderColor: t.divider, background: t.panel }}>
            <p className="mb-1 text-[8px] font-bold uppercase" style={{ color: t.textMuted }}>
              Inspector
            </p>
            {['label', 'title', 'variant'].map((field) => (
              <div key={field} className="mb-1.5">
                <p className="text-[7px] capitalize" style={{ color: t.textMuted }}>
                  {field}
                </p>
                <div className="h-4 rounded" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Insert: Page blocks vs UI Elements */
export function GuideInsertCompareVisual({ t }: { t: InstructionsTheme }) {
  const [editOn, setEditOn] = React.useState(true)

  const pageBlocks = ['Hero', 'FAQ', 'Features']
  const uiElements = ['Button', 'Input', 'Card', 'Modal', 'Form']

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Интерактив: что видно в Insert</VisualLabel>
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-[11px] font-medium"
          style={{
            background: !editOn ? t.accent : t.inputBg,
            color: !editOn ? '#fff' : t.textSecondary,
            border: `1px solid ${!editOn ? t.accent : t.divider}`,
            cursor: 'pointer'
          }}
          onClick={() => setEditOn(false)}
        >
          Edit Component OFF
        </button>
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-[11px] font-medium"
          style={{
            background: editOn ? t.accent : t.inputBg,
            color: editOn ? '#fff' : t.textSecondary,
            border: `1px solid ${editOn ? t.accent : t.divider}`,
            cursor: 'pointer'
          }}
          onClick={() => setEditOn(true)}
        >
          Edit Component ON
        </button>
      </div>
      <div
        className="rounded-xl p-3"
        style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
      >
        <p className="mb-2 text-xs font-semibold" style={{ color: t.text }}>
          {editOn ? 'UI Elements' : 'Page blocks'}
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {(editOn ? uiElements : pageBlocks).map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-lg px-2 py-2"
              style={{ background: t.panelElevated, border: `1px solid ${t.divider}` }}
            >
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold"
                style={{ background: `${t.accent}18`, color: t.accent }}
              >
                {name.slice(0, 1)}
              </div>
              <span className="text-[11px] font-medium" style={{ color: t.text }}>
                {name}
              </span>
              {editOn && UI_READY_ELEMENT_IDS.has(name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()) ? (
                <Badge className="ml-auto text-[8px]">live</Badge>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px]" style={{ color: t.textMuted }}>
          {editOn
            ? 'Примитивы для component: кнопки, поля, карточки…'
            : 'Готовые секции страницы — не для сборки внутри component'}
        </p>
      </div>
    </div>
  )
}

const DEMO_ELEMENTS: ComponentElement[] = [
  {
    id: 'demo-card',
    elementId: 'card',
    name: 'Card',
    props: { title: 'Карточка товара', description: 'Краткое описание и цена' }
  },
  {
    id: 'demo-btn',
    elementId: 'button',
    name: 'Button',
    props: { label: 'В корзину' }
  },
  {
    id: 'demo-input',
    elementId: 'text-field',
    name: 'Email',
    props: { label: 'Email', placeholder: 'you@example.com' }
  }
]

/** Живое превью элементов на canvas */
export function GuideElementCanvasVisual({ t }: { t: InstructionsTheme }) {
  const [selectedId, setSelectedId] = React.useState<string | null>('demo-btn')

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Демо: component на canvas (кликните элемент)</VisualLabel>
      <div className="grid gap-3 lg:grid-cols-[1fr_140px]">
        <div
          className="rounded-xl p-4"
          style={{
            background: '#f0f0f0',
            border: `2px dashed ${t.accent}55`,
            minHeight: 140
          }}
        >
          <p className="mb-2 text-[9px] font-medium uppercase tracking-wide text-neutral-500">Artboard</p>
          <DemoLightSurface t={t}>
            <ElementTreePreview
              elements={DEMO_ELEMENTS}
              options={{
                selectedElementId: selectedId,
                onSelectElement: setSelectedId
              }}
            />
          </DemoLightSurface>
        </div>
        <div className="rounded-xl p-3" style={{ background: t.panel, border: `1px solid ${t.divider}` }}>
          <p className="mb-2 text-[9px] font-bold uppercase" style={{ color: t.textMuted }}>
            Inspector
          </p>
          {selectedId ? (
            <>
              <p className="text-[11px] font-semibold" style={{ color: t.text }}>
                {DEMO_ELEMENTS.find((e) => e.id === selectedId)?.name}
              </p>
              {Object.entries(DEMO_ELEMENTS.find((e) => e.id === selectedId)?.props ?? {}).map(([key, value]) => (
                <div key={key} className="mt-2">
                  <label className="text-[9px] capitalize" style={{ color: t.textMuted }}>
                    {key}
                  </label>
                  <input
                    readOnly
                    value={value}
                    className="mt-0.5 w-full rounded px-2 py-1 text-[10px]"
                    style={{ background: t.inputBg, border: `1px solid ${t.divider}`, color: t.text }}
                  />
                </div>
              ))}
            </>
          ) : (
            <p className="text-[10px]" style={{ color: t.textMuted }}>
              Выберите элемент на canvas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Галерея UI-примитивов */
export function GuideElementGalleryVisual({ t }: { t: InstructionsTheme }) {
  const items = [
    { id: 'button', node: <Button>Отправить</Button> },
    { id: 'input', node: <Input placeholder="Email" /> },
    {
      id: 'card',
      node: (
        <Card className="w-full max-w-xs">
          <CardHeader>
            <CardTitle>Заголовок</CardTitle>
          </CardHeader>
          <CardContent>Текст карточки</CardContent>
        </Card>
      )
    },
    { id: 'alert', node: <Alert variant="info">Сообщение для пользователя</Alert> },
    { id: 'badge', node: <Badge>New</Badge> }
  ]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Примеры UI Elements (живые компоненты)</VisualLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map(({ id, node }) => (
          <div
            key={id}
            className="flex flex-col rounded-xl overflow-hidden"
            style={{ border: `1px solid ${t.divider}` }}
          >
            <p
              className="px-2 py-1 text-[10px] font-semibold capitalize"
              style={{ background: t.inputBg, color: t.textMuted }}
            >
              {id}
            </p>
            <div className="flex min-h-[72px] items-center justify-center p-3">
              <DemoLightSurface t={t}>{node}</DemoLightSurface>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Emmet до / после */
export function GuideEmmetVisual({ t }: { t: InstructionsTheme }) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Emmet в preview.tsx — нажмите Tab</VisualLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg p-3" style={{ background: t.bg, border: `1px solid ${t.divider}` }}>
          <p className="mb-1 text-[9px] font-semibold" style={{ color: t.textMuted }}>
            Вы вводите
          </p>
          <code className="text-sm font-semibold" style={{ color: t.accent }}>
            .card&gt;h2{'{'}Заголовок{'}'}+p{'{'}Текст{'}'}+button
          </code>
          <button
            type="button"
            className="mt-3 flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium"
            style={{ background: t.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
            onClick={() => setExpanded(true)}
          >
            Tab <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div
          className="rounded-lg p-3 transition-opacity"
          style={{
            background: t.bg,
            border: `1px solid ${expanded ? t.accent : t.divider}`,
            opacity: expanded ? 1 : 0.45
          }}
        >
          <p className="mb-1 text-[9px] font-semibold" style={{ color: t.textMuted }}>
            Получаете (JSX)
          </p>
          <pre className="overflow-x-auto text-[10px] leading-relaxed" style={{ color: t.textSecondary }}>
            {expanded
              ? `<div className="card">
  <h2>Заголовок</h2>
  <p>Текст</p>
  <button></button>
</div>`
              : '…развернётся после Tab'}
          </pre>
        </div>
      </div>
    </div>
  )
}

/** Дерево файлов IDE */
export function GuideIdeTreeVisual({ t }: { t: InstructionsTheme }) {
  const files = [
    { name: 'preview.tsx', icon: FileCode2, highlight: true },
    { name: 'style.css', icon: Code2, highlight: false },
    { name: 'script.js', icon: Code2, highlight: false },
    { name: 'meta.json', icon: FileCode2, highlight: false },
    { name: 'images/thumb.svg', icon: FolderTree, highlight: false }
  ]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Файлы компонента в IDE</VisualLabel>
      <div
        className="rounded-xl p-3 font-mono text-[11px]"
        style={{ background: t.bg, border: `1px solid ${t.divider}` }}
      >
        <p style={{ color: t.accent }}>packages/blocks/src/templates/component/</p>
        <p className="ml-2" style={{ color: t.textSecondary }}>
          component-01/
        </p>
        {files.map(({ name, icon: Icon, highlight }) => (
          <div
            key={name}
            className="ml-6 flex items-center gap-2 rounded px-2 py-1"
            style={highlight ? { background: `${t.accent}18`, color: t.accent } : { color: t.textMuted }}
          >
            <Icon className="h-3 w-3 shrink-0" />
            {name}
            {highlight ? <span className="text-[9px]">← разметка</span> : null}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px]" style={{ color: t.textMuted }}>
        Сохранили в IDE → обновите `/builder` — стили и разметка подтянутся с диска.
      </p>
    </div>
  )
}

/** Пошаговый визуальный сценарий для верстальщика */
export function GuideElementWorkflowVisual({ t }: { t: InstructionsTheme }) {
  const steps = [
    { icon: SquarePlus, label: 'New → Component', desc: 'Пустой холст' },
    { icon: Pencil, label: 'Edit Component', desc: 'Вкл. UI Elements' },
    { icon: Plus, label: 'Insert → Button', desc: 'Добавить элемент' },
    { icon: MousePointer2, label: 'Inspector', desc: 'Править props' },
    { icon: Code2, label: 'preview.tsx', desc: 'Доработка в IDE' }
  ]
  const [step, setStep] = React.useState(0)

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Пошагово — нажимайте шаги</VisualLabel>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((item, index) => {
          const Icon = item.icon
          const active = step === index
          return (
            <button
              key={item.label}
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-left"
              style={{
                background: active ? `${t.accent}22` : t.inputBg,
                border: `1px solid ${active ? t.accent : t.divider}`,
                cursor: 'pointer',
                flex: '1 1 140px'
              }}
              onClick={() => setStep(index)}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: active ? t.accent : t.panelElevated, color: active ? '#fff' : t.textMuted }}
              >
                {index + 1}
              </span>
              <span>
                <span className="block text-[10px] font-semibold" style={{ color: active ? t.accent : t.text }}>
                  {item.label}
                </span>
                <span className="block text-[9px]" style={{ color: t.textMuted }}>
                  {item.desc}
                </span>
              </span>
              <Icon className="ml-auto h-3.5 w-3.5 shrink-0" style={{ color: active ? t.accent : t.textMuted }} />
            </button>
          )
        })}
      </div>
      <div
        className="mt-3 flex items-center justify-center rounded-xl p-6"
        style={{ background: '#ebebeb', border: `1px solid ${t.divider}`, minHeight: 100 }}
      >
        {step === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-white px-8 py-6 text-center text-sm text-neutral-500">
            component-XX на canvas
          </div>
        ) : step === 1 ? (
          <div className="rounded-lg border-2 p-4" style={{ borderColor: t.accent, background: '#fff' }}>
            <MockBtn label="Edit Component ON" active accent={t.accent} muted={t.textMuted} />
          </div>
        ) : step === 2 ? (
          <DemoLightSurface t={t}>
            <Button>Новая кнопка</Button>
          </DemoLightSurface>
        ) : step === 3 ? (
          <div className="flex gap-3">
            <DemoLightSurface t={t}>
              <Button variant="outline">Отправить</Button>
            </DemoLightSurface>
            <div className="w-28 rounded-lg p-2 text-[9px]" style={{ background: t.panel, border: `1px solid ${t.divider}` }}>
              label: Отправить
            </div>
          </div>
        ) : (
          <pre
            className="w-full max-w-sm overflow-x-auto rounded-lg p-3 text-[10px] leading-relaxed"
            style={{ background: '#1e1e1e', color: '#9cdcfe' }}
          >
            {`export function Preview() {
  return <div className="card">…
}`}
          </pre>
        )}
      </div>
    </div>
  )
}

/** Hero block — quick page demo */
export function GuidePageBlockVisual({ t }: { t: InstructionsTheme }) {
  return (
    <div className="mb-4">
      <VisualLabel t={t}>Page block на странице (пример Hero)</VisualLabel>
      <DemoLightSurface t={t}>
        <div className="rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 px-6 py-8 text-white">
          <p className="text-[10px] uppercase opacity-80">Hero — секция страницы</p>
          <h3 className="mt-1 text-xl font-bold">Заголовок лендинга</h3>
          <p className="mt-2 text-sm opacity-90">Подзаголовок и CTA — правятся в Inspector без кода</p>
          <Button className="mt-4" variant="secondary">
            Начать
          </Button>
        </div>
      </DemoLightSurface>
    </div>
  )
}

/** Export buttons mock */
export function GuideExportVisual({ t }: { t: InstructionsTheme }) {
  return (
    <div className="mb-4">
      <VisualLabel t={t}>Экспорт из шапки Builder</VisualLabel>
      <div className="flex flex-wrap gap-2">
        {['JSON', 'HTML', 'Export Bitrix'].map((label, i) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[11px] font-medium"
            style={{
              background: i === 2 ? t.accent : t.inputBg,
              color: i === 2 ? '#fff' : t.textSecondary,
              border: `1px solid ${i === 2 ? t.accent : t.divider}`
            }}
          >
            {i === 2 ? <Boxes className="h-3.5 w-3.5" /> : null}
            {label}
          </span>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px]" style={{ color: t.textMuted }}>
        <ChevronRight className="h-3 w-3" />
        Bitrix zip → local/components/randee/…
      </p>
    </div>
  )
}

/** Touch gestures */
export function GuideTouchVisual({ t }: { t: InstructionsTheme }) {
  const gestures = [
    { emoji: '🤏', title: 'Pinch', desc: 'Масштаб canvas' },
    { emoji: '✌️', title: '2 пальца', desc: 'Панорама (Pan)' },
    { emoji: '👆', title: 'Long press', desc: 'Меню блока' },
    { emoji: '↕️', title: 'Drag в Blocks', desc: 'Смена порядка' }
  ]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Жесты на iPad</VisualLabel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {gestures.map((g) => (
          <div
            key={g.title}
            className="rounded-xl p-3 text-center"
            style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
          >
            <span className="text-2xl">{g.emoji}</span>
            <p className="mt-1 text-[11px] font-semibold" style={{ color: t.text }}>
              {g.title}
            </p>
            <p className="text-[9px]" style={{ color: t.textMuted }}>
              {g.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export type GuideVisualId =
  | 'layout'
  | 'insert-compare'
  | 'element-workflow'
  | 'element-canvas'
  | 'element-gallery'
  | 'emmet'
  | 'ide-tree'
  | 'page-block'
  | 'export'
  | 'touch'
  | 'panels'

export function GuideSectionVisual({ visualId, t }: { visualId: GuideVisualId; t: InstructionsTheme }) {
  switch (visualId) {
    case 'layout':
      return <GuideBuilderLayoutVisual t={t} />
    case 'insert-compare':
      return <GuideInsertCompareVisual t={t} />
    case 'element-workflow':
      return <GuideElementWorkflowVisual t={t} />
    case 'element-canvas':
      return <GuideElementCanvasVisual t={t} />
    case 'element-gallery':
      return <GuideElementGalleryVisual t={t} />
    case 'emmet':
      return <GuideEmmetVisual t={t} />
    case 'ide-tree':
      return <GuideIdeTreeVisual t={t} />
    case 'page-block':
      return <GuidePageBlockVisual t={t} />
    case 'export':
      return <GuideExportVisual t={t} />
    case 'touch':
      return <GuideTouchVisual t={t} />
    case 'panels':
      return <GuideBuilderLayoutVisual t={t} />
    default:
      return null
  }
}
