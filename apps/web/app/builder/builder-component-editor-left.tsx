'use client'

import * as React from 'react'
import type { PageBlock, BuilderStore, ElementVariant } from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getElementVariant } from '@randee/blocks'
import { BuilderElementPicker } from './builder-element-picker'
import { BuilderConceptsGuide, BuilderStepsStrip } from './builder-concepts-guide'
import { getBlockDisplayName } from '@randee/builder'
import { ChevronRight, Layers, ListTree, Plus, Search, X } from 'lucide-react'

// ─── Theme ──────────────────────────────────────────────────────────────────
type Theme = {
  text: string
  textMuted: string
  textSecondary: string
  hover: string
  active: string
  accent: string
  divider: string
  inputBg: string
  panel: string
  menu: string
  menuBorder: string
}

type Props = {
  t: Theme
  block: PageBlock | undefined
  store: StoreApi<BuilderStore>
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onAddElement?: (variant: ElementVariant) => void
  elementVariants?: ElementVariant[]
  onExitEdit?: () => void
}

const QUICK_ADD: Array<{ id: string; label: string; char: string; color: string }> = [
  { id: 'container', label: 'Блок', char: '▣', color: '#3b82f6' },
  { id: 'heading', label: 'Заголовок', char: 'H', color: '#22c55e' },
  { id: 'text', label: 'Текст', char: 'T', color: '#22c55e' },
  { id: 'button', label: 'Кнопка', char: '◉', color: '#a855f7' },
  { id: 'image', label: 'Картинка', char: '⊟', color: '#f97316' },
  { id: 'text-field', label: 'Поле', char: '▭', color: '#ec4899' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ELEMENT_COLORS: Record<string, string> = {
  container: '#3b82f6',
  columns: '#06b6d4',
  column: '#06b6d4',
  heading: '#22c55e',
  text: '#22c55e',
  paragraph: '#22c55e',
  button: '#a855f7',
  image: '#f97316',
  link: '#eab308',
  'text-field': '#ec4899',
}
function elementColor(id: string) {
  return ELEMENT_COLORS[id] ?? '#64748b'
}

const ELEMENT_LABELS: Record<string, string> = {
  container: 'контейнер',
  columns: 'колонки',
  column: 'колонка',
  heading: 'заголовок',
  text: 'текст',
  paragraph: 'параграф',
  button: 'кнопка',
  image: 'картинка',
  link: 'ссылка',
  'text-field': 'поле',
}
function elementTypeLabel(id: string) {
  return ELEMENT_LABELS[id] ?? id
}

function getColumnsCount(element: { elementId: string; props?: Record<string, string> }) {
  if (element.elementId !== 'columns') return 0
  return Math.max(1, Math.min(16, Number(element.props?.columns ?? '2') || 2))
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ComponentEditorLeftPanel({
  t,
  block,
  store,
  selectedElementId,
  onSelectElement,
  onAddElement,
  elementVariants,
  onExitEdit,
}: Props) {
  const elements = block?.elements ?? []
  const [panelTab, setPanelTab] = React.useState<'structure' | 'add'>('structure')
  const [addOpen, setAddOpen] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [menu, setMenu] = React.useState<{ id: string; x: number; y: number } | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)

  // Close context menu on outside click
  React.useEffect(() => {
    if (!menu) return
    const onDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setMenu(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [menu])

  // Build parent → children map
  const byParent = React.useMemo(() => {
    const map = new Map<string | null, typeof elements>()
    for (const el of elements) {
      const pid = el.parentId ?? null
      if (!map.has(pid)) map.set(pid, [])
      map.get(pid)!.push(el)
    }
    return map
  }, [elements])

  function renderElementNode(el: (typeof elements)[number], depth: number): React.ReactNode {
    const selected = selectedElementId === el.id
    const hasKids = (byParent.get(el.id)?.length ?? 0) > 0
    const color = elementColor(el.elementId)
    const label = el.name ?? getElementVariant(el.elementId)?.name ?? el.elementId
    const typeLabel = elementTypeLabel(el.elementId)

    return (
      <button
        type="button"
        className="flex w-full items-center gap-1.5 rounded-md py-[5px] pr-1 text-left"
        style={{
          paddingLeft: 8 + depth * 14,
          background: selected ? `${t.accent}1a` : 'transparent',
          border: `1px solid ${selected ? `${t.accent}55` : 'transparent'}`,
          cursor: 'pointer',
        }}
        onClick={() => onSelectElement?.(el.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          onSelectElement?.(el.id)
          setMenu({ id: el.id, x: e.clientX, y: e.clientY })
        }}
      >
        <span
          className="shrink-0 rounded-sm"
          style={{ width: 8, height: 8, background: color, opacity: selected ? 1 : 0.7 }}
        />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium" style={{ color: selected ? t.text : t.textSecondary }}>
          {label}
        </span>
        <span className="shrink-0 text-[9px] uppercase tracking-wide" style={{ color: t.textMuted }}>
          {typeLabel}
        </span>
        {hasKids ? (
          <ChevronRight className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
        ) : (
          <span className="h-3 w-3 shrink-0" />
        )}
      </button>
    )
  }

  function renderTree(parentId: string | null, depth: number): React.ReactNode {
    const children = byParent.get(parentId)
    if (!children?.length) return null
    return children.map((el) => {
      if (el.elementId !== 'columns') {
        return (
          <React.Fragment key={el.id}>
            {renderElementNode(el, depth)}
            {renderTree(el.id, depth + 1)}
          </React.Fragment>
        )
      }

      const columnCount = getColumnsCount(el)
      const columnChildren = byParent.get(el.id) ?? []
      const buckets: typeof columnChildren[] = Array.from({ length: columnCount }, () => [])
      columnChildren.forEach((child, index) => {
        buckets[index % columnCount].push(child)
      })

      return (
        <React.Fragment key={el.id}>
          {renderElementNode(el, depth)}
          <div className="mt-0.5 grid gap-1" style={{ paddingLeft: 8 + (depth + 1) * 14 }}>
            {buckets.map((bucket, colIndex) => {
              const columnLabel = `col-${colIndex + 1}`
              return (
                <div key={`${el.id}-${columnLabel}`} className="grid gap-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-1.5 rounded-md py-[4px] pr-1 text-left"
                    style={{
                      background: 'transparent',
                      border: `1px dashed ${t.divider}`,
                      cursor: 'default',
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span
                      className="shrink-0 rounded-sm"
                      style={{ width: 8, height: 8, background: elementColor('container'), opacity: 0.65 }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium" style={{ color: t.textSecondary }}>
                      {columnLabel}
                    </span>
                    <span className="shrink-0 text-[9px] uppercase tracking-wide" style={{ color: t.textMuted }}>
                      {bucket.length}
                    </span>
                  </button>
                  <div className="grid gap-1">
                    {bucket.length > 0
                      ? bucket.map((child) => (
                          <React.Fragment key={child.id}>{renderTreeNode(child, depth + 2)}</React.Fragment>
                        ))
                      : (
                        <p className="px-2 py-1 text-[10px]" style={{ color: t.textMuted }}>
                          Пусто
                        </p>
                        )}
                  </div>
                </div>
              )
            })}
          </div>
        </React.Fragment>
      )
    })
  }

  function renderTreeNode(el: (typeof elements)[number], depth: number): React.ReactNode {
    return (
      <React.Fragment key={el.id}>
        {renderElementNode(el, depth)}
        {renderTree(el.id, depth + 1)}
      </React.Fragment>
    )
  }

  const displayName = block ? getBlockDisplayName(block) : 'Компонент'

  function quickAdd(catalogId: string) {
    const variant = getElementVariant(catalogId) ?? elementVariants?.find((v) => v.id === catalogId)
    if (variant && onAddElement) {
      onAddElement(variant)
      setPanelTab('structure')
    }
  }

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
        <p className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
          Выберите компонент на странице
        </p>
        <p className="mt-1 text-[10px]" style={{ color: t.textMuted }}>
          Вкладка «Компоненты» → «Редактировать»
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Шапка компонента */}
      <div className="shrink-0 px-2 pt-2">
        <div
          className="rounded-lg p-2.5"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.28)' }}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#A855F7' }}>
                Редактирование
              </p>
              <p className="truncate text-[12px] font-semibold" style={{ color: t.text }}>
                {displayName}
              </p>
              <p className="text-[9px]" style={{ color: t.textMuted }}>
                {block.template} · элементов: {elements.length}
              </p>
            </div>
            {onExitEdit ? (
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ background: t.inputBg, border: `1px solid ${t.divider}`, cursor: 'pointer', color: t.textMuted }}
                title="Выйти к странице"
                onClick={onExitEdit}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <BuilderConceptsGuide t={t} variant="component-edit" />

      {/* Вкладки: структура / добавить */}
      <div className="grid shrink-0 grid-cols-2 gap-1 px-2 py-1">
        <TabChip active={panelTab === 'structure'} label="Структура" icon={ListTree} t={t} onClick={() => setPanelTab('structure')} />
        <TabChip active={panelTab === 'add'} label="Добавить" icon={Plus} t={t} onClick={() => setPanelTab('add')} />
      </div>

      {panelTab === 'structure' ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
            {elements.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
                <Layers className="mb-2 h-8 w-8" style={{ color: t.textMuted }} />
                <p className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
                  Пока пусто
                </p>
                <button
                  type="button"
                  className="mt-3 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-white"
                  style={{ background: '#A855F7', border: 'none', cursor: 'pointer' }}
                  onClick={() => setPanelTab('add')}
                >
                  + Добавить элемент
                </button>
              </div>
            ) : (
              renderTree(null, 0)
            )}
          </div>
          <BuilderStepsStrip t={t} steps={['Выбрать', 'Править справа', 'Или dbl-click']} />
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="px-3 py-1 text-[10px]" style={{ color: t.textMuted }}>
            Быстрое добавление:
          </p>
          <div className="grid grid-cols-3 gap-1 px-2 pb-2">
            {QUICK_ADD.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex flex-col items-center gap-0.5 rounded-lg py-2"
                style={{ background: t.inputBg, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
                onClick={() => quickAdd(item.id)}
              >
                <span className="text-sm font-bold" style={{ color: item.color }}>
                  {item.char}
                </span>
                <span className="text-[9px] font-medium" style={{ color: t.textSecondary }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div style={{ borderTop: `1px solid ${t.divider}` }}>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setAddOpen((v) => !v)}
            >
              <Search className="h-3.5 w-3.5" style={{ color: t.textMuted }} />
              <span className="flex-1 text-left text-[11px] font-semibold" style={{ color: t.text }}>
                Все элементы
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 transition-transform"
                style={{ color: t.textMuted, transform: addOpen ? 'rotate(90deg)' : undefined }}
              />
            </button>
            {addOpen ? (
              <div className="border-t px-1 pb-2" style={{ borderColor: t.divider }}>
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <input
                    className="min-w-0 flex-1 rounded-md px-2 py-1 text-[11px] outline-none"
                    style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск…"
                  />
                </div>
                {onAddElement ? (
                  <BuilderElementPicker
                    variants={elementVariants}
                    searchQuery={search}
                    t={t}
                    onSelect={(v) => {
                      onAddElement(v)
                      setPanelTab('structure')
                    }}
                    maxHeightClassName="max-h-52"
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Context menu */}
      {menu && block ? (
        <div
          ref={menuRef}
          className="fixed z-[200] w-44 overflow-hidden rounded-lg shadow-2xl"
          style={{ left: menu.x, top: menu.y, background: t.menu, border: `1px solid ${t.menuBorder}` }}
        >
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px]"
            style={{ color: t.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => {
              store.getState().duplicateElement(block.id, menu.id)
              setMenu(null)
            }}
          >
            Дублировать
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px]"
            style={{ color: t.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => {
              store.getState().moveElementDirection(block.id, menu.id, 'up')
              setMenu(null)
            }}
          >
            Переместить вверх
          </button>
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px]"
            style={{ color: t.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => {
              store.getState().moveElementDirection(block.id, menu.id, 'down')
              setMenu(null)
            }}
          >
            Переместить вниз
          </button>
          <div style={{ height: 1, background: t.menuBorder }} />
          <button
            type="button"
            className="block w-full px-3 py-2 text-left text-[12px]"
            style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#2a1010' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => {
              store.getState().removeElement(block.id, menu.id)
              setMenu(null)
            }}
          >
            Удалить элемент
          </button>
        </div>
      ) : null}

    </div>
  )
}

function TabChip({
  active,
  label,
  icon: Icon,
  t,
  onClick
}: {
  active: boolean
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  t: Theme
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-semibold"
      style={{
        background: active ? 'rgba(168,85,247,0.15)' : t.inputBg,
        border: `1px solid ${active ? 'rgba(168,85,247,0.4)' : t.divider}`,
        color: active ? t.text : t.textMuted,
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  )
}
