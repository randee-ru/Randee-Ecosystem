'use client'

import * as React from 'react'
import {
  ChevronRight,
  Component,
  FileCode2,
  FileImage,
  FileJson2,
  Folder,
  Plus
} from 'lucide-react'
import { getBlockLayerAssets, isEditableLayerAsset, type BlockLayerAssetFile } from '@randee/blocks'
import type { BuilderAssetTarget } from './builder-asset-types'
import { LayerContextMenu } from './builder-layer-context-menu'

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
  accent: string
  inputBg: string
}

type BuilderAssetsComponentTreeProps = {
  components: SavedAssetComponent[]
  t: PanelTheme
  searchQuery: string
  activeAssetPath: string | null
  canvasTemplateIds: string[]
  onOpenAsset: (asset: BuilderAssetTarget) => void
  onAddComponent: (templateId: string, name: string) => void
  onRenameComponent?: (templateId: string, name: string) => void
  onDeleteComponent?: (templateId: string) => void
}

function assetIcon(asset: BlockLayerAssetFile) {
  if (asset.kind === 'component') return FileCode2
  if (asset.kind === 'style' || asset.kind === 'script') return FileJson2
  if (asset.kind === 'image') return FileImage
  return FileCode2
}

function assetMatchesSearch(asset: BlockLayerAssetFile, query: string) {
  if (!query) return true
  const haystack = [asset.label, asset.path].join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function componentMatchesSearch(component: SavedAssetComponent, query: string) {
  if (!query) return true
  return [component.name, component.templateId, component.description].join(' ').toLowerCase().includes(query.toLowerCase())
}

export function BuilderAssetsComponentTree({
  components,
  t,
  searchQuery,
  activeAssetPath,
  canvasTemplateIds,
  onOpenAsset,
  onAddComponent,
  onRenameComponent,
  onDeleteComponent
}: BuilderAssetsComponentTreeProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; templateId: string } | null>(null)
  const [renamingTemplateId, setRenamingTemplateId] = React.useState<string | null>(null)
  const [draftName, setDraftName] = React.useState('')
  const renameInputRef = React.useRef<HTMLInputElement>(null)
  const renameCommitRef = React.useRef(false)
  const longPressTimerRef = React.useRef<number | null>(null)
  const longPressPointRef = React.useRef({ x: 0, y: 0 })

  React.useEffect(() => {
    if (!searchQuery) return
    setExpanded((current) => {
      const next = { ...current }
      for (const component of components) {
        if (componentMatchesSearch(component, searchQuery)) next[component.templateId] = true
      }
      return next
    })
  }, [components, searchQuery])

  React.useEffect(() => {
    if (!renamingTemplateId) return
    const component = components.find((entry) => entry.templateId === renamingTemplateId)
    setDraftName(component?.name ?? '')
    renameCommitRef.current = false
    const frame = window.requestAnimationFrame(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [renamingTemplateId, components])

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const openContextMenu = (templateId: string, x: number, y: number) => {
    setContextMenu({ x, y, templateId })
  }

  const startLongPress = (templateId: string, clientX: number, clientY: number) => {
    clearLongPress()
    longPressPointRef.current = { x: clientX, y: clientY }
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null
      openContextMenu(templateId, longPressPointRef.current.x, longPressPointRef.current.y)
    }, 450)
  }

  const commitRename = () => {
    if (renameCommitRef.current || !renamingTemplateId) return
    renameCommitRef.current = true
    const trimmed = draftName.trim()
    if (trimmed && typeof onRenameComponent === 'function') {
      onRenameComponent(renamingTemplateId, trimmed)
    }
    setRenamingTemplateId(null)
  }

  const filtered = components.filter((component) => componentMatchesSearch(component, searchQuery))

  if (filtered.length === 0) {
    return (
      <p className="px-3 py-1 text-xs" style={{ color: t.textMuted }}>
        No saved components yet. Create one via New → Component, then Save to Assets.
      </p>
    )
  }

  return (
    <div className="pb-1">
      {filtered.map((component) => {
        const assets = getBlockLayerAssets(component.templateId)
        const isOpen = expanded[component.templateId] ?? false
        const isRenaming = renamingTemplateId === component.templateId
        const files = assets
          ? [
              assets.preview,
              assets.init,
              assets.style,
              assets.script,
              ...assets.images
            ].filter((file) => assetMatchesSearch(file, searchQuery))
          : []

        return (
          <div key={component.templateId}>
            <div
              className="flex items-center gap-0.5 pr-2"
              onContextMenu={(event) => {
                event.preventDefault()
                openContextMenu(component.templateId, event.clientX, event.clientY)
              }}
              onTouchStart={(event) => {
                if (isRenaming || event.touches.length !== 1) return
                const touch = event.touches[0]
                startLongPress(component.templateId, touch.clientX, touch.clientY)
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
                className="flex h-7 w-6 shrink-0 items-center justify-center rounded"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textMuted }}
                onClick={() =>
                  setExpanded((value) => ({ ...value, [component.templateId]: !isOpen }))
                }
                aria-label={isOpen ? 'Collapse component files' : 'Expand component files'}
              >
                <ChevronRight
                  className="h-3 w-3 transition-transform"
                  style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}
                />
              </button>
              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  className="min-w-0 flex-1 rounded px-2 py-1 text-xs outline-none"
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
                      setRenamingTemplateId(null)
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-left"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onClick={() => onAddComponent(component.templateId, component.name)}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = t.hover
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = 'transparent'
                  }}
                  title="Add to page"
                >
                  <Component className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: t.text }}>
                    {component.name}
                  </span>
                  <Plus className="h-3 w-3 shrink-0" style={{ color: t.textMuted }} />
                </button>
              )}
            </div>

            {isOpen && assets ? (
              <div className="pb-1 pl-6">
                <button
                  type="button"
                  className="mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                  style={{ background: 'transparent', border: 'none', cursor: 'default' }}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  <span className="truncate text-[11px]" style={{ color: t.textSecondary }}>
                    {component.templateId}/
                  </span>
                </button>
                {files.map((file) => {
                  const Icon = assetIcon(file)
                  const active = activeAssetPath === `${component.templateId}:${file.path}`
                  const editable = isEditableLayerAsset(file)
                  return (
                    <button
                      key={file.id}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left"
                      style={{
                        background: active ? `${t.accent}18` : 'transparent',
                        border: 'none',
                        cursor: editable ? 'pointer' : 'default',
                        opacity: editable ? 1 : 0.7
                      }}
                      disabled={!editable}
                      onClick={() =>
                        onOpenAsset({
                          templateId: component.templateId,
                          path: file.path,
                          label: file.label,
                          kind: file.kind,
                          url: file.url,
                          blockName: component.name
                        })
                      }
                      onMouseEnter={(event) => {
                        if (editable) event.currentTarget.style.background = t.hover
                      }}
                      onMouseLeave={(event) => {
                        if (!active) event.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
                      <span className="truncate text-[11px]" style={{ color: t.textSecondary }}>
                        {file.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}

      {contextMenu ? (() => {
        const component = components.find((entry) => entry.templateId === contextMenu.templateId)
        const inUse = canvasTemplateIds.includes(contextMenu.templateId)
        return (
          <LayerContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
              ...(typeof onRenameComponent === 'function'
                ? [
                    {
                      label: 'Переименовать',
                      onSelect: () => setRenamingTemplateId(contextMenu.templateId)
                    }
                  ]
                : []),
              ...(typeof onDeleteComponent === 'function'
                ? [
                    {
                      label: 'Удалить',
                      disabled: inUse,
                      onSelect: () => {
                        if (inUse) return
                        onDeleteComponent(contextMenu.templateId)
                      }
                    }
                  ]
                : [])
            ]}
            theme={{
              panel: t.panel,
              divider: t.divider,
              text: t.text,
              hover: t.hover,
              textMuted: t.textMuted
            }}
            onClose={() => setContextMenu(null)}
          />
        )
      })() : null}
    </div>
  )
}
