'use client'

import * as React from 'react'
import type { ElementVariant } from '@randee/builder'
import { groupElementVariants, listElementVariants } from '@randee/blocks'
import {
  AlignLeft,
  AppWindow,
  BadgeCheck,
  CalendarDays,
  CheckSquare,
  CircleDot,
  Columns3,
  Component,
  FormInput,
  GalleryHorizontal,
  LayoutGrid,
  List,
  MenuSquare,
  MessageSquare,
  MousePointer,
  PanelTop,
  SlidersHorizontal,
  Table,
  TextCursorInput,
  ToggleLeft
} from 'lucide-react'

type ElementPickerTheme = {
  text: string
  textMuted: string
  textSecondary: string
  hover: string
  accent: string
}

type BuilderElementPickerProps = {
  variants?: ElementVariant[]
  searchQuery: string
  t: ElementPickerTheme
  onSelect: (variant: ElementVariant) => void
  maxHeightClassName?: string
}

function elementPriority(elementId: string) {
  if (elementId === 'container') return 0
  if (elementId === 'columns') return 1
  return 10
}

function elementIcon(elementId: string) {
  if (elementId.includes('button')) return MousePointer
  if (elementId.includes('input') || elementId.includes('field')) return TextCursorInput
  if (elementId.includes('form')) return FormInput
  if (elementId.includes('select') || elementId.includes('combo') || elementId.includes('autocomplete')) return List
  if (elementId.includes('checkbox')) return CheckSquare
  if (elementId.includes('radio')) return CircleDot
  if (elementId.includes('switch') || elementId.includes('toggle')) return ToggleLeft
  if (elementId.includes('tabs')) return Columns3
  if (elementId.includes('table')) return Table
  if (elementId.includes('card')) return LayoutGrid
  if (elementId.includes('badge') || elementId.includes('chip') || elementId.includes('tag')) return BadgeCheck
  if (elementId.includes('dropdown')) return MenuSquare
  if (elementId.includes('modal') || elementId.includes('dialog') || elementId.includes('drawer') || elementId.includes('popover')) return AppWindow
  if (elementId.includes('tooltip') || elementId.includes('alert') || elementId.includes('toast')) return MessageSquare
  if (elementId.includes('accordion') || elementId.includes('disclosure')) return PanelTop
  if (elementId.includes('breadcrumbs') || elementId.includes('pagination')) return GalleryHorizontal
  if (elementId.includes('calendar') || elementId.includes('date') || elementId.includes('time')) return CalendarDays
  if (elementId.includes('progress') || elementId.includes('meter') || elementId.includes('slider')) return SlidersHorizontal
  if (elementId.includes('typography') || elementId.includes('label') || elementId.includes('description')) return AlignLeft
  return Component
}

/** Цветовой акцент категории — делает плитки визуально различимыми */
function groupAccentColor(group: string): string {
  const lower = group.toLowerCase()
  if (lower.includes('layout') || lower.includes('структур') || lower.includes('layout')) return '#0099FF'
  if (lower.includes('form') || lower.includes('форм') || lower.includes('input')) return '#A855F7'
  if (lower.includes('nav') || lower.includes('навиг')) return '#10B981'
  if (lower.includes('data') || lower.includes('данные') || lower.includes('table')) return '#F59E0B'
  if (lower.includes('feedback') || lower.includes('оповещ') || lower.includes('overlay')) return '#EF4444'
  if (lower.includes('media') || lower.includes('медиа')) return '#EC4899'
  return '#0099FF'
}

export function BuilderElementPicker({
  variants = listElementVariants(),
  searchQuery,
  t,
  onSelect,
  maxHeightClassName = 'max-h-72'
}: BuilderElementPickerProps) {
  const query = searchQuery.trim().toLowerCase()
  const filtered = React.useMemo(() => {
    if (!query) return variants
    return variants.filter((item) =>
      [item.group, item.name, item.id, item.description].join(' ').toLowerCase().includes(query)
    )
  }, [query, variants])

  const grouped = React.useMemo(() => groupElementVariants(filtered), [filtered])
  const orderedGroups = React.useMemo(() => {
    const entries = Object.entries(grouped).map(([group, items]) => {
      const orderedItems = [...items].sort((a, b) => {
        const priorityDiff = elementPriority(a.id) - elementPriority(b.id)
        if (priorityDiff !== 0) return priorityDiff
        return a.name.localeCompare(b.name)
      })
      const groupPriority = orderedItems.some((item) => item.id === 'container' || item.id === 'columns') ? 0 : 1
      return { group, items: orderedItems, groupPriority }
    })

    return entries.sort((a, b) => {
      if (a.groupPriority !== b.groupPriority) return a.groupPriority - b.groupPriority
      return a.group.localeCompare(b.group)
    })
  }, [grouped])

  if (filtered.length === 0) {
    return (
      <p className="px-2 py-3 text-xs" style={{ color: t.textMuted }}>
        Элементы не найдены.
      </p>
    )
  }

  return (
    <div className={`overflow-y-auto ${maxHeightClassName}`}>
      {orderedGroups.map(({ group, items }) => {
        const accent = groupAccentColor(group)
        return (
          <div key={group} className="mb-2">
            {/* Заголовок группы */}
            <p
              className="sticky top-0 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: t.textMuted, background: 'inherit' }}
            >
              {group}
            </p>

            {/* Сетка плиток 3 колонки */}
            <div className="grid grid-cols-3 gap-1 px-1">
              {items.map((item) => {
                const Icon = elementIcon(item.id)
                return (
                  <ElementTile
                    key={item.id}
                    item={item}
                    Icon={Icon}
                    accent={accent}
                    t={t}
                    onSelect={onSelect}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Отдельный компонент плитки — useState для hover без re-render родителя */
function ElementTile({
  item,
  Icon,
  accent,
  t,
  onSelect,
}: {
  item: ElementVariant
  Icon: React.ComponentType<{ className?: string }>
  accent: string
  t: ElementPickerTheme
  onSelect: (v: ElementVariant) => void
}) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center"
      style={{
        background: hovered ? t.hover : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 120ms',
      }}
      title={item.description ?? item.name}
      draggable
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDragStart={(event) => {
        // Стильный drag-ghost: тёмный чип с именем элемента
        const ghost = document.createElement('div')
        ghost.style.cssText = [
          'position:fixed', 'left:-9999px', 'top:-9999px',
          'display:flex', 'align-items:center', 'gap:6px',
          'background:#1C1C1C', 'border:1px solid #303030',
          'border-radius:8px', 'padding:4px 10px 4px 8px',
          "font-family:Inter,system-ui,sans-serif", 'font-size:11px',
          'font-weight:500', 'color:#E8E8E8',
          'pointer-events:none', 'white-space:nowrap',
          'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
          'z-index:9999',
        ].join(';')
        ghost.textContent = item.name
        document.body.appendChild(ghost)
        event.dataTransfer.setDragImage(ghost, Math.round(ghost.offsetWidth / 2), 16)
        // Убираем после рендера
        requestAnimationFrame(() => ghost.remove())

        event.dataTransfer.setData('application/x-randee-element-id', item.id)
        event.dataTransfer.setData('text/plain', item.id)
        event.dataTransfer.effectAllowed = 'copy'
        window.dispatchEvent(
          new CustomEvent('randee:element-drag', {
            detail: { phase: 'start', elementId: item.id }
          })
        )
      }}
      onDragEnd={() => {
        window.dispatchEvent(
          new CustomEvent('randee:element-drag', {
            detail: { phase: 'end', elementId: null }
          })
        )
      }}
      onClick={() => onSelect(item)}
    >
      {/* Иконка */}
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: `${accent}22`,
          color: accent,
          transition: 'background 120ms',
          ...(hovered ? { background: `${accent}33` } : {}),
        }}
      >
        <Icon className="h-4 w-4" />
      </span>

      {/* Название */}
      <span
        className="line-clamp-2 w-full text-[10px] font-medium leading-tight"
        style={{ color: hovered ? t.text : t.textSecondary }}
      >
        {item.name}
      </span>

      {/* Точка-индикатор для ready-элементов */}
      {item.ready && (
        <span
          className="h-1 w-1 rounded-full"
          style={{ background: accent, opacity: 0.7 }}
        />
      )}
    </button>
  )
}
