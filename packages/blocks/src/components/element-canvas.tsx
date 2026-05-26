'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import type { ComponentElement } from '@randee/builder'

// ─── Types ──────────────────────────────────────────────────────────────────

export type CanvasElementOptions = {
  selectedElementId?: string | null
  onSelectElement?: (elementId: string) => void
  onDeleteElement?: (elementId: string) => void
  onDuplicateElement?: (elementId: string) => void
  onRenameElement?: (elementId: string, name: string) => void
  onMoveElement?: (elementId: string, direction: 'up' | 'down') => void
  onDropElement?: (
    catalogElementId: string,
    placement?: { parentId?: string | null; afterElementId?: string | null; beforeElementId?: string | null }
  ) => void
  viewport?: 'desktop' | 'macbook' | 'tablet' | 'mobile'
  /** Показывать визуальный preview компонента (не tree-view), даже когда onDropElement есть */
  forceVisual?: boolean
  /** Double-click inline edit: обновить props элемента */
  onPatchElementProps?: (elementId: string, props: Record<string, string>) => void
}

type DragState = {
  elementId: string
  startX: number
  startY: number
  currentX: number
  currentY: number
  active: boolean
}

type DropTarget = {
  zone: 'before' | 'after' | 'inside'
  targetElementId: string
  parentId: string | null
}

type ContextMenu = {
  elementId: string
  x: number
  y: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function elementsByParent(elements: ComponentElement[]): Map<string | null, ComponentElement[]> {
  const map = new Map<string | null, ComponentElement[]>()
  for (const el of elements) {
    const pid = el.parentId ?? null
    const list = map.get(pid) ?? []
    list.push(el)
    map.set(pid, list)
  }
  return map
}

function isContainer(el: ComponentElement) {
  return el.elementId === 'container' || el.elementId === 'columns'
}

type ElementCategory = 'layout' | 'content' | 'interactive' | 'media' | 'overlay' | 'other'

function elementCategory(elementId: string): ElementCategory {
  if (['container', 'columns', 'separator', 'surface', 'scroll-shadow', 'slider'].includes(elementId)) return 'layout'
  if (['text', 'paragraph', 'heading', 'typography', 'badge', 'chip', 'breadcrumbs', 'pagination'].includes(elementId)) return 'content'
  if (['button', 'toggle-button', 'close-button', 'link', 'input', 'text-field', 'text-area', 'number-field',
       'search-field', 'combo-box', 'autocomplete', 'select', 'list-box', 'checkbox', 'switch', 'radio-group',
       'accordion', 'disclosure', 'tabs', 'form'].includes(elementId)) return 'interactive'
  if (['image', 'video', 'avatar', 'icon'].includes(elementId)) return 'media'
  if (['modal', 'alert-dialog', 'drawer', 'popover', 'tooltip'].includes(elementId)) return 'overlay'
  return 'other'
}

const CATEGORY_COLOR: Record<ElementCategory, string> = {
  layout: '#3b82f6',     // синий — структура
  content: '#22c55e',    // зелёный — контент
  interactive: '#a855f7', // фиолетовый — интерактив
  media: '#f97316',      // оранжевый — медиа
  overlay: '#64748b',    // серый — оверлей
  other: '#94a3b8',      // серый — прочее
}

function elementIcon(elementId: string): string {
  const icons: Record<string, string> = {
    button: '⬤',
    container: '▭',
    columns: '⣿',
    text: 'T',
    paragraph: '¶',
    heading: 'H',
    image: '⊡',
    video: '▷',
    input: '▱',
    'text-field': '▱',
    'text-area': '▱',
    select: '▾',
    checkbox: '☑',
    switch: '⊙',
    'radio-group': '◎',
    card: '▬',
    badge: '⬡',
    chip: '⬡',
    alert: '▲',
    accordion: '☰',
    tabs: '⊟',
    table: '⊞',
    modal: '⊡',
    drawer: '▶',
    tooltip: '◦',
    breadcrumbs: '›',
    pagination: '«»',
    loader: '⟳',
    skeleton: '▭',
    separator: '─',
    avatar: '◯',
    icon: '★',
    form: '▤',
    link: '⇗',
    slider: '⟺',
  }
  return icons[elementId] ?? '◻'
}

function elementPreviewText(element: ComponentElement): string | null {
  const id = element.elementId
  const p = element.props ?? {}
  if (id === 'heading' || id === 'text' || id === 'paragraph' || id === 'typography') {
    return (p.label ?? p.text ?? p.title ?? '') as string || null
  }
  if (id === 'button' || id === 'toggle-button' || id === 'link') {
    return (p.label ?? '') as string || null
  }
  if (id === 'badge' || id === 'chip') {
    return (p.label ?? '') as string || null
  }
  if (id === 'image') {
    return (p.alt ?? p.src ?? '') as string || null
  }
  if (id === 'columns') {
    const cols = p.columns ?? '2'
    return `${cols} кол.`
  }
  if (id === 'input' || id === 'text-field') {
    return (p.placeholder ?? p.label ?? '') as string || null
  }
  return null
}

// ─── Element Row ─────────────────────────────────────────────────────────────

function ElementRow({
  element,
  depth,
  selected,
  isOver,
  overZone,
  onPointerDown,
  onPointerEnter,
  onClick,
  onContextMenu,
  children,
}: {
  element: ComponentElement
  depth: number
  selected: boolean
  isOver: boolean
  overZone: 'before' | 'after' | 'inside' | null
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onPointerEnter: (e: React.PointerEvent, id: string) => void
  onClick: (e: React.MouseEvent, id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
  children?: React.ReactNode
}) {
  const nestable = isContainer(element)
  const name = element.name ?? element.elementId
  const icon = elementIcon(element.elementId)
  const category = elementCategory(element.elementId)
  const accentColor = CATEGORY_COLOR[category]
  const preview = elementPreviewText(element)

  return (
    <div
      data-canvas-element={element.id}
      style={{ position: 'relative' }}
    >
      {/* Drop indicator BEFORE */}
      {isOver && overZone === 'before' ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: depth * 20,
            right: 0,
            top: -1,
            height: 2,
            background: '#6366f1',
            borderRadius: 999,
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      ) : null}

      {/* Element itself */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: depth * 20 + 8,
          paddingRight: 8,
          height: 32,
          borderRadius: 6,
          cursor: 'grab',
          userSelect: 'none',
          background: selected
            ? `${accentColor}18`
            : isOver && overZone === 'inside'
            ? 'rgba(99,102,241,0.08)'
            : 'transparent',
          outline: selected ? `1px solid ${accentColor}55` : 'none',
          outlineOffset: -1,
          transition: 'background 0.1s',
          boxSizing: 'border-box',
        }}
        onPointerDown={(e) => onPointerDown(e, element.id)}
        onPointerEnter={(e) => onPointerEnter(e, element.id)}
        onClick={(e) => onClick(e, element.id)}
        onContextMenu={(e) => onContextMenu(e, element.id)}
      >
        {/* Category color dot */}
        <span
          style={{
            width: 3,
            height: 16,
            borderRadius: 999,
            background: selected ? accentColor : `${accentColor}60`,
            flexShrink: 0,
            transition: 'background 0.1s',
          }}
        />
        <span style={{ fontSize: 11, color: selected ? accentColor : '#64748b', flexShrink: 0, width: 14, textAlign: 'center', fontWeight: 600 }}>
          {icon}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: selected ? 600 : 400,
            color: selected ? accentColor : '#cbd5e1',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {name}
        </span>
        {/* Preview text (label/text/cols) */}
        {preview ? (
          <span
            style={{
              fontSize: 10,
              color: '#475569',
              maxWidth: 60,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {preview}
          </span>
        ) : null}
        {/* Nestable indicator */}
        {nestable && !preview ? (
          <span style={{ fontSize: 9, color: '#475569', flexShrink: 0 }}>
            {element.elementId === 'columns' ? '⣿' : '▭'}
          </span>
        ) : null}
      </div>

      {/* Nested children */}
      {children ? (
        <div
          style={{
            marginLeft: depth * 20 + 16,
            paddingLeft: 8,
            borderLeft: '1px solid rgba(148,163,184,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {children}
        </div>
      ) : null}

      {/* Drop indicator AFTER */}
      {isOver && overZone === 'after' ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: depth * 20,
            right: 0,
            bottom: -1,
            height: 2,
            background: '#6366f1',
            borderRadius: 999,
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      ) : null}
    </div>
  )
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenuPortal({
  menu,
  element,
  options,
  onClose,
}: {
  menu: ContextMenu
  element: ComponentElement | undefined
  options: CanvasElementOptions
  onClose: () => void
}) {
  const [renaming, setRenaming] = React.useState(false)
  const [renameValue, setRenameValue] = React.useState(element?.name ?? element?.elementId ?? '')
  const renameInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (renaming) {
      setTimeout(() => renameInputRef.current?.focus(), 10)
    }
  }, [renaming])

  React.useEffect(() => {
    const close = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-context-menu]')) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onScroll = () => onClose()
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc)
    window.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [onClose])

  const action = (fn: () => void) => {
    fn()
    onClose()
  }

  return createPortal(
    <div
      data-context-menu
      style={{
        position: 'fixed',
        left: Math.min(menu.x + 4, window.innerWidth - 220),
        top: Math.min(menu.y + 4, window.innerHeight - 300),
        width: 210,
        zIndex: 99999,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#1e2130',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        padding: 4,
        fontFamily: 'system-ui, sans-serif',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ padding: '6px 10px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 2 }}>
        {renaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (renameValue.trim()) options.onRenameElement?.(menu.elementId, renameValue.trim())
                onClose()
              }
              if (e.key === 'Escape') onClose()
            }}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid #6366f1',
              borderRadius: 4,
              color: '#f1f5f9',
              fontSize: 12,
              padding: '3px 6px',
              outline: 'none',
            }}
          />
        ) : (
          <p style={{ margin: 0, fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {element?.name ?? element?.elementId}
          </p>
        )}
      </div>

      {/* Actions */}
      {([
        {
          label: 'Дублировать',
          shortcut: '⌘D',
          icon: '⧉',
          action: () => action(() => options.onDuplicateElement?.(menu.elementId)),
          disabled: !options.onDuplicateElement,
        },
        {
          label: 'Переименовать',
          shortcut: '⌘R',
          icon: '✎',
          action: () => { setRenaming(true) },
          disabled: !options.onRenameElement,
        },
        { separator: true },
        {
          label: 'Вверх',
          shortcut: '↑',
          icon: '↑',
          action: () => action(() => options.onMoveElement?.(menu.elementId, 'up')),
          disabled: !options.onMoveElement,
        },
        {
          label: 'Вниз',
          shortcut: '↓',
          icon: '↓',
          action: () => action(() => options.onMoveElement?.(menu.elementId, 'down')),
          disabled: !options.onMoveElement,
        },
        { separator: true },
        {
          label: 'Удалить',
          shortcut: '⌫',
          icon: '🗑',
          action: () => action(() => options.onDeleteElement?.(menu.elementId)),
          disabled: !options.onDeleteElement,
          destructive: true,
        },
      ] as Array<{ separator?: boolean; label?: string; shortcut?: string; icon?: string; action?: () => void; disabled?: boolean; destructive?: boolean }>).map((item, i) =>
        item.separator ? (
          <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
        ) : (
          <button
            key={i}
            type="button"
            disabled={item.disabled}
            onClick={item.action}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '7px 10px',
              gap: 8,
              border: 'none',
              borderRadius: 6,
              background: item.destructive ? 'rgba(239,68,68,0.15)' : 'transparent',
              color: item.disabled
                ? '#475569'
                : item.destructive
                ? '#f87171'
                : '#e2e8f0',
              fontSize: 13,
              cursor: item.disabled ? 'default' : 'pointer',
              opacity: item.disabled ? 0.45 : 1,
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 11, width: 14, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ fontSize: 10, color: '#475569', flexShrink: 0 }}>{item.shortcut}</span>
          </button>
        )
      )}
    </div>,
    document.body
  )
}

// ─── Ghost (drag preview) ─────────────────────────────────────────────────────

function DragGhost({ name, x, y }: { name: string; x: number; y: number }) {
  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: x + 12,
        top: y + 8,
        padding: '4px 10px',
        borderRadius: 6,
        background: '#6366f1',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        pointerEvents: 'none',
        zIndex: 999999,
        boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </div>,
    document.body
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DRAG_THRESHOLD = 5

export function ElementCanvas({
  elements,
  options,
}: {
  elements: ComponentElement[]
  options: CanvasElementOptions
}) {
  const [dragState, setDragState] = React.useState<DragState | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null)
  const [contextMenu, setContextMenu] = React.useState<ContextMenu | null>(null)
  const canvasRef = React.useRef<HTMLDivElement>(null)

  const byParent = React.useMemo(() => elementsByParent(elements), [elements])

  // ─ Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!options.selectedElementId) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        options.onDeleteElement?.(options.selectedElementId)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        options.onDuplicateElement?.(options.selectedElementId)
      }
      if (e.key === 'ArrowUp' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        options.onMoveElement?.(options.selectedElementId, 'up')
      }
      if (e.key === 'ArrowDown' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        options.onMoveElement?.(options.selectedElementId, 'down')
      }
      if (e.key === 'Escape') {
        setContextMenu(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [options])

  // ─ Pointer move / up (global)
  React.useEffect(() => {
    if (!dragState) return

    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY
      const dist = Math.sqrt(dx * dx + dy * dy)

      const next: DragState = {
        ...dragState,
        currentX: e.clientX,
        currentY: e.clientY,
        active: dist > DRAG_THRESHOLD,
      }
      setDragState(next)

      if (!next.active) return

      // Find element under cursor (excluding the dragged element itself)
      const els = canvasRef.current?.querySelectorAll('[data-canvas-element]')
      if (!els) return

      let best: DropTarget | null = null

      for (const el of els) {
        const id = el.getAttribute('data-canvas-element')
        if (!id || id === dragState.elementId) continue

        const rect = el.getBoundingClientRect()
        if (e.clientY < rect.top || e.clientY > rect.bottom) continue
        if (e.clientX < rect.left - 40 || e.clientX > rect.right + 40) continue

        const yRatio = (e.clientY - rect.top) / rect.height
        const target = elements.find((item) => item.id === id)
        const nestable = target && isContainer(target)

        const zone: 'before' | 'after' | 'inside' =
          nestable && yRatio > 0.25 && yRatio < 0.75
            ? 'inside'
            : yRatio < 0.5
            ? 'before'
            : 'after'

        const parentId = target?.parentId ?? null
        best = { zone, targetElementId: id, parentId }
        break
      }

      setDropTarget(best)
    }

    const onUp = () => {
      if (dragState.active && dropTarget && options.onDropElement) {
        const { zone, targetElementId, parentId } = dropTarget
        const dragged = dragState.elementId

        if (zone === 'inside') {
          options.onDropElement(dragged, { parentId: targetElementId })
        } else if (zone === 'before') {
          options.onDropElement(dragged, { parentId, beforeElementId: targetElementId })
        } else {
          options.onDropElement(dragged, { parentId, afterElementId: targetElementId })
        }
      }
      setDragState(null)
      setDropTarget(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragState, dropTarget, elements, options])

  // ─ Render tree
  const renderBranch = (parentId: string | null, depth: number): React.ReactNode => {
    const branch = byParent.get(parentId) ?? []
    return branch.map((el) => {
      const children = byParent.get(el.id)
      const isOver = dropTarget?.targetElementId === el.id
      const overZone = isOver ? dropTarget.zone : null

      return (
        <ElementRow
          key={el.id}
          element={el}
          depth={depth}
          selected={options.selectedElementId === el.id}
          isOver={Boolean(isOver)}
          overZone={overZone ?? null}
          onPointerDown={(e, id) => {
            e.stopPropagation()
            if (e.button !== 0) return
            setDragState({
              elementId: id,
              startX: e.clientX,
              startY: e.clientY,
              currentX: e.clientX,
              currentY: e.clientY,
              active: false,
            })
          }}
          onPointerEnter={(e, _id) => {
            // handled by global pointermove
            void e
          }}
          onClick={(e, id) => {
            e.stopPropagation()
            if (!dragState?.active) options.onSelectElement?.(id)
          }}
          onContextMenu={(e, id) => {
            e.preventDefault()
            e.stopPropagation()
            options.onSelectElement?.(id)
            setContextMenu({ elementId: id, x: e.clientX, y: e.clientY })
          }}
        >
          {children?.length ? renderBranch(el.id, depth + 1) : undefined}
        </ElementRow>
      )
    })
  }

  const selectedElement = elements.find((el) => el.id === options.selectedElementId)

  return (
    <>
      <div
        ref={canvasRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          padding: 8,
          minHeight: 80,
          width: '100%',
          boxSizing: 'border-box',
          cursor: dragState?.active ? 'grabbing' : 'default',
          position: 'relative',
        }}
        onPointerDown={(e) => {
          // Click on empty canvas area → deselect
          if (e.target === e.currentTarget) options.onSelectElement?.('')
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {elements.length === 0 ? (
          <div
            style={{
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed rgba(148,163,184,0.5)',
              borderRadius: 8,
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            Добавьте первый элемент из панели →
          </div>
        ) : (
          renderBranch(null, 0)
        )}
      </div>

      {/* Drag ghost */}
      {dragState?.active ? (
        <DragGhost
          name={elements.find((el) => el.id === dragState.elementId)?.name ?? dragState.elementId}
          x={dragState.currentX}
          y={dragState.currentY}
        />
      ) : null}

      {/* Context menu */}
      {contextMenu ? (
        <ContextMenuPortal
          menu={contextMenu}
          element={selectedElement}
          options={options}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </>
  )
}
