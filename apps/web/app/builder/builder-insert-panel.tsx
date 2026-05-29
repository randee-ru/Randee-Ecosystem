'use client'

import * as React from 'react'
import {
  Bookmark,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  LayoutGrid,
  MessageSquare,
  MousePointerClick,
  Navigation,
  Newspaper,
  Package,
  PanelBottom,
  PanelTop,
  Plus,
  Puzzle,
  ShoppingBag,
  Sparkles
} from 'lucide-react'
import type { LibraryVariant } from '@randee/blocks'

// ─── Types ──────────────────────────────────────────────────────────────────

type VendorLibrary = {
  id: string
  label: string
  description: string
  website: string
}

type SavedAssetComponent = {
  templateId: string
  name: string
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
}

type BuilderInsertPanelProps = {
  t: PanelTheme
  groupedVariants: Record<string, LibraryVariant[]>
  vendorLibraries: VendorLibrary[]
  pageVendors: string[]
  requiredVendors: string[]
  onToggleVendor: (id: string) => void
  onAddVariant: (item: LibraryVariant) => void
  savedComponents: SavedAssetComponent[]
  canvasTemplateIds: string[]
  onAddSavedComponent: (templateId: string, name: string) => void
  onDeleteSavedComponent?: (templateId: string) => void
  onDuplicateComponent?: (templateId: string) => void
  searchQuery: string
  /** sections = только Hero/FAQ… без сохранённых компонентов */
  variant?: 'full' | 'sections'
}

// ─── Static data ─────────────────────────────────────────────────────────────

type GroupMeta = { labelRu: string; icon: React.ElementType; color: string; wf: string }

const GROUP_META: Record<string, GroupMeta> = {
  Header:     { labelRu: 'Шапка',        icon: PanelTop,          color: '#6366f1', wf: 'nav' },
  Hero:       { labelRu: 'Герой',        icon: Sparkles,          color: '#8b5cf6', wf: 'hero' },
  Features:   { labelRu: 'Возможности',  icon: LayoutGrid,        color: '#0ea5e9', wf: 'features' },
  FAQ:        { labelRu: 'FAQ',          icon: HelpCircle,        color: '#f59e0b', wf: 'faq' },
  CTA:        { labelRu: 'Призыв',       icon: MousePointerClick, color: '#10b981', wf: 'cta' },
  Forms:      { labelRu: 'Формы',        icon: ClipboardList,     color: '#06b6d4', wf: 'form' },
  Popups:     { labelRu: 'Попапы',       icon: MessageSquare,     color: '#ec4899', wf: 'popup' },
  Catalog:    { labelRu: 'Каталог',      icon: ShoppingBag,       color: '#ef4444', wf: 'catalog' },
  News:       { labelRu: 'Новости',      icon: Newspaper,         color: '#f97316', wf: 'news' },
  Navigation: { labelRu: 'Навигация',    icon: Navigation,        color: '#64748b', wf: 'nav' },
  Footer:     { labelRu: 'Подвал',       icon: PanelBottom,       color: '#475569', wf: 'footer' },
  Custom:     { labelRu: 'Кастомные',    icon: Puzzle,            color: '#94a3b8', wf: 'component' },
}

const BLOCK_NAME_RU: Record<string, string> = {
  'hero-01':      'Герой классик',
  'hero-02':      'Герой с медиа',
  'hero-03':      'Герой с фоном',
  'features-01':  'Сетка возможностей',
  'features-02':  'Карточки с иконками',
  'faq-01':       'Аккордеон вопросов',
  'cta-01':       'Баннер призыва',
  'catalog-01':   'Каталог товаров',
  'news-01':      'Лента новостей',
  'component-03': 'CMS Слайдер',
  'component-04': 'Кастомный блок'
}

// ─── Wireframe SVG thumbnails ────────────────────────────────────────────────

function WireframeHero({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="16" y="22" width="108" height="10" rx="2" opacity="0.45"/>
      <rect x="16" y="38" width="88" height="7" rx="2" opacity="0.25"/>
      <rect x="16" y="51" width="68" height="7" rx="2" opacity="0.2"/>
      <rect x="16" y="72" width="56" height="22" rx="6" opacity="0.5"/>
      <rect x="80" y="72" width="56" height="22" rx="6" opacity="0.18"/>
      <rect x="140" y="14" width="84" height="112" rx="8" opacity="0.12"/>
      <circle cx="182" cy="60" r="18" opacity="0.18"/>
      <path d="M165 80 L182 62 L199 80Z" opacity="0.25"/>
    </svg>
  )
}

function WireframeFeatures({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="8" y="36" width="68" height="86" rx="6" opacity="0.12"/>
      <rect x="86" y="36" width="68" height="86" rx="6" opacity="0.12"/>
      <rect x="164" y="36" width="68" height="86" rx="6" opacity="0.12"/>
      <rect x="18" y="46" width="22" height="22" rx="5" opacity="0.35"/>
      <rect x="96" y="46" width="22" height="22" rx="5" opacity="0.35"/>
      <rect x="174" y="46" width="22" height="22" rx="5" opacity="0.35"/>
      <rect x="14" y="76" width="54" height="7" rx="2" opacity="0.3"/>
      <rect x="14" y="89" width="46" height="5" rx="2" opacity="0.18"/>
      <rect x="92" y="76" width="54" height="7" rx="2" opacity="0.3"/>
      <rect x="170" y="76" width="54" height="7" rx="2" opacity="0.3"/>
      <rect x="55" y="14" width="130" height="12" rx="2" opacity="0.35"/>
    </svg>
  )
}

function WireframeFaq({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="55" y="8" width="130" height="10" rx="2" opacity="0.35"/>
      <rect x="8" y="28" width="224" height="30" rx="5" opacity="0.1"/>
      <rect x="16" y="38" width="130" height="8" rx="2" opacity="0.35"/>
      <rect x="202" y="36" width="18" height="12" rx="3" opacity="0.3"/>
      <rect x="8" y="66" width="224" height="30" rx="5" opacity="0.1"/>
      <rect x="16" y="76" width="110" height="8" rx="2" opacity="0.3"/>
      <rect x="202" y="74" width="18" height="12" rx="3" opacity="0.25"/>
      <rect x="8" y="104" width="224" height="30" rx="5" opacity="0.1"/>
      <rect x="16" y="114" width="120" height="8" rx="2" opacity="0.3"/>
      <rect x="202" y="112" width="18" height="12" rx="3" opacity="0.25"/>
    </svg>
  )
}

function WireframeCta({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="8" y="8" width="224" height="124" rx="10" opacity="0.08"/>
      <rect x="44" y="26" width="152" height="12" rx="2" opacity="0.4"/>
      <rect x="64" y="46" width="112" height="8" rx="2" opacity="0.22"/>
      <rect x="72" y="60" width="96" height="8" rx="2" opacity="0.16"/>
      <rect x="76" y="84" width="88" height="28" rx="8" opacity="0.45"/>
      <rect x="92" y="94" width="56" height="8" rx="2" opacity="0.7"/>
    </svg>
  )
}

function WireframeCatalog({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      {[8, 86, 164].map((x) => (
        <g key={x}>
          <rect x={x} y="8" width="68" height="94" rx="6" opacity="0.1"/>
          <rect x={x + 2} y="10" width="64" height="52" rx="4" opacity="0.18"/>
          <rect x={x + 8} y="68" width="52" height="7" rx="2" opacity="0.32"/>
          <rect x={x + 8} y="80" width="36" height="7" rx="2" opacity="0.45"/>
          <rect x={x + 8} y="92" width="52" height="6" rx="2" opacity="0.18"/>
        </g>
      ))}
    </svg>
  )
}

function WireframeNews({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      {[8, 76].map((y) => (
        <g key={y}>
          <rect x="8" y={y} width="68" height="54" rx="5" opacity="0.15"/>
          <rect x="84" y={y + 4} width="140" height="9" rx="2" opacity="0.35"/>
          <rect x="84" y={y + 18} width="110" height="6" rx="2" opacity="0.2"/>
          <rect x="84" y={y + 30} width="125" height="6" rx="2" opacity="0.15"/>
          <rect x="84" y={y + 42} width="70" height="5" rx="2" opacity="0.15"/>
        </g>
      ))}
      <rect x="8" y="68" width="224" height="1" opacity="0.12"/>
    </svg>
  )
}

function WireframeComponent({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="16" y="16" width="208" height="108" rx="8" opacity="0.1" strokeDasharray="8 4" stroke={color} strokeWidth="1.5" fill="none"/>
      <rect x="76" y="46" width="88" height="48" rx="8" opacity="0.12"/>
      <rect x="92" y="54" width="56" height="10" rx="3" opacity="0.3"/>
      <rect x="100" y="70" width="40" height="6" rx="2" opacity="0.2"/>
      <rect x="104" y="82" width="32" height="4" rx="2" opacity="0.15"/>
    </svg>
  )
}

function WireframeNav({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      {/* Header bar */}
      <rect x="8" y="8" width="224" height="28" rx="6" opacity="0.1"/>
      {/* Logo */}
      <rect x="16" y="15" width="28" height="14" rx="3" opacity="0.35"/>
      {/* Nav links */}
      <rect x="54" y="18" width="30" height="8" rx="2" opacity="0.22"/>
      <rect x="92" y="18" width="30" height="8" rx="2" opacity="0.22"/>
      <rect x="130" y="18" width="30" height="8" rx="2" opacity="0.22"/>
      {/* CTA button */}
      <rect x="180" y="14" width="44" height="16" rx="8" opacity="0.45"/>
      {/* Mega menu panel */}
      <rect x="8" y="44" width="224" height="86" rx="8" opacity="0.07"/>
      <rect x="20" y="54" width="60" height="10" rx="2" opacity="0.3"/>
      <rect x="20" y="70" width="48" height="6" rx="2" opacity="0.18"/>
      <rect x="20" y="82" width="52" height="6" rx="2" opacity="0.18"/>
      <rect x="20" y="94" width="44" height="6" rx="2" opacity="0.18"/>
      <rect x="100" y="54" width="60" height="10" rx="2" opacity="0.3"/>
      <rect x="100" y="70" width="48" height="6" rx="2" opacity="0.18"/>
      <rect x="100" y="82" width="52" height="6" rx="2" opacity="0.18"/>
      <rect x="100" y="94" width="44" height="6" rx="2" opacity="0.18"/>
      <rect x="180" y="54" width="44" height="8" rx="2" opacity="0.25"/>
      <rect x="180" y="68" width="36" height="6" rx="2" opacity="0.18"/>
      <rect x="180" y="116" width="44" height="16" rx="8" opacity="0.4"/>
    </svg>
  )
}

function WireframeFooter({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      {/* Footer bar */}
      <rect x="8" y="8" width="224" height="90" rx="6" opacity="0.08"/>
      {/* Logo */}
      <rect x="20" y="20" width="36" height="14" rx="3" opacity="0.35"/>
      <rect x="20" y="40" width="72" height="6" rx="2" opacity="0.16"/>
      <rect x="20" y="52" width="60" height="6" rx="2" opacity="0.12"/>
      {/* Cols */}
      <rect x="110" y="20" width="40" height="7" rx="2" opacity="0.3"/>
      <rect x="110" y="34" width="32" height="5" rx="2" opacity="0.18"/>
      <rect x="110" y="44" width="36" height="5" rx="2" opacity="0.18"/>
      <rect x="110" y="54" width="28" height="5" rx="2" opacity="0.18"/>
      <rect x="168" y="20" width="40" height="7" rx="2" opacity="0.3"/>
      <rect x="168" y="34" width="36" height="5" rx="2" opacity="0.18"/>
      <rect x="168" y="44" width="28" height="5" rx="2" opacity="0.18"/>
      <rect x="168" y="54" width="32" height="5" rx="2" opacity="0.18"/>
      {/* Bottom bar */}
      <rect x="8" y="106" width="224" height="26" rx="5" opacity="0.07"/>
      <rect x="20" y="114" width="80" height="6" rx="2" opacity="0.2"/>
      <rect x="180" y="114" width="40" height="6" rx="2" opacity="0.2"/>
    </svg>
  )
}

function WireframePricing({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 140" fill={color} xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="55" y="8" width="130" height="10" rx="2" opacity="0.35"/>
      {[8, 88, 168].map((x) => (
        <g key={x}>
          <rect x={x} y="28" width="66" height="104" rx="6" opacity="0.1"/>
          <rect x={x + 8} y="38" width="50" height="8" rx="2" opacity="0.3"/>
          <rect x={x + 8} y="52" width="32" height="12" rx="2" opacity="0.4"/>
          <rect x={x + 8} y="70" width="40" height="5" rx="2" opacity="0.18"/>
          <rect x={x + 8} y="80" width="36" height="5" rx="2" opacity="0.18"/>
          <rect x={x + 8} y="90" width="42" height="5" rx="2" opacity="0.18"/>
          <rect x={x + 8} y="110" width="50" height="14" rx="7" opacity="0.4"/>
        </g>
      ))}
    </svg>
  )
}

const WIREFRAME_MAP: Record<string, React.FC<{ color: string }>> = {
  hero: WireframeHero,
  features: WireframeFeatures,
  faq: WireframeFaq,
  cta: WireframeCta,
  catalog: WireframeCatalog,
  news: WireframeNews,
  component: WireframeComponent,
  nav: WireframeNav,
  footer: WireframeFooter,
  pricing: WireframePricing,
  form: WireframeComponent,
  popup: WireframeComponent,
}

// ─── Block Card ──────────────────────────────────────────────────────────────

const BlockCard = React.memo(function BlockCard({
  item,
  wf,
  color,
  t,
  onAdd
}: {
  item: LibraryVariant
  wf: string
  color: string
  t: PanelTheme
  onAdd: (item: LibraryVariant) => void
}) {
  const [hovered, setHovered] = React.useState(false)
  const WireframeComp = WIREFRAME_MAP[wf] ?? WireframeComponent
  const nameRu = BLOCK_NAME_RU[item.template] ?? item.name

  return (
    <button
      type="button"
      className="group relative flex flex-col overflow-hidden rounded-xl text-left transition-all"
      style={{
        background: t.inputBg,
        border: `1px solid ${hovered ? color + '88' : t.divider}`,
        cursor: 'pointer',
        boxShadow: hovered ? `0 0 0 2px ${color}22` : 'none'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onAdd(item)}
    >
      {/* Thumbnail */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '5/3',
          background: `linear-gradient(135deg, ${color}18, ${color}08)`
        }}
      >
        <WireframeComp color={color} />
        {/* Hover overlay with + button */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity"
          style={{
            background: `${color}22`,
            opacity: hovered ? 1 : 0,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: color }}
          >
            <Plus className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="truncate text-[11px] font-semibold" style={{ color: t.text }}>
          {nameRu}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug" style={{ color: t.textMuted }}>
          {item.description}
        </p>
      </div>
    </button>
  )
})

// ─── Main component ──────────────────────────────────────────────────────────

const SPECIAL_TABS = ['_saved', '_libs'] as const
type SpecialTab = typeof SPECIAL_TABS[number]

export function BuilderInsertPanel({
  t,
  groupedVariants,
  vendorLibraries,
  pageVendors,
  requiredVendors,
  onToggleVendor,
  onAddVariant,
  savedComponents,
  canvasTemplateIds,
  onAddSavedComponent,
  onDeleteSavedComponent,
  onDuplicateComponent,
  searchQuery,
  variant = 'full'
}: BuilderInsertPanelProps) {
  const SECTION_ORDER = ['Header', 'Hero', 'Features', 'CTA', 'FAQ', 'Forms', 'Popups', 'Catalog', 'News', 'Navigation', 'Footer', 'Custom']
  // Always show all predefined groups + any unknown groups from actual variants
  const extraGroups = Object.keys(groupedVariants).filter((g) => !SECTION_ORDER.includes(g))
  const allGroups = [
    ...SECTION_ORDER,
    ...extraGroups
  ].filter((g) => variant !== 'sections' || g !== 'Custom')
  const sortedGroups = allGroups

  const [activeTab, setActiveTab] = React.useState<string>(() => sortedGroups[0] ?? '_libs')
  const showSavedTab = variant === 'full'

  const isGroupTab = (tab: string): tab is string => !SPECIAL_TABS.includes(tab as SpecialTab)

  const currentItems = isGroupTab(activeTab) ? (groupedVariants[activeTab] ?? []) : []

  const filteredItems = React.useMemo(() => {
    if (!searchQuery) return currentItems
    return currentItems.filter((item) =>
      [item.name, item.description, BLOCK_NAME_RU[item.template] ?? ''].join(' ').toLowerCase().includes(searchQuery)
    )
  }, [currentItems, searchQuery])

  // If searching, show all matching blocks across groups
  const searchResults = React.useMemo(() => {
    if (!searchQuery) return null
    const all: (LibraryVariant & { groupMeta: GroupMeta | undefined })[] = []
    for (const [group, items] of Object.entries(groupedVariants)) {
      for (const item of items) {
        const text = [item.name, item.description, BLOCK_NAME_RU[item.template] ?? ''].join(' ').toLowerCase()
        if (text.includes(searchQuery)) {
          all.push({ ...item, groupMeta: GROUP_META[group] })
        }
      }
    }
    return all
  }, [groupedVariants, searchQuery])

  const meta = GROUP_META[activeTab]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {variant === 'sections' ? (
        <p className="shrink-0 px-3 py-2 text-[10px] leading-snug" style={{ color: t.textMuted, borderBottom: `1px solid ${t.divider}` }}>
          Готовые секции целиком: герой, FAQ, каталог. Для кнопок и карточек своей вёрстки переключитесь на вкладку «Компоненты».
        </p>
      ) : null}
      {/* Category tabs — wrapping grid */}
      <div
        className="flex flex-wrap gap-1 px-2 py-2"
        style={{ borderBottom: `1px solid ${t.divider}` }}
      >
        {sortedGroups.map((group) => {
          const gm = GROUP_META[group]
          if (!gm) return null
          const active = activeTab === group
          const Icon = gm.icon
          return (
            <button
              key={group}
              type="button"
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all"
              style={{
                background: active ? `${gm.color}22` : 'transparent',
                border: `1px solid ${active ? gm.color + '66' : 'transparent'}`,
                cursor: 'pointer',
                minWidth: 56
              }}
              onClick={() => setActiveTab(group)}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: active ? gm.color : `${gm.color}30` }}
              >
                <Icon className="h-4 w-4" style={{ color: active ? '#fff' : gm.color }} />
              </div>
              <span className="text-[9px] font-medium leading-none" style={{ color: active ? t.text : t.textMuted }}>
                {gm.labelRu}
              </span>
            </button>
          )
        })}

        {/* Saved tab */}
        {showSavedTab && savedComponents.length > 0 ? (
          <button
            type="button"
            className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all"
            style={{
              background: activeTab === '_saved' ? `#0d968022` : 'transparent',
              border: `1px solid ${activeTab === '_saved' ? '#0d968066' : 'transparent'}`,
              cursor: 'pointer',
              minWidth: 56
            }}
            onClick={() => setActiveTab('_saved')}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: activeTab === '_saved' ? '#0d9680' : '#0d968030' }}
            >
              <Bookmark className="h-4 w-4" style={{ color: activeTab === '_saved' ? '#fff' : '#0d9680' }} />
            </div>
            <span className="text-[9px] font-medium leading-none" style={{ color: activeTab === '_saved' ? t.text : t.textMuted }}>
              Saved
            </span>
          </button>
        ) : null}

        {/* Libraries tab */}
        <button
          type="button"
          className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all"
          style={{
            background: activeTab === '_libs' ? `#92400e22` : 'transparent',
            border: `1px solid ${activeTab === '_libs' ? '#92400e66' : 'transparent'}`,
            cursor: 'pointer',
            minWidth: 56
          }}
          onClick={() => setActiveTab('_libs')}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: activeTab === '_libs' ? '#92400e' : '#92400e30' }}
          >
            <Package className="h-4 w-4" style={{ color: activeTab === '_libs' ? '#fff' : '#92400e' }} />
          </div>
          <span className="text-[9px] font-medium leading-none" style={{ color: activeTab === '_libs' ? t.text : t.textMuted }}>
            Либы
          </span>
        </button>
      </div>

      {/* Content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Search results override */}
        {searchQuery && searchResults !== null ? (
          <div className="p-2">
            {searchResults.length === 0 ? (
              <p className="py-6 text-center text-[11px]" style={{ color: t.textMuted }}>
                Ничего не найдено
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {searchResults.map((item) => (
                  <BlockCard
                    key={item.template}
                    item={item}
                    wf={item.groupMeta?.wf ?? 'component'}
                    color={item.groupMeta?.color ?? t.accent}
                    t={t}
                    onAdd={onAddVariant}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Normal group view */}
            {isGroupTab(activeTab) && meta ? (
              <div className="p-2">
                {/* Section header */}
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ background: meta.color }}
                  >
                    <meta.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: t.text }}>
                    {meta.labelRu}
                  </span>
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-medium"
                    style={{ background: `${meta.color}20`, color: meta.color }}
                  >
                    {currentItems.length}
                  </span>
                </div>

                {/* Cards grid */}
                {currentItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${meta.color}18` }}
                    >
                      <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
                    </div>
                    <p className="text-[11px] font-medium" style={{ color: t.textMuted }}>
                      Скоро появятся блоки
                    </p>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold"
                      style={{ background: `${meta.color}18`, color: meta.color }}
                    >
                      Coming soon
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {currentItems.map((item) => (
                      <BlockCard
                        key={item.template}
                        item={item}
                        wf={meta.wf}
                        color={meta.color}
                        t={t}
                        onAdd={onAddVariant}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Saved components */}
            {activeTab === '_saved' ? (
              <div className="p-2">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: '#0d9680' }}>
                    <Bookmark className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: t.text }}>Сохранённые компоненты</span>
                </div>
                {savedComponents.length === 0 ? (
                  <p className="py-6 text-center text-[11px]" style={{ color: t.textMuted }}>
                    Сохранённых компонентов нет
                  </p>
                ) : (
                  <div className="grid gap-1.5">
                    {savedComponents.map((comp) => {
                      const onCanvas = canvasTemplateIds.includes(comp.templateId)
                      return (
                        <div
                          key={comp.templateId}
                          className="group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.divider}`,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0d968066' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.divider }}
                        >
                          {/* Main click area */}
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onClick={() => onAddSavedComponent(comp.templateId, comp.name)}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: '#0d968020' }}>
                              <Puzzle className="h-4 w-4" style={{ color: '#0d9680' }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-semibold" style={{ color: t.text }}>{comp.name}</p>
                              <p className="truncate text-[10px]" style={{ color: t.textMuted }}>{comp.description || comp.templateId}</p>
                            </div>
                            {onCanvas ? (
                              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: '#0d968020', color: '#0d9680' }}>
                                на странице
                              </span>
                            ) : null}
                          </button>
                          {/* Action buttons */}
                          <div className="flex shrink-0 items-center gap-0.5">
                            {onDuplicateComponent ? (
                              <button
                                type="button"
                                title="Дублировать компонент"
                                className="flex h-6 w-6 items-center justify-center rounded-md text-[11px]"
                                style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.hover }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'none' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDuplicateComponent(comp.templateId)
                                }}
                              >
                                ⧉
                              </button>
                            ) : null}
                            {onDeleteSavedComponent ? (
                              <button
                                type="button"
                                title="Удалить компонент с диска"
                                className="flex h-6 w-6 items-center justify-center rounded-md text-[11px]"
                                style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = 'none' }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteSavedComponent(comp.templateId)
                                }}
                              >
                                ×
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* Libraries */}
            {activeTab === '_libs' ? (
              <div className="p-2">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: '#92400e' }}>
                    <Package className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: t.text }}>JS-библиотеки</span>
                </div>
                <p className="mb-3 px-1 text-[10px] leading-relaxed" style={{ color: t.textMuted }}>
                  Подключите нужные библиотеки к странице. Автоматически добавляются на страницу в production.
                </p>
                <div className="grid gap-1.5">
                  {vendorLibraries.map((vendor) => {
                    const required = requiredVendors.includes(vendor.id)
                    const enabled = required || pageVendors.includes(vendor.id)
                    return (
                      <button
                        key={vendor.id}
                        type="button"
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                        style={{
                          background: enabled ? `#92400e14` : t.inputBg,
                          border: `1px solid ${enabled ? '#92400e55' : t.divider}`,
                          cursor: required ? 'default' : 'pointer',
                          opacity: required ? 0.8 : 1
                        }}
                        disabled={required}
                        onClick={() => { if (!required) onToggleVendor(vendor.id) }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: enabled ? '#92400e' : '#92400e20' }}
                        >
                          <Package className="h-4 w-4" style={{ color: enabled ? '#fff' : '#92400e' }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[11px] font-semibold" style={{ color: t.text }}>{vendor.label}</p>
                            {required ? (
                              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase" style={{ background: `${t.accent}20`, color: t.accent }}>
                                авто
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-[10px]" style={{ color: t.textMuted }}>{vendor.description}</p>
                        </div>
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0 transition-transform"
                          style={{
                            color: enabled ? '#92400e' : t.textMuted,
                            transform: enabled ? 'rotate(90deg)' : 'none'
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
