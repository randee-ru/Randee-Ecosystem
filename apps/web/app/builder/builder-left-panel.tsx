'use client'

import * as React from 'react'
import {
  Boxes,
  Component,
  FileText,
  Home,
  Image,
  Layers,
  Search,
} from 'lucide-react'
import type { BuilderCmsConnection } from '@randee/builder'
import { BuilderCmsBrowser } from './builder-cms-browser'
import { isCmsConnectionConfigured } from './builder-cms-utils'
import type { ElementVariant, PageBlock } from '@randee/builder'
import type { BuilderStore } from '@randee/builder'
import type { LibraryVariant } from '@randee/blocks'
import type { StoreApi } from 'zustand'
import { BuilderLayerTree } from './builder-layer-tree'
import { BuilderAssetsComponentTree } from './builder-assets-component-tree'
import type { BuilderAssetTarget } from './builder-asset-types'
import { BuilderAssetsPanel } from './builder-assets-panel'
import { ComponentEditorLeftPanel } from './builder-component-editor-left'

export type SavedAssetComponent = {
  templateId: string
  name: string
  description: string
}

type LeftTab = 'pages' | 'blocks' | 'assets' | 'cms' | 'media'

type VendorLibrary = {
  id: string
  label: string
  description: string
  website: string
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

// ── Icon nav items ────────────────────────────────────────────────────────────
const NAV_TABS: Array<{ id: LeftTab; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string }> = [
  { id: 'pages',  icon: FileText,  label: 'Страницы'    },
  { id: 'blocks', icon: Layers,    label: 'Слои'        },
  { id: 'assets', icon: Component, label: 'Компоненты'  },
  { id: 'cms',    icon: Boxes,     label: 'CMS'         },
  { id: 'media',  icon: Image,     label: 'Медиа'       },
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
  filteredVariants: LibraryVariant[]
  groupedVariants: Record<string, LibraryVariant[]>
  onAddVariant: (item: LibraryVariant) => void
  onClose: () => void
  vendorLibraries: VendorLibrary[]
  pageVendors: string[]
  requiredVendors: string[]
  onToggleVendor: (vendorId: string) => void
  onOpenAsset: (asset: BuilderAssetTarget) => void
  activeAssetPath: string | null
  savedAssetComponents: SavedAssetComponent[]
  canvasTemplateIds: string[]
  onAddSavedComponent: (templateId: string, name: string) => void
  onRenameSavedComponent?: (templateId: string, name: string) => void
  onDeleteSavedComponent?: (templateId: string) => void
  onDuplicateComponent?: (templateId: string) => void
  onExportBlock?: (blockId: string) => void
  componentEditMode?: boolean
  onAddElement?: (variant: ElementVariant) => void
  elementVariants?: ElementVariant[]
  onSaveSelectedElementAsCustom?: () => void
  canSaveSelectedElementAsCustom?: boolean
  selectedElementId?: string | null
  onSelectElement?: (id: string | null) => void
  onCreatePage?: () => void
  onRefreshPages?: () => void
  pagesList?: Array<{ slug: string; page: string }>
  onOpenPage?: (slug: string) => void
  onDuplicatePage?: (slug: string) => void
  onRenamePage?: (slug: string) => void
  onDeletePage?: (slug: string) => void
  cmsConnection?: BuilderCmsConnection
  onOpenCmsSettings?: () => void
  onEditComponent?: () => void
  onNewComponent?: () => void
  onOpenComponentCode?: (block: PageBlock) => void
  onExitComponentEdit?: () => void
}

/** Отдельный компонент кнопки nav — локальный useState для tooltip */
function NavButton({
  id, active, label, Icon, t, onClick
}: {
  id: string
  active: boolean
  label: string
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  t: PanelTheme
  onClick: () => void
}) {
  const [showTooltip, setShowTooltip] = React.useState(false)
  return (
    <button
      type="button"
      data-testid={`left-tab-${id}`}
      aria-label={label}
      aria-pressed={active}
      className="flex h-7 w-7 items-center justify-center rounded-md"
      style={{
        background: active ? t.active : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active ? t.accent : t.textMuted,
        position: 'relative',
        transition: 'background 120ms, color 120ms',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = t.hover
        setShowTooltip(true)
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
        setShowTooltip(false)
      }}
      onClick={onClick}
    >
      {/* Active indicator — left accent bar */}
      {active ? (
        <span
          style={{
            position: 'absolute',
            left: -1,
            top: '20%',
            bottom: '20%',
            width: 2,
            borderRadius: 2,
            background: t.accent,
          }}
        />
      ) : null}
      <Icon className="h-3.5 w-3.5" />
      {showTooltip ? <NavTooltip label={label} panelBg={t.panel} /> : null}
    </button>
  )
}

/** Tooltip-чип, появляющийся справа от иконки nav */
function NavTooltip({ label, panelBg }: { label: string; panelBg: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 38,
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#111111',
        border: '1px solid #2C2C2C',
        borderRadius: 6,
        padding: '3px 9px',
        fontSize: 11,
        fontWeight: 500,
        color: '#E8E8E8',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 60,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        letterSpacing: '-0.01em',
      }}
    >
      {/* Arrow */}
      <span
        style={{
          position: 'absolute',
          left: -4,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderRight: '4px solid #2C2C2C',
        }}
      />
      {label}
    </div>
  )
}

function searchPlaceholder(tab: LeftTab) {
  if (tab === 'pages')  return 'Поиск страниц…'
  if (tab === 'blocks') return 'Поиск слоёв…'
  if (tab === 'assets') return 'Поиск компонентов…'
  if (tab === 'cms') return 'CMS Bitrix…'
  return 'Поиск…'
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
  filteredVariants,
  groupedVariants,
  onAddVariant,
  onClose,
  vendorLibraries,
  pageVendors,
  requiredVendors,
  onToggleVendor,
  onOpenAsset,
  activeAssetPath,
  savedAssetComponents,
  canvasTemplateIds,
  onAddSavedComponent,
  onRenameSavedComponent,
  onDeleteSavedComponent,
  onDuplicateComponent,
  onExportBlock,
  componentEditMode,
  onAddElement,
  elementVariants,
  onSaveSelectedElementAsCustom,
  canSaveSelectedElementAsCustom = false,
  selectedElementId,
  onSelectElement,
  onCreatePage,
  onRefreshPages,
  pagesList = [],
  onOpenPage,
  onDuplicatePage,
  onRenamePage,
  onDeletePage,
  cmsConnection,
  onOpenCmsSettings,
  onEditComponent,
  onNewComponent,
  onOpenComponentCode,
  onExitComponentEdit
}: BuilderLeftPanelProps) {
  const searchQuery = librarySearch.trim().toLowerCase()

  const filteredPages = React.useMemo(() => {
    const source = pagesList.length > 0 ? pagesList : [{ page: page.page, slug: page.slug }]
    if (!searchQuery) return source
    return source.filter((item) => [item.page, item.slug].join(' ').toLowerCase().includes(searchQuery))
  }, [page.page, page.slug, pagesList, searchQuery])

  const filteredVendors = React.useMemo(() => {
    if (!searchQuery) return vendorLibraries
    return vendorLibraries.filter((vendor) =>
      [vendor.label, vendor.description, vendor.id].join(' ').toLowerCase().includes(searchQuery)
    )
  }, [vendorLibraries, searchQuery])

  const groupedBuiltInVariants = React.useMemo(() => {
    const unique = new Map<string, LibraryVariant>()
    for (const item of filteredVariants) {
      if (!unique.has(item.template)) unique.set(item.template, item)
    }
    const builtIn = Array.from(unique.values())

    const grouped = builtIn.reduce<Record<string, LibraryVariant[]>>((acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), item]
      return acc
    }, {})

    const entries = Object.entries(grouped).map(([group, items]) => [
      group,
      [...items].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    ] as const)

    entries.sort((a, b) => {
      const ORDER = ['Hero', 'Features', 'FAQ', 'CTA', 'Catalog', 'News', 'Custom']
      const ai = ORDER.indexOf(a[0])
      const bi = ORDER.indexOf(b[0])
      const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai
      const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi
      if (av !== bv) return av - bv
      return a[0].localeCompare(b[0], 'ru')
    })

    return Object.fromEntries(entries)
  }, [filteredVariants])

  const showSearch = leftTab !== 'media' && leftTab !== 'cms'

  return (
    <div className="flex min-h-0 flex-1">

      {/* ── Icon nav strip ──────────────────────────────────────────── */}
      <nav
        className="flex shrink-0 flex-col items-center gap-0.5 py-2"
        style={{
          width: 36,
          borderRight: `1px solid ${t.divider}`,
        }}
        aria-label="Panel navigation"
      >
        {NAV_TABS.map(({ id, icon: Icon, label }) => {
          const active = leftTab === id
          return (
            <NavButton
              key={id}
              id={id}
              active={active}
              label={label}
              Icon={Icon}
              t={t}
              onClick={() => onLeftTabChange(id)}
            />
          )
        })}
      </nav>

      {/* ── Content area ────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col">

        {/* Tab header */}
        <div
          className="flex items-center px-3 py-2"
          style={{ borderBottom: `1px solid ${t.divider}` }}
        >
          <span className="flex-1 text-[11px] font-semibold" style={{ color: t.text }}>
            {NAV_TABS.find((tab) => tab.id === leftTab)?.label ?? ''}
          </span>
        </div>

        {/* Search (all tabs except media) */}
        {showSearch ? (
          <div
            className="flex items-center gap-2 px-2 py-1.5"
            style={{ borderBottom: `1px solid ${t.divider}` }}
          >
            <div
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2"
              style={{ background: t.inputBg }}
            >
              <Search className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
              <input
                className="h-7 min-w-0 flex-1 bg-transparent text-[11px] outline-none"
                style={{ color: t.text, border: 'none' }}
                value={librarySearch}
                onChange={(event) => onLibrarySearchChange(event.target.value)}
                placeholder={searchPlaceholder(leftTab)}
                aria-label="Search sidebar"
              />
            </div>
          </div>
        ) : null}

        {/* Tab content */}
        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* ── Pages ──────────────────────────────────────────── */}
          {leftTab === 'pages' ? (
            filteredPages.length > 0 ? (
              <div className="py-1">
                <div className="px-2 pb-2 pt-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      className="rounded-md px-2 py-1.5 text-left text-[11px] font-medium"
                      style={{
                        background: `${t.accent}22`,
                        color: t.accent,
                        border: `1px solid ${t.accent}44`,
                        cursor: onCreatePage ? 'pointer' : 'not-allowed',
                        opacity: onCreatePage ? 1 : 0.6,
                      }}
                      disabled={!onCreatePage}
                      onClick={onCreatePage}
                    >
                      + Новая
                    </button>
                    <button
                      type="button"
                      className="rounded-md px-2 py-1.5 text-left text-[11px] font-medium"
                      style={{
                        background: t.inputBg,
                        color: t.textSecondary,
                        border: `1px solid ${t.divider}`,
                        cursor: onRefreshPages ? 'pointer' : 'not-allowed',
                        opacity: onRefreshPages ? 1 : 0.6,
                      }}
                      disabled={!onRefreshPages}
                      onClick={onRefreshPages}
                    >
                      Обновить
                    </button>
                  </div>
                </div>
                {filteredPages.map((item) => {
                  const active = item.slug === page.slug
                  return (
                    <div key={item.slug} className="px-1">
                      <div
                        className="flex items-center gap-1 rounded-md"
                        style={{ background: active ? t.active : 'transparent' }}
                      >
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
                          style={{ background: 'transparent', border: 'none', cursor: onOpenPage ? 'pointer' : 'default' }}
                          onClick={() => onOpenPage?.(item.slug)}
                        >
                          <Home className="h-3.5 w-3.5 shrink-0" style={{ color: active ? t.accent : t.textMuted }} />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium" style={{ color: t.text }}>
                            {item.page}
                          </span>
                        </button>
                        {onDuplicatePage ? (
                          <button
                            type="button"
                            className="mr-1 rounded px-1.5 py-0.5 text-[10px]"
                            style={{ background: t.inputBg, color: t.textMuted, border: 'none', cursor: 'pointer' }}
                            onClick={() => onDuplicatePage(item.slug)}
                          >
                            Копия
                          </button>
                        ) : null}
                        {onRenamePage ? (
                          <button
                            type="button"
                            className="mr-1 rounded px-1.5 py-0.5 text-[10px]"
                            style={{ background: t.inputBg, color: t.textMuted, border: 'none', cursor: 'pointer' }}
                            onClick={() => onRenamePage(item.slug)}
                          >
                            Ren
                          </button>
                        ) : null}
                        {onDeletePage ? (
                          <button
                            type="button"
                            className="mr-1 rounded px-1.5 py-0.5 text-[10px]"
                            style={{ background: '#2a1010', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                            onClick={() => onDeletePage(item.slug)}
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                      <p className="px-2 pb-1 text-[10px]" style={{ color: t.textMuted }}>
                        {item.slug}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-3 py-4">
                <p className="mb-3 text-[11px]" style={{ color: t.textMuted }}>
                  Страниц не найдено.
                </p>
                {onCreatePage ? (
                  <button
                    type="button"
                    className="w-full rounded-md px-3 py-2 text-left text-[11px] font-medium"
                    style={{ background: `${t.accent}22`, color: t.accent, border: `1px solid ${t.accent}44`, cursor: 'pointer' }}
                    onClick={onCreatePage}
                  >
                    + Создать первую страницу
                  </button>
                ) : null}
              </div>
            )
          ) : null}

          {/* ── Layers (blocks) ────────────────────────────────── */}
          {leftTab === 'blocks' ? (
            <BuilderLayerTree
              t={t}
              pageName={page.page}
              blocks={page.blocks}
              activeId={activeId}
              store={store}
              searchQuery={searchQuery}
              onOpenAsset={onOpenAsset}
              activeAssetPath={activeAssetPath}
              onDuplicateComponent={onDuplicateComponent}
              onExportBlock={onExportBlock}
            />
          ) : null}

          {/* ── Components (assets) ────────────────────────────── */}
          {leftTab === 'assets' ? (
            componentEditMode ? (
              <ComponentEditorLeftPanel
                t={{
                  text: t.text,
                  textMuted: t.textMuted,
                  textSecondary: t.textSecondary,
                  hover: t.hover,
                  active: t.active,
                  accent: t.accent,
                  divider: t.divider,
                  inputBg: t.inputBg,
                  panel: t.panel,
                  menu: t.panel,
                  menuBorder: t.divider,
                }}
                block={page.blocks.find((b) => b.id === activeId)}
                store={store}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
                onAddElement={onAddElement}
                elementVariants={elementVariants}
                onExitEdit={onExitComponentEdit}
              />
            ) : (
              <BuilderAssetsPanel
                t={t}
                page={page}
                activeBlockId={activeId}
                groupedVariants={groupedBuiltInVariants}
                vendorLibraries={filteredVendors}
                pageVendors={pageVendors}
                requiredVendors={requiredVendors}
                onToggleVendor={onToggleVendor}
                onAddVariant={onAddVariant}
                savedComponents={savedAssetComponents}
                canvasTemplateIds={canvasTemplateIds}
                onAddSavedComponent={onAddSavedComponent}
                onDeleteSavedComponent={onDeleteSavedComponent}
                onDuplicateComponent={onDuplicateComponent}
                searchQuery={searchQuery}
                onSelectBlock={(id) => store.getState().selectBlock(id)}
                onEditComponent={() => onEditComponent?.()}
                onNewComponent={() => onNewComponent?.()}
                onOpenComponentCode={onOpenComponentCode}
              />
            )
          ) : null}

          {/* ── CMS Bitrix browser ─────────────────────────────── */}
          {leftTab === 'cms' ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b px-3 py-2" style={{ borderColor: t.divider }}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold" style={{ color: t.text }}>
                    Bitrix CMS
                  </p>
                  {onOpenCmsSettings ? (
                    <button
                      type="button"
                      className="rounded px-2 py-0.5 text-[10px] font-medium"
                      style={{ color: t.accent, background: `${t.accent}18`, border: 'none', cursor: 'pointer' }}
                      onClick={onOpenCmsSettings}
                    >
                      Настройки
                    </button>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[10px]" style={{ color: t.textMuted }}>
                  {cmsConnection && isCmsConnectionConfigured(cmsConnection)
                    ? cmsConnection.siteUrl
                    : 'Подключение не настроено'}
                </p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {cmsConnection ? (
                  <BuilderCmsBrowser connection={cmsConnection} t={t} compact />
                ) : (
                  <p className="p-3 text-[10px]" style={{ color: t.textMuted }}>
                    Откройте настройки CMS для подключения к сайту.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* ── Media (placeholder) ────────────────────────────── */}
          {leftTab === 'media' ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: t.inputBg }}
              >
                <Image className="h-6 w-6" style={{ color: t.textMuted }} />
              </div>
              <p className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
                Медиа-библиотека
              </p>
              <p className="mt-1 text-[10px]" style={{ color: t.textMuted }}>
                Скоро появится
              </p>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}
