'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

type LayerContextMenuProps = {
  x: number
  y: number
  items: Array<{ label: string; onSelect: () => void; disabled?: boolean }>
  onClose: () => void
  theme: {
    panel: string
    divider: string
    text: string
    hover: string
    textMuted: string
  }
}

export function LayerContextMenu({ x, y, items, onClose, theme }: LayerContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[160px] overflow-hidden rounded-lg py-1 shadow-xl"
      style={{
        left: x,
        top: y,
        background: theme.panel,
        border: `1px solid ${theme.divider}`
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          disabled={item.disabled}
          className="builder-touch-target flex w-full px-3 py-2.5 text-left text-xs sm:py-1.5"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: item.disabled ? 'default' : 'pointer',
            color: item.disabled ? theme.textMuted : theme.text,
            opacity: item.disabled ? 0.45 : 1
          }}
          onClick={() => {
            if (item.disabled) return
            item.onSelect()
            onClose()
          }}
          onMouseEnter={(event) => {
            if (item.disabled) return
            event.currentTarget.style.background = theme.hover
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'transparent'
          }}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  )
}
