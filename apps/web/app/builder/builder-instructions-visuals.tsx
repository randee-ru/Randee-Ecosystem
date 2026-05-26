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

/** ── CMS workflow: подключить → инфоблок → привязать → превью → PHP ── */
export function GuideCmsWorkflowVisual({ t }: { t: InstructionsTheme }) {
  const [step, setStep] = React.useState(0)

  const steps = [
    { num: '1', emoji: '🔌', title: 'Подключить', color: '#3b82f6', desc: 'CMS таб → URL сайта + API key → Сохранить → Проверить' },
    { num: '2', emoji: '📋', title: 'Инфоблок', color: '#8b5cf6', desc: 'Обновить список → выбрать нужный инфоблок (например «Новости [ID:5]»)' },
    { num: '3', emoji: '🔗', title: 'Привязать', color: '#06b6d4', desc: 'NAME → заголовок · PREVIEW_TEXT → текст · PREVIEW_PICTURE → картинка' },
    { num: '4', emoji: '👁️', title: 'Превью', color: '#10b981', desc: 'Реальные данные из Битрикса отображаются прямо на canvas' },
    { num: '5', emoji: '📦', title: 'PHP', color: '#f59e0b', desc: 'Export Bitrix → component.php с CIBlockElement::GetList' }
  ]

  const current = steps[step]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Битрикс CMS — пошаговый сценарий</VisualLabel>

      <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl p-2 text-center"
              style={{
                background: step === i ? `${s.color}20` : t.inputBg,
                border: `2px solid ${step === i ? s.color : t.divider}`,
                cursor: 'pointer',
                minWidth: 66
              }}
            >
              <span className="text-xl">{s.emoji}</span>
              <span className="text-[9px] font-bold" style={{ color: step === i ? s.color : t.textMuted }}>
                {s.title}
              </span>
            </button>
            {i < steps.length - 1 ? (
              <ChevronRight className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <div className="rounded-xl p-4" style={{ background: t.inputBg, border: `2px solid ${current.color}44` }}>
        <div className="mb-3 flex items-start gap-3">
          <span className="text-3xl">{current.emoji}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: current.color }}>
              Шаг {step + 1}: {current.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: t.textSecondary }}>
              {current.desc}
            </p>
          </div>
        </div>

        {step === 0 ? (
          <div className="rounded-lg p-3" style={{ background: t.bg, border: `1px solid ${t.divider}` }}>
            {[
              { label: 'Site URL', value: 'https://example.com' },
              { label: 'API Key', value: '●●●●●●●●●●●●' },
              { label: 'Connector Path', value: '/local/modules/randee.connector/...' }
            ].map((field) => (
              <div key={field.label} className="mb-2 flex items-center gap-2">
                <span className="w-24 shrink-0 text-[10px]" style={{ color: t.textMuted }}>
                  {field.label}
                </span>
                <div
                  className="flex-1 rounded px-2 py-1.5 text-[10px] font-mono"
                  style={{ background: t.inputBg, border: `1px solid ${t.divider}`, color: t.text }}
                >
                  {field.value}
                </div>
              </div>
            ))}
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
              style={{ background: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f640' }}
            >
              ✓ Подключено
            </span>
          </div>
        ) : step === 1 ? (
          <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${t.divider}` }}>
            {[
              { id: '5', name: 'Новости', active: true },
              { id: '8', name: 'Каталог', active: false },
              { id: '12', name: 'Акции', active: false }
            ].map((ib) => (
              <div
                key={ib.id}
                className="flex items-center gap-2 px-3 py-2 text-[11px]"
                style={{
                  background: ib.active ? '#8b5cf618' : 'transparent',
                  borderLeft: `3px solid ${ib.active ? '#8b5cf6' : 'transparent'}`,
                  borderBottom: `1px solid ${t.divider}`,
                  color: ib.active ? '#8b5cf6' : t.textSecondary
                }}
              >
                <span style={{ color: t.textMuted }}>ID:{ib.id}</span>
                <span className="font-medium">{ib.name}</span>
                {ib.active ? <span className="ml-auto text-[9px]">✓ выбран</span> : null}
              </div>
            ))}
          </div>
        ) : step === 2 ? (
          <div className="grid gap-1.5">
            {[
              { prop: 'Заголовок (title)', field: 'NAME', bg: '#06b6d4' },
              { prop: 'Текст (text)', field: 'PREVIEW_TEXT', bg: '#06b6d4' },
              { prop: 'Картинка (src)', field: 'PREVIEW_PICTURE', bg: '#06b6d4' }
            ].map((b) => (
              <div
                key={b.prop}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: t.bg, border: `1px solid ${t.divider}` }}
              >
                <span className="flex-1 text-[11px]" style={{ color: t.text }}>
                  {b.prop}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" style={{ color: b.bg }} />
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold"
                  style={{ background: `${b.bg}18`, color: b.bg }}
                >
                  {b.field}
                </span>
              </div>
            ))}
          </div>
        ) : step === 3 ? (
          <div className="rounded-lg p-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="mb-2 text-[9px] font-bold uppercase text-green-600">Живой превью — реальные данные из Битрикса</p>
            {[
              { title: 'Новый продукт запущен', text: 'Краткое описание из инфоблока' },
              { title: 'Акция на лето', text: 'Специальное предложение...' }
            ].map((item, i) => (
              <div key={i} className="mb-2 flex gap-2 rounded-lg bg-white p-2">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg"
                  style={{ background: '#e5e7eb' }}
                >
                  🖼️
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-neutral-800">{item.title}</p>
                  <p className="text-[10px] text-neutral-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <pre
            className="overflow-x-auto rounded-lg p-3 text-[10px] leading-relaxed"
            style={{ background: '#1e1e1e', color: '#9cdcfe', fontFamily: 'ui-monospace, Menlo, monospace' }}
          >
            {`$rs = CIBlockElement::GetList(\n  array('SORT' => 'ASC', 'ID' => 'DESC'),\n  array('IBLOCK_ID' => 5, 'ACTIVE' => 'Y'),\n  false,\n  array('nTopCount' => 10),\n  array('ID', 'NAME', 'PREVIEW_TEXT',\n        'PREVIEW_PICTURE')\n);`}
          </pre>
        )}
      </div>
    </div>
  )
}

/** ── Варианты блоков A/B/C ── */
export function GuideBlockVariantsVisual({ t }: { t: InstructionsTheme }) {
  const [variant, setVariant] = React.useState<'A' | 'B' | 'C'>('A')

  const variants = {
    A: { bg: 'linear-gradient(135deg,#1e40af,#3b82f6)', text: 'Вариант A — тёмный', btn: '#fff', btnText: '#1e40af' },
    B: { bg: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', text: 'Вариант B — светлый', btn: '#16a34a', btnText: '#fff' },
    C: {
      bg: 'linear-gradient(135deg,#fefce8,#fef9c3)',
      text: 'Вариант C — акцентный',
      btn: '#ca8a04',
      btnText: '#fff'
    }
  }

  const v = variants[variant]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Переключение вариантов блока — нажмите A / B / C</VisualLabel>

      <div className="mb-2 flex gap-1.5">
        {(['A', 'B', 'C'] as const).map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => setVariant(letter)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold"
            style={{
              background: variant === letter ? t.accent : t.inputBg,
              color: variant === letter ? '#fff' : t.textSecondary,
              border: `2px solid ${variant === letter ? t.accent : t.divider}`,
              cursor: 'pointer'
            }}
          >
            {letter}
          </button>
        ))}
        <span className="ml-2 self-center text-[11px]" style={{ color: t.textMuted }}>
          Inspector → Variant
        </span>
      </div>

      <div
        className="overflow-hidden rounded-xl transition-all"
        style={{ background: v.bg, border: `1px solid ${t.divider}` }}
      >
        <div className="px-6 py-8">
          <p
            className="text-[10px] font-semibold uppercase opacity-70"
            style={{ color: variant === 'A' ? '#93c5fd' : '#6b7280' }}
          >
            Hero — {v.text}
          </p>
          <h3
            className="mt-1 text-lg font-bold"
            style={{ color: variant === 'A' ? '#fff' : '#111827' }}
          >
            Заголовок лендинга
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: variant === 'A' ? '#bfdbfe' : '#6b7280' }}
          >
            Подзаголовок блока
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: v.btn, color: v.btnText, border: 'none', cursor: 'default' }}
          >
            Начать →
          </button>
        </div>
      </div>

      <p className="mt-2 text-[10px]" style={{ color: t.textMuted }}>
        Выберите вариант в Inspector → поле Variant — блок перерисуется без правки кода.
      </p>
    </div>
  )
}

/** ── Быстрое редактирование на canvas без Редактора ── */
export function GuideQuickInspectorVisual({ t }: { t: InstructionsTheme }) {
  const [selected, setSelected] = React.useState(false)
  const [title, setTitle] = React.useState('Добро пожаловать')
  const [subtitle, setSubtitle] = React.useState('Ваш новый лендинг')

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Кликните по блоку на canvas → Inspector справа</VisualLabel>
      <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
        {/* Canvas */}
        <button
          type="button"
          onClick={() => setSelected(true)}
          className="overflow-hidden rounded-xl text-left"
          style={{
            border: `2px solid ${selected ? t.accent : t.divider}`,
            background: '#f0f4ff',
            cursor: 'pointer',
            boxShadow: selected ? `0 0 0 3px ${t.accent}33` : 'none'
          }}
        >
          <div className="px-6 py-8">
            {selected ? (
              <span
                className="mb-2 inline-block rounded px-2 py-0.5 text-[9px] font-bold"
                style={{ background: t.accent, color: '#fff' }}
              >
                ✓ выбран
              </span>
            ) : (
              <span
                className="mb-2 inline-block rounded px-2 py-0.5 text-[9px]"
                style={{ background: t.inputBg, color: t.textMuted, border: `1px solid ${t.divider}` }}
              >
                кликните
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
            <div
              className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: t.accent }}
            >
              Начать
            </div>
          </div>
        </button>

        {/* Inspector */}
        <div className="rounded-xl p-3" style={{ background: t.panel, border: `1px solid ${selected ? t.accent : t.divider}` }}>
          <p className="mb-2 text-[9px] font-bold uppercase" style={{ color: t.textMuted }}>
            Inspector
          </p>
          {selected ? (
            <div className="space-y-2">
              <div>
                <label className="block text-[9px] mb-0.5" style={{ color: t.textMuted }}>title</label>
                <input
                  className="w-full rounded px-2 py-1 text-[11px]"
                  style={{ background: t.inputBg, border: `1px solid ${t.accent}`, color: t.text }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[9px] mb-0.5" style={{ color: t.textMuted }}>subtitle</label>
                <input
                  className="w-full rounded px-2 py-1 text-[11px]"
                  style={{ background: t.inputBg, border: `1px solid ${t.divider}`, color: t.text }}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
              <div
                className="rounded px-2 py-1 text-[10px]"
                style={{ background: `${t.accent}12`, color: t.accent, border: `1px solid ${t.accent}30` }}
              >
                ✓ Изменения сразу на canvas
              </div>
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center rounded-lg" style={{ background: t.inputBg }}>
              <p className="text-center text-[10px]" style={{ color: t.textMuted }}>
                ← кликните блок
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** ── Большой онбординг для новичка: первая страница за 5 шагов ── */
export function GuideNewbieFirstPageVisual({ t }: { t: InstructionsTheme }) {
  const [step, setStep] = React.useState(0)

  const steps = [
    {
      emoji: '🗂️',
      title: 'Insert → Hero',
      desc: 'Нажмите Insert вверху → выберите Hero. Блок появится на странице.',
      color: '#3b82f6'
    },
    {
      emoji: '🖱️',
      title: 'Кликните блок',
      desc: 'Кликните по блоку Hero на canvas. Справа откроется Inspector.',
      color: '#8b5cf6'
    },
    {
      emoji: '✏️',
      title: 'Правим текст',
      desc: 'В Inspector найдите поле title — введите свой заголовок. Изменение видно сразу.',
      color: '#06b6d4'
    },
    {
      emoji: '💾',
      title: 'Сохранить',
      desc: 'Нажмите «Save page now» в шапке или ⌘S. Статус «Saved» — всё в порядке.',
      color: '#10b981'
    },
    {
      emoji: '📤',
      title: 'Export Bitrix',
      desc: 'Нажмите «Export Bitrix» — скачается zip для загрузки на ваш сайт Битрикс.',
      color: '#f59e0b'
    }
  ]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Первая страница — 5 шагов для новичка</VisualLabel>

      <div className="mb-3 grid grid-cols-5 gap-1">
        {steps.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-center"
            style={{
              background: step === i ? `${s.color}18` : t.inputBg,
              border: `2px solid ${step === i ? s.color : t.divider}`,
              cursor: 'pointer'
            }}
          >
            <span className="text-xl">{s.emoji}</span>
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
              style={{ background: step === i ? s.color : t.panelElevated, color: step === i ? '#fff' : t.textMuted }}
            >
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: `${steps[step].color}0c`, border: `2px solid ${steps[step].color}33` }}
      >
        <div className="flex items-start gap-4">
          <span className="text-4xl">{steps[step].emoji}</span>
          <div>
            <p className="text-base font-bold" style={{ color: steps[step].color }}>
              {step + 1}. {steps[step].title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: t.textSecondary }}>
              {steps[step].desc}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium"
              style={{ background: t.inputBg, color: t.textSecondary, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
            >
              ← Назад
            </button>
          ) : null}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-lg px-3 py-1.5 text-[11px] font-medium"
              style={{ background: steps[step].color, color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Далее →
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold"
              style={{ background: '#10b98118', color: '#10b981', border: '1px solid #10b98140' }}
            >
              🎉 Готово! Первая страница создана
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/** ── Схема панелей со стрелками и подписями ── */
export function GuidePanelsMapVisual({ t }: { t: InstructionsTheme }) {
  const panels = [
    { side: 'left', name: 'Blocks', color: '#3b82f6', items: ['Структура страницы', 'Код файлов', 'Rename / Delete'] },
    { side: 'left', name: 'Assets', color: '#8b5cf6', items: ['Компоненты', 'UI Elements', 'CSS/JS библиотеки'] },
    { side: 'left', name: 'Pages', color: '#06b6d4', items: ['Список страниц', 'New / Rename', 'Delete'] },
    { side: 'right', name: 'Inspector', color: '#f59e0b', items: ['Props блока', 'CMS привязка', 'Artboard size'] }
  ]

  return (
    <div className="mb-4">
      <VisualLabel t={t}>Панели интерфейса</VisualLabel>
      <div className="grid gap-2 sm:grid-cols-2">
        {panels.map((p) => (
          <div
            key={p.name}
            className="rounded-xl p-3"
            style={{ background: `${p.color}0c`, border: `1px solid ${p.color}30` }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded px-2 py-0.5 text-[10px] font-bold"
                style={{ background: p.color, color: '#fff' }}
              >
                {p.side === 'left' ? '← ' : '→ '}{p.name}
              </span>
            </div>
            <ul className="space-y-0.5">
              {p.items.map((item) => (
                <li key={item} className="flex items-center gap-1 text-[11px]" style={{ color: t.textSecondary }}>
                  <span style={{ color: p.color }}>·</span> {item}
                </li>
              ))}
            </ul>
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
  | 'cms-workflow'
  | 'block-variants'
  | 'quick-inspector'
  | 'newbie-first-page'
  | 'panels-map'

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
    case 'cms-workflow':
      return <GuideCmsWorkflowVisual t={t} />
    case 'block-variants':
      return <GuideBlockVariantsVisual t={t} />
    case 'quick-inspector':
      return <GuideQuickInspectorVisual t={t} />
    case 'newbie-first-page':
      return <GuideNewbieFirstPageVisual t={t} />
    case 'panels-map':
      return <GuidePanelsMapVisual t={t} />
    default:
      return null
  }
}
