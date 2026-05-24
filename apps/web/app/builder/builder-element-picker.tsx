'use client'

import * as React from 'react'
import type { ElementVariant } from '@randee/builder'
import { groupElementVariants, listElementVariants } from '@randee/blocks'

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

  if (filtered.length === 0) {
    return (
      <p className="px-2 py-3 text-xs" style={{ color: t.textMuted }}>
        No UI elements found.
      </p>
    )
  }

  return (
    <div className={`overflow-y-auto ${maxHeightClassName}`}>
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="mb-1">
          <p
            className="sticky top-0 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: t.textMuted, background: 'inherit' }}
          >
            {group}
          </p>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full flex-col rounded-md px-2 py-2 text-left"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(event) => {
                event.currentTarget.style.background = t.hover
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.background = 'transparent'
              }}
              onClick={() => onSelect(item)}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: t.text }}>
                  {item.name}
                </span>
                {item.ready ? (
                  <span
                    className="rounded px-1 py-0.5 text-[9px] font-medium uppercase"
                    style={{ background: `${t.accent}22`, color: t.accent }}
                  >
                    UI
                  </span>
                ) : (
                  <span className="text-[9px] uppercase" style={{ color: t.textMuted }}>
                    stub
                  </span>
                )}
              </span>
              <span className="text-[10px]" style={{ color: t.textSecondary }}>
                {item.description}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
