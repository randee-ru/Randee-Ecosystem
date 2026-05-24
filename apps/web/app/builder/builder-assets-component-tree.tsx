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

type SavedAssetComponent = {
  templateId: string
  name: string
  description: string
}

type PanelTheme = {
  text: string
  textSecondary: string
  textMuted: string
  hover: string
  accent: string
}

type BuilderAssetsComponentTreeProps = {
  components: SavedAssetComponent[]
  t: PanelTheme
  searchQuery: string
  activeAssetPath: string | null
  onOpenAsset: (asset: BuilderAssetTarget) => void
  onAddComponent: (templateId: string, name: string) => void
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
  onOpenAsset,
  onAddComponent
}: BuilderAssetsComponentTreeProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})

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
            <div className="flex items-center gap-0.5 pr-2">
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
    </div>
  )
}
