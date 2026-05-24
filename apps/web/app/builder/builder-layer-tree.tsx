'use client'

import * as React from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Braces,
  ChevronRight,
  Component,
  FileCode2,
  GripVertical,
  Image as ImageIcon,
  Palette
} from 'lucide-react'
import type { PageBlock } from '@randee/builder'
import { getBlockDisplayName, type BuilderStore } from '@randee/builder'
import type { StoreApi } from 'zustand'
import {
  getBlockLayerAssets,
  isEditableLayerAsset,
  isUserComponentTemplateId,
  type BlockLayerAssetFile,
  type BlockLayerAssets
} from '@randee/blocks'
import type { BuilderAssetTarget } from './builder-asset-types'
import { LayerContextMenu } from './builder-layer-context-menu'

type LayerTheme = {
  accent: string
  hover: string
  text: string
  textSecondary: string
  textMuted: string
  panel: string
  divider: string
  inputBg: string
}

type BuilderLayerTreeProps = {
  t: LayerTheme
  pageName: string
  blocks: PageBlock[]
  activeId: string | null
  store: StoreApi<BuilderStore>
  searchQuery: string
  onOpenAsset: (asset: BuilderAssetTarget) => void
  activeAssetPath: string | null
  onDuplicateComponent?: (templateId: string) => void
  onExportBlock?: (blockId: string) => void
}

function assetMatchesSearch(asset: BlockLayerAssetFile, query: string): boolean {
  return [asset.label, asset.path, asset.kind].join(' ').toLowerCase().includes(query)
}

function blockMatchesSearch(block: PageBlock, assets: BlockLayerAssets | null, query: string): boolean {
  if (!query) return true
  const haystack = [block.type, block.template, block.id, block.name ?? '', assets?.name ?? '']
    .join(' ')
    .toLowerCase()
  if (haystack.includes(query)) return true
  if (!assets) return false
  return (
    assetMatchesSearch(assets.preview, query) ||
    assetMatchesSearch(assets.init, query) ||
    assetMatchesSearch(assets.style, query) ||
    assetMatchesSearch(assets.script, query) ||
    assets.images.some((image) => assetMatchesSearch(image, query))
  )
}

function filterVisibleAssets(
  assets: BlockLayerAssets,
  searchQuery: string
): {
  preview: BlockLayerAssetFile | null
  init: BlockLayerAssetFile | null
  style: BlockLayerAssetFile | null
  script: BlockLayerAssetFile | null
  images: BlockLayerAssetFile[]
} {
  if (!searchQuery) {
    return {
      preview: assets.preview,
      init: assets.init,
      style: assets.style,
      script: assets.script,
      images: assets.images
    }
  }

  return {
    preview: assetMatchesSearch(assets.preview, searchQuery) ? assets.preview : null,
    init: assetMatchesSearch(assets.init, searchQuery) ? assets.init : null,
    style: assetMatchesSearch(assets.style, searchQuery) ? assets.style : null,
    script: assetMatchesSearch(assets.script, searchQuery) ? assets.script : null,
    images: assets.images.filter((image) => assetMatchesSearch(image, searchQuery))
  }
}

function assetIcon(asset: BlockLayerAssetFile) {
  if (asset.kind === 'component') return FileCode2
  if (asset.kind === 'style') return Palette
  if (asset.kind === 'script') return Braces
  return ImageIcon
}

function assetBadge(asset: BlockLayerAssetFile): string {
  const ext = asset.label.split('.').pop()?.toLowerCase()
  return ext ?? asset.kind
}

function LayerAssetRow({
  asset,
  t,
  depth,
  block,
  blockName,
  onOpenAsset,
  activeAssetPath
}: {
  asset: BlockLayerAssetFile
  t: LayerTheme
  depth: number
  block: PageBlock
  blockName?: string
  onOpenAsset: (asset: BuilderAssetTarget) => void
  activeAssetPath: string | null
}) {
  const Icon = assetIcon(asset)
  const editable = isEditableLayerAsset(asset)
  const isActive = activeAssetPath === `${block.template}:${asset.path}`

  const openTarget = (): BuilderAssetTarget => ({
    templateId: block.template,
    blockId: block.id,
    blockName,
    path: asset.path,
    label: asset.label,
    kind: asset.kind,
    url: asset.url
  })

  const rowStyle: React.CSSProperties = {
    paddingLeft: depth * 12 + 28,
    paddingRight: 12,
    color: t.textSecondary,
    background: isActive ? `${t.accent}18` : 'transparent'
  }

  if (editable) {
    return (
      <button
        type="button"
        className="flex w-full items-center gap-2 py-1 text-left"
        style={{ ...rowStyle, border: 'none', cursor: 'pointer' }}
        onClick={() => onOpenAsset(openTarget())}
        onMouseEnter={(event) => {
          if (!isActive) event.currentTarget.style.background = t.hover
        }}
        onMouseLeave={(event) => {
          if (!isActive) event.currentTarget.style.background = isActive ? `${t.accent}18` : 'transparent'
        }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? t.accent : t.textMuted }} />
        <span className="min-w-0 flex-1 truncate text-[11px]">{asset.label}</span>
        <span className="text-[9px] uppercase tracking-wide" style={{ color: t.textMuted }}>
          {assetBadge(asset)}
        </span>
      </button>
    )
  }

  return (
    <a
      href={asset.url}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center gap-2 py-1 text-left no-underline"
      style={rowStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = t.hover
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
      <span className="min-w-0 flex-1 truncate text-[11px]">{asset.label}</span>
      <span className="text-[9px] uppercase tracking-wide" style={{ color: t.textMuted }}>
        {assetBadge(asset)}
      </span>
    </a>
  )
}

function LayerBlockRowInner({
  item,
  layerIndex,
  t,
  activeId,
  store,
  expanded,
  onToggleExpand,
  searchQuery,
  onOpenAsset,
  activeAssetPath,
  isRenaming,
  sortable,
  onBlockContextMenu,
  onOpenContextMenu,
  onFinishRename,
  onCancelRename
}: {
  item: PageBlock
  layerIndex: number
  t: LayerTheme
  activeId: string | null
  store: StoreApi<BuilderStore>
  expanded: boolean
  onToggleExpand: () => void
  searchQuery: string
  onOpenAsset: (asset: BuilderAssetTarget) => void
  activeAssetPath: string | null
  isRenaming: boolean
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void
    style: React.CSSProperties
    attributes: React.HTMLAttributes<HTMLElement>
    listeners: Record<string, unknown> | undefined
  }
  onBlockContextMenu: (event: React.MouseEvent, blockId: string) => void
  onOpenContextMenu: (blockId: string, x: number, y: number) => void
  onFinishRename: (blockId: string, name: string) => void
  onCancelRename: () => void
}) {
  const assets = React.useMemo(() => getBlockLayerAssets(item.template), [item.template])
  const isActive = activeId === item.id
  const [hovered, setHovered] = React.useState(false)
  const [draftName, setDraftName] = React.useState('')
  const renameInputRef = React.useRef<HTMLInputElement>(null)
  const renameCommitRef = React.useRef(false)
  const longPressTimerRef = React.useRef<number | null>(null)
  const longPressPointRef = React.useRef({ x: 0, y: 0 })
  const displayName = getBlockDisplayName(item, assets?.name)

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const startLongPress = (clientX: number, clientY: number) => {
    clearLongPress()
    longPressPointRef.current = { x: clientX, y: clientY }
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null
      onOpenContextMenu(item.id, longPressPointRef.current.x, longPressPointRef.current.y)
    }, 450)
  }

  React.useEffect(() => {
    if (!isRenaming) return
    setDraftName(displayName)
    renameCommitRef.current = false
    const frame = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isRenaming, displayName])

  const commitRename = () => {
    if (renameCommitRef.current) return
    renameCommitRef.current = true
    onFinishRename(item.id, draftName)
  }

  const visibleAssets = React.useMemo(() => {
    if (!assets) return null
    return filterVisibleAssets(assets, searchQuery)
  }, [assets, searchQuery])

  const hasVisibleAssets =
    visibleAssets &&
    (visibleAssets.preview ||
      visibleAssets.init ||
      visibleAssets.style ||
      visibleAssets.script ||
      visibleAssets.images.length > 0)

  const renderAsset = (asset: BlockLayerAssetFile | null, depth: number) =>
    asset ? (
      <LayerAssetRow
        asset={asset}
        t={t}
        depth={depth}
        block={item}
        blockName={getBlockDisplayName(item, assets?.name)}
        onOpenAsset={onOpenAsset}
        activeAssetPath={activeAssetPath}
      />
    ) : null

  return (
    <div ref={sortable?.setNodeRef} style={sortable?.style}>
      <div
        className="flex w-full items-center"
        style={{
          background: isActive ? `${t.accent}18` : hovered ? t.hover : 'transparent'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(event) => onBlockContextMenu(event, item.id)}
        onTouchStart={(event) => {
          if (isRenaming || event.touches.length !== 1) return
          const touch = event.touches[0]
          startLongPress(touch.clientX, touch.clientY)
        }}
        onTouchMove={(event) => {
          if (longPressTimerRef.current === null || event.touches.length !== 1) return
          const touch = event.touches[0]
          const dx = touch.clientX - longPressPointRef.current.x
          const dy = touch.clientY - longPressPointRef.current.y
          if (Math.hypot(dx, dy) > 10) clearLongPress()
        }}
        onTouchEnd={clearLongPress}
        onTouchCancel={clearLongPress}
      >
        <button
          type="button"
          className={`flex h-8 w-6 shrink-0 items-center justify-center touch-none ${sortable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default opacity-60'}`}
          style={{ background: 'transparent', border: 'none', color: t.textMuted, touchAction: 'none' }}
          {...(sortable ? { ...sortable.attributes, ...sortable.listeners } : {})}
          aria-label="Reorder layer"
          disabled={!sortable}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          className="flex h-8 w-5 shrink-0 items-center justify-center"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textMuted }}
          onClick={(event) => {
            event.stopPropagation()
            onToggleExpand()
          }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse layer assets' : 'Expand layer assets'}
        >
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
          />
        </button>

        <div
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-3"
          style={{ cursor: isRenaming ? 'text' : 'pointer' }}
          onClick={() => {
            if (!isRenaming) store.getState().selectBlock(item.id)
          }}
        >
          <Component className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? t.accent : '#7c3aed' }} />
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className="min-w-0 flex-1 rounded px-1 py-0.5 text-xs outline-none"
              style={{
                background: t.inputBg,
                color: t.text,
                border: `1px solid ${t.accent}`
              }}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={() => commitRename()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitRename()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  renameCommitRef.current = true
                  onCancelRename()
                }
              }}
              onClick={(event) => event.stopPropagation()}
            />
          ) : (
            <span className="min-w-0 flex-1 truncate text-xs" style={{ color: isActive ? t.text : t.textSecondary }}>
              {displayName}
            </span>
          )}
          <span className="text-[10px]" style={{ color: t.textMuted }}>
            {layerIndex + 1}
          </span>
        </div>
      </div>

      {expanded && hasVisibleAssets && visibleAssets ? (
        <div className="pb-1">
          {renderAsset(visibleAssets.preview, 2)}
          {renderAsset(visibleAssets.init, 2)}
          {renderAsset(visibleAssets.style, 2)}
          {renderAsset(visibleAssets.script, 2)}
          {visibleAssets.images.length > 0 ? (
            <>
              <div
                className="flex items-center gap-2 py-1"
                style={{ paddingLeft: 28 + 12, paddingRight: 12, color: t.textMuted }}
              >
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Images</span>
              </div>
              {visibleAssets.images.map((image) => (
                <React.Fragment key={image.id}>{renderAsset(image, 3)}</React.Fragment>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

type LayerBlockRowCommonProps = Omit<React.ComponentProps<typeof LayerBlockRowInner>, 'sortable'>

function SortableLayerBlockRow({
  sortDisabled,
  ...props
}: LayerBlockRowCommonProps & { sortDisabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
    disabled: sortDisabled || props.isRenaming
  })

  return (
    <LayerBlockRowInner
      {...props}
      sortable={{
        setNodeRef,
        style: {
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.55 : 1
        },
        attributes,
        listeners
      }}
    />
  )
}

function StaticLayerBlockRow(props: LayerBlockRowCommonProps) {
  return <LayerBlockRowInner {...props} />
}

function useClientDndReady(): boolean {
  return React.useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )
}

export function BuilderLayerTree({
  t,
  pageName,
  blocks,
  activeId,
  store,
  searchQuery,
  onOpenAsset,
  activeAssetPath,
  onDuplicateComponent,
  onExportBlock
}: BuilderLayerTreeProps) {
  const [expandedLayers, setExpandedLayers] = React.useState<Record<string, boolean>>({})
  const [pageExpanded, setPageExpanded] = React.useState(true)
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; blockId: string } | null>(null)
  const [renamingBlockId, setRenamingBlockId] = React.useState<string | null>(null)

  const sortDisabled = Boolean(searchQuery)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = blocks.findIndex((entry) => entry.id === active.id)
    const to = blocks.findIndex((entry) => entry.id === over.id)
    if (from >= 0 && to >= 0 && from !== to) {
      store.getState().moveBlock(from, to)
    }
  }

  const handleBlockContextMenu = (event: React.MouseEvent, blockId: string) => {
    event.preventDefault()
    event.stopPropagation()
    openBlockContextMenu(blockId, event.clientX, event.clientY)
  }

  const openBlockContextMenu = (blockId: string, x: number, y: number) => {
    setContextMenu({ x, y, blockId })
  }

  const finishRename = (blockId: string, name: string) => {
    const trimmed = name.trim()
    const rename = store.getState().renameBlock
    if (typeof rename === 'function') {
      rename(blockId, trimmed)
    } else {
      store.setState((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? { ...block, name: trimmed.length > 0 ? trimmed : undefined }
              : block
          )
        }
      }))
    }
    setRenamingBlockId(null)
  }

  const cancelRename = () => {
    setRenamingBlockId(null)
  }

  React.useEffect(() => {
    if (!activeId) return
    setExpandedLayers((prev) => ({ ...prev, [activeId]: true }))
  }, [activeId])

  const filteredBlocks = React.useMemo(() => {
    return blocks.filter((block) => {
      const assets = getBlockLayerAssets(block.template)
      return blockMatchesSearch(block, assets, searchQuery)
    })
  }, [blocks, searchQuery])

  const toggleLayer = (blockId: string) => {
    setExpandedLayers((prev) => ({ ...prev, [blockId]: !prev[blockId] }))
  }

  const isLayerExpanded = (blockId: string) => {
    if (searchQuery) return true
    if (expandedLayers[blockId] !== undefined) return expandedLayers[blockId]
    return activeId === blockId
  }

  const dndReady = useClientDndReady()

  const renderBlockRows = (RowComponent: typeof SortableLayerBlockRow | typeof StaticLayerBlockRow) => (
    <div style={{ paddingLeft: 8 }}>
      {filteredBlocks.map((item) => {
        const layerIndex = blocks.findIndex((entry) => entry.id === item.id)
        const rowProps = {
          item,
          layerIndex,
          t,
          activeId,
          store,
          expanded: isLayerExpanded(item.id),
          onToggleExpand: () => toggleLayer(item.id),
          searchQuery,
          onOpenAsset,
          activeAssetPath,
          isRenaming: renamingBlockId === item.id,
          onBlockContextMenu: handleBlockContextMenu,
          onOpenContextMenu: openBlockContextMenu,
          onFinishRename: finishRename,
          onCancelRename: cancelRename
        }

        return RowComponent === SortableLayerBlockRow ? (
          <SortableLayerBlockRow key={item.id} {...rowProps} sortDisabled={sortDisabled} />
        ) : (
          <StaticLayerBlockRow key={item.id} {...rowProps} />
        )
      })}
      {filteredBlocks.length === 0 ? (
        <p className="px-3 py-4 text-xs" style={{ color: t.textMuted }}>
          {blocks.length === 0 ? 'No blocks yet. Add components from Assets.' : 'No blocks found.'}
        </p>
      ) : null}
    </div>
  )

  return (
    <div className="py-1">
      <div>
        <div
          className="flex w-full items-center"
          style={{ background: `${t.accent}10` }}
        >
          <span className="w-6 shrink-0" />
          <button
            type="button"
            className="flex h-8 w-5 shrink-0 items-center justify-center"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textMuted }}
            onClick={() => setPageExpanded((value) => !value)}
            aria-expanded={pageExpanded}
          >
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform"
              style={{ transform: pageExpanded ? 'rotate(90deg)' : 'none' }}
            />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-3">
            <FileCode2 className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: t.text }}>
              {pageName}
            </span>
            <span className="text-[10px] font-medium" style={{ color: t.accent }}>
              Page
            </span>
          </div>
        </div>

        {pageExpanded ? (
          dndReady ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredBlocks.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                {renderBlockRows(SortableLayerBlockRow)}
              </SortableContext>
            </DndContext>
          ) : (
            renderBlockRows(StaticLayerBlockRow)
          )
        ) : null}
      </div>

      {contextMenu ? (() => {
        const layerIndex = blocks.findIndex((entry) => entry.id === contextMenu.blockId)
        const contextBlock = blocks[layerIndex]
        const canDuplicateComponent =
          contextBlock &&
          isUserComponentTemplateId(contextBlock.template) &&
          typeof onDuplicateComponent === 'function'
        return (
        <LayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: 'Переименовать',
              onSelect: () => {
                store.getState().selectBlock(contextMenu.blockId)
                setRenamingBlockId(contextMenu.blockId)
              }
            },
            ...(canDuplicateComponent
              ? [
                  {
                    label: 'Duplicate component',
                    onSelect: () => {
                      onDuplicateComponent(contextBlock.template)
                    }
                  }
                ]
              : []),
            ...(typeof onExportBlock === 'function'
              ? [
                  {
                    label: 'Export block',
                    onSelect: () => {
                      onExportBlock(contextMenu.blockId)
                    }
                  }
                ]
              : []),
            {
              label: 'Выше',
              disabled: layerIndex <= 0,
              onSelect: () => {
                if (layerIndex > 0) store.getState().moveBlock(layerIndex, layerIndex - 1)
              }
            },
            {
              label: 'Ниже',
              disabled: layerIndex < 0 || layerIndex >= blocks.length - 1,
              onSelect: () => {
                if (layerIndex >= 0 && layerIndex < blocks.length - 1) {
                  store.getState().moveBlock(layerIndex, layerIndex + 1)
                }
              }
            }
          ]}
          theme={{ panel: t.panel, divider: t.divider, text: t.text, hover: t.hover, textMuted: t.textMuted }}
          onClose={() => setContextMenu(null)}
        />
        )
      })() : null}
    </div>
  )
}
