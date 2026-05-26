'use client'

import * as React from 'react'
import type { PageBlock, BuilderStore, ElementVariant } from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getElementVariant } from '@randee/blocks'
import { BuilderElementPicker } from './builder-element-picker'
import { ChevronRight, Layers, Plus, Search } from 'lucide-react'

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
}

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
}: Props) {
  const elements = block?.elements ?? []
  const [addOpen, setAddOpen] = React.useState(false)
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">

      {/* ── Layer tree ───────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <Layers className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
        <span className="flex-1 text-[11px] font-semibold" style={{ color: t.text }}>
          Слои компонента
        </span>
        {elements.length > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
            style={{ background: t.inputBg, color: t.textMuted }}
          >
            {elements.length}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
        {elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
            <div
              className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: t.inputBg }}
            >
              <Layers className="h-6 w-6" style={{ color: t.textMuted }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
              Компонент пуст
            </p>
            <p className="mt-1 text-[10px]" style={{ color: t.textMuted }}>
              Добавьте элементы через панель снизу
            </p>
          </div>
        ) : (
          renderTree(null, 0)
        )}
      </div>

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

      {/* ── Add Element panel ─────────────────────────── */}
      <div style={{ borderTop: `1px solid ${t.divider}` }}>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => setAddOpen((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
          <span className="flex-1 text-left text-[11px] font-semibold" style={{ color: t.text }}>
            Добавить элемент
          </span>
          <ChevronRight
            className="h-3.5 w-3.5 shrink-0 transition-transform"
            style={{
              color: t.textMuted,
              transform: addOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {addOpen ? (
          <div style={{ borderTop: `1px solid ${t.divider}` }}>
            {/* Search inside element picker */}
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={{ borderBottom: `1px solid ${t.divider}` }}
            >
              <Search className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
              <input
                className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"
                style={{ color: t.text, border: 'none' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск элементов…"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {typeof onAddElement === 'function' ? (
                <BuilderElementPicker
                  variants={elementVariants}
                  searchQuery={search}
                  t={t}
                  onSelect={(v) => {
                    onAddElement(v)
                    setAddOpen(false)
                  }}
                  maxHeightClassName="max-h-60"
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
