'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

export type ContextMenuItem = {
  label: string
  onSelect?: () => void
  disabled?: boolean
  /** Если задано — при наведении показывает вложенное подменю */
  submenu?: Array<{ label: string; onSelect: () => void }>
}

type LayerContextMenuProps = {
  x: number
  y: number
  items: ContextMenuItem[]
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
  const [openSubmenuIndex, setOpenSubmenuIndex] = React.useState<number | null>(null)

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
      className="fixed z-[100] min-w-[160px] overflow-visible rounded-lg py-1 shadow-xl"
      style={{ left: x, top: y, background: theme.panel, border: `1px solid ${theme.divider}` }}
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          style={{ position: 'relative' }}
          onMouseEnter={() => item.submenu ? setOpenSubmenuIndex(index) : setOpenSubmenuIndex(null)}
          onMouseLeave={() => setOpenSubmenuIndex(null)}
        >
          <button
            type="button"
            disabled={item.disabled}
            className="builder-touch-target flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left text-xs sm:py-1.5"
            style={{
              background: openSubmenuIndex === index ? theme.hover : 'transparent',
              border: 'none',
              cursor: item.disabled ? 'default' : 'pointer',
              color: item.disabled ? theme.textMuted : theme.text,
              opacity: item.disabled ? 0.45 : 1,
            }}
            onClick={() => {
              if (item.disabled || item.submenu) return
              item.onSelect?.()
              onClose()
            }}
            onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = theme.hover }}
            onMouseLeave={e => { if (openSubmenuIndex !== index) e.currentTarget.style.background = 'transparent' }}
          >
            <span>{item.label}</span>
            {item.submenu && (
              <span style={{ fontSize: 9, color: theme.textMuted, marginLeft: 'auto' }}>▶</span>
            )}
          </button>

          {/* Flyout подменю */}
          {item.submenu && openSubmenuIndex === index && (
            <div
              className="fixed z-[101] min-w-[150px] rounded-lg py-1 shadow-xl"
              style={{
                left: x + (menuRef.current?.offsetWidth ?? 160) - 4,
                top: y + (menuRef.current?.children[index] as HTMLElement | undefined)?.offsetTop ?? 0,
                background: theme.panel,
                border: `1px solid ${theme.divider}`,
              }}
            >
              {item.submenu.map(sub => (
                <button
                  key={sub.label}
                  type="button"
                  className="builder-touch-target flex w-full px-3 py-2.5 text-left text-xs sm:py-1.5"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.text }}
                  onMouseEnter={e => { e.currentTarget.style.background = theme.hover }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { sub.onSelect(); onClose() }}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>,
    document.body
  )
}
