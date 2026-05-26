'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import type { LibraryVariant } from '@randee/blocks'
import { BuilderComponentsHub } from './builder-components-hub'
import { BuilderInsertPanel } from './builder-insert-panel'

type SavedComponent = {
  templateId: string
  name: string
  description: string
}

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
}

type Props = {
  t: PanelTheme
  page: { blocks: PageBlock[] }
  activeBlockId: string | null
  groupedVariants: Record<string, LibraryVariant[]>
  vendorLibraries: VendorLibrary[]
  pageVendors: string[]
  requiredVendors: string[]
  onToggleVendor: (id: string) => void
  onAddVariant: (item: LibraryVariant) => void
  savedComponents: SavedComponent[]
  canvasTemplateIds: string[]
  onAddSavedComponent: (templateId: string, name: string) => void
  onDeleteSavedComponent?: (templateId: string) => void
  onDuplicateComponent?: (templateId: string) => void
  searchQuery: string
  onSelectBlock: (blockId: string) => void
  onEditComponent: () => void
  onNewComponent: () => void
  onOpenComponentCode?: (block: PageBlock) => void
}

export function BuilderAssetsPanel(props: Props) {
  const [segment, setSegment] = React.useState<'components' | 'sections'>('components')

  const sectionsGrouped = React.useMemo(() => {
    const next: Record<string, LibraryVariant[]> = {}
    for (const [group, items] of Object.entries(props.groupedVariants)) {
      const filtered = items.filter((item) => item.type !== 'component')
      if (filtered.length > 0) next[group] = filtered
    }
    return next
  }, [props.groupedVariants])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="grid shrink-0 grid-cols-2 gap-1 p-2"
        style={{ borderBottom: `1px solid ${props.t.divider}` }}
      >
        <SegmentButton
          active={segment === 'components'}
          label="Компоненты"
          hint="своя вёрстка"
          color="#A855F7"
          t={props.t}
          onClick={() => setSegment('components')}
        />
        <SegmentButton
          active={segment === 'sections'}
          label="Секции"
          hint="Hero, FAQ…"
          color="#0099FF"
          t={props.t}
          onClick={() => setSegment('sections')}
        />
      </div>

      {segment === 'components' ? (
        <BuilderComponentsHub
          t={props.t}
          pageBlocks={props.page.blocks}
          activeBlockId={props.activeBlockId}
          savedComponents={props.savedComponents}
          searchQuery={props.searchQuery}
          onSelectBlock={props.onSelectBlock}
          onEditComponent={props.onEditComponent}
          onAddSavedComponent={props.onAddSavedComponent}
          onNewComponent={props.onNewComponent}
          onOpenCode={props.onOpenComponentCode}
        />
      ) : (
        <BuilderInsertPanel
          t={props.t}
          groupedVariants={sectionsGrouped}
          vendorLibraries={props.vendorLibraries}
          pageVendors={props.pageVendors}
          requiredVendors={props.requiredVendors}
          onToggleVendor={props.onToggleVendor}
          onAddVariant={props.onAddVariant}
          savedComponents={[]}
          canvasTemplateIds={props.canvasTemplateIds}
          onAddSavedComponent={props.onAddSavedComponent}
          onDeleteSavedComponent={props.onDeleteSavedComponent}
          onDuplicateComponent={props.onDuplicateComponent}
          searchQuery={props.searchQuery}
          variant="sections"
        />
      )}
    </div>
  )
}

function SegmentButton({
  active,
  label,
  hint,
  color,
  t,
  onClick
}: {
  active: boolean
  label: string
  hint: string
  color: string
  t: PanelTheme
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="rounded-lg px-2 py-2 text-left transition-all"
      style={{
        background: active ? `${color}18` : t.inputBg,
        border: `1px solid ${active ? `${color}55` : t.divider}`,
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      <p className="text-[11px] font-semibold" style={{ color: active ? t.text : t.textSecondary }}>
        {label}
      </p>
      <p className="text-[9px]" style={{ color: t.textMuted }}>
        {hint}
      </p>
    </button>
  )
}
