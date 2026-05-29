'use client'

import * as React from 'react'
import { Copy, Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react'

export type ResizeEdge = 'right' | 'bottom' | 'corner-br'

export type BlockOverlayTheme = {
  accent: string
  text: string
  textMuted: string
  inputBg: string
}

export type BlockOverlayDragHandle = {
  listeners?: Record<string, React.EventHandler<React.SyntheticEvent>>
  attributes?: Record<string, unknown>
}

type CanvasBlockOverlayProps = {
  blockName: string
  selected: boolean
  hovered: boolean
  canvasTool: 'select' | 'pan'
  theme: BlockOverlayTheme
  isDragging: boolean
  dragHandle: BlockOverlayDragHandle
  isComponentType: boolean
  isHidden: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleHidden: () => void
  onResizeStart: (edge: ResizeEdge, event: React.PointerEvent) => void
}

const CORNER_SIZE = 7
const CORNER_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: CORNER_SIZE,
  height: CORNER_SIZE,
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 0 0 1.5px rgba(0,0,0,0.25)',
  pointerEvents: 'none'
}

export function CanvasBlockOverlay({
  blockName,
  selected,
  hovered,
  canvasTool,
  theme: t,
  isDragging,
  dragHandle,
  isComponentType,
  isHidden,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleHidden,
  onResizeStart
}: CanvasBlockOverlayProps) {
  if (canvasTool !== 'select' || isDragging) return null

  const show = selected || hovered
  const borderWidth = selected ? 2 : 1
  const borderColor = selected ? t.accent : `${t.accent}88`
  const labelBg = selected ? t.accent : `${t.accent}cc`
  const offset = -borderWidth

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 8 }}
    >
      {/* Border */}
      {show && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            outline: `${borderWidth}px solid ${borderColor}`,
            outlineOffset: offset
          }}
        />
      )}

      {/* Corner handles when selected — white circles, Framer-style */}
      {selected && (
        <>
          <div style={{ ...CORNER_STYLE, top: -4, left: -4 }} />
          <div style={{ ...CORNER_STYLE, top: -4, right: -4 }} />
          <div style={{ ...CORNER_STYLE, bottom: -4, left: -4 }} />
          <div style={{ ...CORNER_STYLE, bottom: -4, right: -4 }} />
        </>
      )}

      {/* Label chip + drag handle */}
      {show && (
        <div
          className="pointer-events-auto absolute left-0 top-0 flex items-center gap-0.5"
          style={{ background: labelBg, borderBottomRightRadius: 6, userSelect: 'none' }}
        >
          <div
            className="flex h-6 w-6 cursor-grab items-center justify-center active:cursor-grabbing"
            style={{ color: 'rgba(255,255,255,0.9)' }}
            suppressHydrationWarning
            {...(dragHandle.listeners ?? {})}
            {...(dragHandle.attributes ?? {})}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <span className="select-none pr-2 text-[10px] font-medium leading-none text-white">
            {blockName}
          </span>
        </div>
      )}

      {/* Action buttons — only when selected */}
      {selected && (
        <div
          className="pointer-events-auto absolute right-1.5 top-1.5 flex items-center gap-0.5 overflow-hidden rounded-lg"
          style={{
            zIndex: 9,
            background: 'rgba(18,18,20,0.88)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}
        >
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: 'transparent', color: isHidden ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isHidden ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)' }}
            title={isHidden ? 'Показать блок' : 'Скрыть блок'}
            onClick={(e) => { e.stopPropagation(); onToggleHidden() }}
          >
            {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            title="Edit component"
            onClick={(e) => { e.stopPropagation(); onEdit() }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            title="Duplicate"
            onClick={(e) => { e.stopPropagation(); onDuplicate() }}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center"
            style={{ background: 'transparent', color: 'rgba(239,68,68,0.8)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(239,68,68,0.8)' }}
            title="Delete"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Resize handles — component blocks only, when selected */}
      {selected && isComponentType && (
        <>
          {/* Right edge */}
          <div
            className="pointer-events-auto absolute bottom-[25%] right-0 top-[25%]"
            style={{ width: 12, cursor: 'ew-resize', transform: 'translateX(50%)' }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart('right', e) }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-8 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: t.accent, opacity: 0.75 }}
            />
          </div>

          {/* Bottom edge */}
          <div
            className="pointer-events-auto absolute bottom-0 left-[25%] right-[25%]"
            style={{ height: 12, cursor: 'ns-resize', transform: 'translateY(50%)' }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart('bottom', e) }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: t.accent, opacity: 0.75 }}
            />
          </div>

          {/* Bottom-right corner */}
          <div
            className="pointer-events-auto absolute bottom-0 right-0 flex h-5 w-5 items-end justify-end"
            style={{ cursor: 'nwse-resize', transform: 'translate(50%, 50%)' }}
            onPointerDown={(e) => { e.stopPropagation(); onResizeStart('corner-br', e) }}
          >
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: t.accent, border: '1.5px solid #fff' }}
            />
          </div>
        </>
      )}
    </div>
  )
}
