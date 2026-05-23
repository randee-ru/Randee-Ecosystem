'use client'

import * as React from 'react'
import {
  Component,
  GripVertical,
  Home,
  LayoutTemplate,
  PanelLeftClose,
  Plus,
  Search
} from 'lucide-react'
import type { BlockType, PageBlock } from '@randee/builder'
import type { BuilderStore } from '@randee/builder'
import type { StoreApi } from 'zustand'

type LeftTab = 'pages' | 'layers' | 'assets'
type AssetSection = 'templates' | 'components' | 'styles' | 'vectors' | 'code'

type LibraryVariant = {
  type: BlockType
  group: string
  name: string
  template: string
  description: string
}

type PanelTheme = {
  panel: string
  divider: string
  text: string
  textSecondary: string
  textMuted: string
  hover: string
  active: string
  inputBg: string
  accent: string
  segmentTrack: string
  segmentActive: string
  segmentShadow: string
}

const LEFT_TABS: Array<{ id: LeftTab; label: string }> = [
  { id: 'pages', label: 'Pages' },
  { id: 'layers', label: 'Layers' },
  { id: 'assets', label: 'Assets' }
]

const ASSET_SECTIONS: Array<{ id: AssetSection; label: string }> = [
  { id: 'templates', label: 'Templates' },
  { id: 'components', label: 'Components' },
  { id: 'styles', label: 'Styles' },
  { id: 'vectors', label: 'Vectors' },
  { id: 'code', label: 'Code' }
]

export type { LeftTab }

type BuilderLeftPanelProps = {
  t: PanelTheme
  leftTab: LeftTab
  onLeftTabChange: (tab: LeftTab) => void
  librarySearch: string
  onLibrarySearchChange: (value: string) => void
  page: { page: string; slug: string; blocks: PageBlock[] }
  store: StoreApi<BuilderStore>
  activeId: string | null
  dragId: string | null
  onDragIdChange: (id: string | null) => void
  filteredVariants: LibraryVariant[]
  groupedVariants: Record<string, LibraryVariant[]>
  onAddVariant: (item: LibraryVariant) => void
  onClose: () => void
}

function searchPlaceholder(tab: LeftTab) {
  if (tab === 'pages') return 'Search pages...'
  if (tab === 'layers') return 'Search layers...'
  return 'Search...'
}

export function BuilderLeftPanel({
  t,
  leftTab,
  onLeftTabChange,
  librarySearch,
  onLibrarySearchChange,
  page,
  store,
  activeId,
  dragId,
  onDragIdChange,
  filteredVariants,
  groupedVariants,
  onAddVariant,
  onClose
}: BuilderLeftPanelProps) {
  const [expandedSections, setExpandedSections] = React.useState<Record<AssetSection, boolean>>({
    templates: true,
    components: false,
    styles: false,
    vectors: false,
    code: false
  })

  const searchQuery = librarySearch.trim().toLowerCase()

  const filteredLayers = page.blocks.filter((item) => {
    if (!searchQuery) return true
    return [item.type, item.template, item.id].join(' ').toLowerCase().includes(searchQuery)
  })

  const filteredPages = React.useMemo(() => {
    if (!searchQuery) return true
    return [page.page, page.slug].join(' ').toLowerCase().includes(searchQuery)
  }, [page.page, page.slug, searchQuery])

  const toggleSection = (id: AssetSection) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isSectionOpen = (id: AssetSection) => {
    if (id === 'components' && searchQuery && filteredVariants.length > 0) return true
    return expandedSections[id]
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-2 py-2" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div
          className="flex min-w-0 flex-1 rounded-lg p-0.5"
          style={{ background: t.segmentTrack }}
          role="tablist"
          aria-label="Sidebar tabs"
        >
          {LEFT_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={leftTab === id}
              className="h-7 min-w-0 flex-1 truncate rounded-md px-1 text-xs font-medium"
              style={{
                background: leftTab === id ? t.segmentActive : 'transparent',
                boxShadow: leftTab === id ? t.segmentShadow : 'none',
                color: leftTab === id ? t.text : t.textMuted,
                border: 'none',
                cursor: 'pointer'
              }}
              onClick={() => onLeftTabChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="hide-blocks-panel"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={onClose}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
          <span className="sr-only">Hide panel</span>
        </button>
      </div>

      <div className="px-2 py-2" style={{ borderBottom: `1px solid ${t.divider}` }}>
        <div
          className="flex items-center gap-2 rounded-full px-3"
          style={{ background: t.inputBg }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
          <input
            className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{ color: t.text, border: 'none' }}
            value={librarySearch}
            onChange={(event) => onLibrarySearchChange(event.target.value)}
            placeholder={searchPlaceholder(leftTab)}
            aria-label="Search sidebar"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {leftTab === 'pages' ? (
          filteredPages ? (
            <div className="py-1">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left"
                style={{ background: t.active, border: 'none', cursor: 'pointer' }}
              >
                <Home className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: t.text }}>
                  {page.page}
                </span>
              </button>
              <p className="px-3 pb-2 text-[11px]" style={{ color: t.textMuted }}>
                {page.slug}
              </p>
            </div>
          ) : (
            <p className="px-3 py-4 text-xs" style={{ color: t.textMuted }}>
              No pages found.
            </p>
          )
        ) : null}

        {leftTab === 'layers' ? (
          <div className="py-1">
            {filteredLayers.map((item) => {
              const layerIndex = page.blocks.findIndex((entry) => entry.id === item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={() => onDragIdChange(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!dragId) return
                    const from = page.blocks.findIndex((entry) => entry.id === dragId)
                    if (from >= 0 && from !== layerIndex) store.getState().moveBlock(from, layerIndex)
                    onDragIdChange(null)
                  }}
                  onClick={() => store.getState().selectBlock(item.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
                  style={{
                    background: activeId === item.id ? `${t.accent}18` : 'transparent',
                    color: activeId === item.id ? t.text : t.textSecondary,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(event) => {
                    if (activeId !== item.id) event.currentTarget.style.background = t.hover
                  }}
                  onMouseLeave={(event) => {
                    if (activeId !== item.id) event.currentTarget.style.background = 'transparent'
                  }}
                >
                  <GripVertical className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  <span className="min-w-0 flex-1 truncate text-xs">{item.type}</span>
                  <span className="text-[10px]" style={{ color: t.textMuted }}>
                    {layerIndex + 1}
                  </span>
                </button>
              )
            })}
            {filteredLayers.length === 0 ? (
              <p className="px-3 py-4 text-xs" style={{ color: t.textMuted }}>
                {page.blocks.length === 0 ? 'No layers yet. Add components from Assets.' : 'No layers found.'}
              </p>
            ) : null}
          </div>
        ) : null}

        {leftTab === 'assets' ? (
          <div className="py-0">
            {ASSET_SECTIONS.map(({ id, label }, index) => {
              const open = isSectionOpen(id)
              const hasDivider = index > 0

              return (
                <section key={id}>
                  {hasDivider ? <div className="h-px" style={{ background: t.divider }} /> : null}
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => toggleSection(id)}
                    aria-expanded={open}
                  >
                    <span className="text-xs font-semibold" style={{ color: t.text }}>
                      {label}
                    </span>
                    <Plus
                      className="h-3.5 w-3.5 shrink-0 transition-transform"
                      style={{
                        color: t.textMuted,
                        transform: open ? 'rotate(45deg)' : 'none'
                      }}
                    />
                  </button>

                  {open ? (
                    <div className="pb-2">
                      {id === 'templates' ? (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.background = t.hover
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <LayoutTemplate className="h-3.5 w-3.5 shrink-0" style={{ color: '#7c3aed' }} />
                          <span className="text-xs" style={{ color: t.textSecondary }}>
                            Template
                          </span>
                        </button>
                      ) : null}

                      {id === 'components' ? (
                        <>
                          {Object.entries(groupedVariants).map(([group, items]) => (
                            <div key={group}>
                              {Object.keys(groupedVariants).length > 1 ? (
                                <p
                                  className="px-3 pb-0.5 pt-1 text-[10px] font-medium uppercase tracking-wide"
                                  style={{ color: t.textMuted }}
                                >
                                  {group}
                                </p>
                              ) : null}
                              {items.map((item) => (
                                <button
                                  key={`${item.group}-${item.template}`}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                                  onMouseEnter={(event) => {
                                    event.currentTarget.style.background = t.hover
                                  }}
                                  onMouseLeave={(event) => {
                                    event.currentTarget.style.background = 'transparent'
                                  }}
                                  onClick={() => onAddVariant(item)}
                                >
                                  <Component className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
                                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: t.textSecondary }}>
                                    {item.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))}
                          {filteredVariants.length === 0 ? (
                            <p className="px-3 py-1 text-xs" style={{ color: t.textMuted }}>
                              No components found.
                            </p>
                          ) : null}
                        </>
                      ) : null}

                      {id !== 'templates' && id !== 'components' ? (
                        <p className="px-3 py-1 text-xs" style={{ color: t.textMuted }}>
                          No {label.toLowerCase()} yet.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
