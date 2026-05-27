'use client'

import * as React from 'react'
import { Box, Code2, Pencil, Plus, Puzzle } from 'lucide-react'
import type { PageBlock } from '@randee/builder'
import { getBlockDisplayName } from '@randee/builder'
import { BuilderConceptsGuide } from './builder-concepts-guide'
import { LayerContextMenu } from './builder-layer-context-menu'

type SavedComponent = {
  templateId: string
  name: string
  description: string
}

type Theme = {
  text: string
  textMuted: string
  textSecondary: string
  hover: string
  accent: string
  divider: string
  inputBg: string
  panel?: string
}

const LIBRARY_SECTIONS = [
  'Header', 'Hero', 'Features', 'CTA', 'FAQ',
  'Forms', 'Popups', 'Catalog', 'News', 'Footer', 'Custom',
] as const

type Props = {
  t: Theme
  pageBlocks: PageBlock[]
  activeBlockId: string | null
  savedComponents: SavedComponent[]
  searchQuery: string
  onSelectBlock: (blockId: string) => void
  onEditComponent: () => void
  onAddSavedComponent: (templateId: string, name: string) => void
  onNewComponent: () => void
  onOpenCode?: (block: PageBlock) => void
  onDeleteBlock?: (blockId: string) => void
  onRenameBlock?: (blockId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onDeleteSavedComponent?: (templateId: string) => void
  onRenameSavedComponent?: (templateId: string) => void
  onDuplicateSavedComponent?: (templateId: string) => void
  onMoveToSection?: (templateId: string, section: string) => void
}

export function BuilderComponentsHub({
  t,
  pageBlocks,
  activeBlockId,
  savedComponents,
  searchQuery,
  onSelectBlock,
  onEditComponent,
  onAddSavedComponent,
  onNewComponent,
  onOpenCode,
  onDeleteBlock,
  onRenameBlock,
  onDuplicateBlock,
  onDeleteSavedComponent,
  onRenameSavedComponent,
  onDuplicateSavedComponent,
  onMoveToSection,
}: Props) {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number
    y: number
    kind: 'block'
    blockId: string
  } | {
    x: number
    y: number
    kind: 'saved'
    templateId: string
    name: string
  } | null>(null)

  const openBlockMenu = (event: React.MouseEvent, blockId: string) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ x: event.clientX, y: event.clientY, kind: 'block', blockId })
  }

  const openSavedMenu = (event: React.MouseEvent, templateId: string, name: string) => {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ x: event.clientX, y: event.clientY, kind: 'saved', templateId, name })
  }

  const menuTheme = {
    panel: t.panel ?? '#1a1a1a',
    divider: t.divider,
    text: t.text,
    hover: t.hover,
    textMuted: t.textMuted
  }
  const q = searchQuery.trim().toLowerCase()
  const onPage = pageBlocks.filter((b) => b.type === 'component')
  const filteredOnPage = q
    ? onPage.filter((b) =>
        [b.name, b.template, getBlockDisplayName(b)].join(' ').toLowerCase().includes(q)
      )
    : onPage
  const filteredSaved = q
    ? savedComponents.filter((c) =>
        [c.name, c.templateId, c.description].join(' ').toLowerCase().includes(q)
      )
    : savedComponents

  const activeComponent = onPage.find((b) => b.id === activeBlockId)

  const blockMenuItems = contextMenu?.kind === 'block' ? [
    {
      label: '✏️  Редактировать',
      onSelect: () => {
        if (contextMenu.kind !== 'block') return
        onSelectBlock(contextMenu.blockId)
        onEditComponent()
      }
    },
    {
      label: '✏︎  Переименовать',
      onSelect: () => {
        if (contextMenu.kind !== 'block') return
        onRenameBlock?.(contextMenu.blockId)
      },
      disabled: !onRenameBlock
    },
    {
      label: '⧉  Дублировать',
      onSelect: () => {
        if (contextMenu.kind !== 'block') return
        onDuplicateBlock?.(contextMenu.blockId)
      },
      disabled: !onDuplicateBlock
    },
    {
      label: '🗑  Удалить',
      onSelect: () => {
        if (contextMenu.kind !== 'block') return
        onDeleteBlock?.(contextMenu.blockId)
      },
      disabled: !onDeleteBlock
    }
  ] : []

  const savedMenuItems = contextMenu?.kind === 'saved' ? [
    {
      label: '＋  Добавить на страницу',
      onSelect: () => {
        if (contextMenu.kind !== 'saved') return
        onAddSavedComponent(contextMenu.templateId, contextMenu.name)
      }
    },
    {
      label: '✏︎  Переименовать',
      onSelect: () => {
        if (contextMenu.kind !== 'saved') return
        onRenameSavedComponent?.(contextMenu.templateId)
      },
      disabled: !onRenameSavedComponent
    },
    {
      label: '⧉  Дублировать',
      onSelect: () => {
        if (contextMenu.kind !== 'saved') return
        onDuplicateSavedComponent?.(contextMenu.templateId)
      },
      disabled: !onDuplicateSavedComponent
    },
    {
      label: '📂  Перенести в секцию',
      submenu: LIBRARY_SECTIONS.map(section => ({
        label: section,
        onSelect: () => {
          if (contextMenu.kind !== 'saved') return
          onMoveToSection?.(contextMenu.templateId, section)
        },
      })),
      disabled: !onMoveToSection,
    },
    {
      label: '🗑  Удалить из библиотеки',
      onSelect: () => {
        if (contextMenu.kind !== 'saved') return
        onDeleteSavedComponent?.(contextMenu.templateId)
      },
      disabled: !onDeleteSavedComponent
    }
  ] : []

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <BuilderConceptsGuide t={t} variant="page" />

      {/* На странице */}
      <div className="shrink-0 px-2 pt-1">
        <div className="mb-1.5 flex items-center gap-1.5 px-1">
          <Box className="h-3.5 w-3.5" style={{ color: '#A855F7' }} />
          <span className="text-[11px] font-semibold" style={{ color: t.text }}>
            На этой странице
          </span>
          <span className="ml-auto text-[9px]" style={{ color: t.textMuted }}>
            {filteredOnPage.length}
          </span>
        </div>

        {filteredOnPage.length === 0 ? (
          <div
            className="rounded-lg px-3 py-4 text-center"
            style={{ background: t.inputBg, border: `1px dashed ${t.divider}` }}
          >
            <p className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
              Нет компонентов на странице
            </p>
            <p className="mt-1 text-[10px]" style={{ color: t.textMuted }}>
              Создайте новый или добавьте из библиотеки ниже
            </p>
            <button
              type="button"
              className="mt-3 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white"
              style={{ background: '#A855F7', border: 'none', cursor: 'pointer' }}
              onClick={onNewComponent}
            >
              + Новый компонент
            </button>
          </div>
        ) : (
          <div className="grid gap-1">
            {filteredOnPage.map((block) => {
              const selected = block.id === activeBlockId
              const name = getBlockDisplayName(block)
              return (
                <div
                  key={block.id}
                  className="rounded-lg p-2"
                  style={{
                    background: selected ? 'rgba(168,85,247,0.12)' : t.inputBg,
                    border: `1px solid ${selected ? 'rgba(168,85,247,0.45)' : t.divider}`
                  }}
                  onContextMenu={(e) => openBlockMenu(e, block.id)}
                  onMouseDown={(e) => {
                    if (e.button !== 2) return
                    e.preventDefault()
                    openBlockMenu(e, block.id)
                  }}
                >
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-start gap-2 text-left"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => onSelectBlock(block.id)}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(168,85,247,0.15)' }}
                    >
                      <Puzzle className="h-4 w-4" style={{ color: '#A855F7' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold" style={{ color: t.text }}>
                        {name}
                      </p>
                      <p className="truncate text-[9px]" style={{ color: t.textMuted }}>
                        {block.template}
                        {(block.elements?.length ?? 0) > 0
                          ? ` · ${block.elements!.length} эл.`
                          : ' · пустой'}
                      </p>
                    </div>
                  </button>
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-semibold"
                      style={{
                        background: '#A855F7',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        onSelectBlock(block.id)
                        onEditComponent()
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      Редактировать
                    </button>
                    {onOpenCode ? (
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-md px-2 py-1.5"
                        style={{ background: t.hover, border: `1px solid ${t.divider}`, cursor: 'pointer', color: t.textMuted }}
                        title="Код (preview.tsx)"
                        onClick={() => onOpenCode(block)}
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeComponent && !filteredOnPage.some((b) => b.id === activeComponent.id) ? null : activeComponent ? (
          <p className="mt-2 px-1 text-[9px] leading-snug" style={{ color: t.textMuted }}>
            Выбран: <strong style={{ color: t.textSecondary }}>{getBlockDisplayName(activeComponent)}</strong>.
            Нажмите «Редактировать», чтобы менять кнопки и тексты внутри.
          </p>
        ) : null}
      </div>

      {/* Библиотека */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t px-2 pt-2" style={{ borderColor: t.divider }}>
        <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-semibold" style={{ color: t.text }}>
            Библиотека
          </span>
          <button
            type="button"
            className="flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-medium"
            style={{ color: t.accent, background: `${t.accent}18`, border: 'none', cursor: 'pointer' }}
            onClick={onNewComponent}
          >
            <Plus className="h-3 w-3" />
            Создать
          </button>
        </div>

        {filteredSaved.length === 0 ? (
          <p className="px-1 py-4 text-center text-[10px]" style={{ color: t.textMuted }}>
            Сохранённых компонентов нет. Меню ⋯ → New Component.
          </p>
        ) : (
          <div className="grid gap-1 pb-2">
            {filteredSaved.map((comp) => (
              <div
                key={comp.templateId}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2"
                style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
                onContextMenu={(e) => openSavedMenu(e, comp.templateId, comp.name)}
                onMouseDown={(e) => {
                  if (e.button !== 2) return
                  e.preventDefault()
                  openSavedMenu(e, comp.templateId, comp.name)
                }}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => onAddSavedComponent(comp.templateId, comp.name)}
                >
                  <Puzzle className="h-4 w-4 shrink-0" style={{ color: '#0d9680' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium" style={{ color: t.text }}>
                      {comp.name}
                    </p>
                    <p className="truncate text-[9px]" style={{ color: t.textMuted }}>
                      {comp.description || 'Добавить на страницу'}
                    </p>
                  </div>
                </button>
                <Plus className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {contextMenu?.kind === 'block' ? (
        <LayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={blockMenuItems}
          onClose={() => setContextMenu(null)}
          theme={menuTheme}
        />
      ) : contextMenu?.kind === 'saved' ? (
        <LayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={savedMenuItems}
          onClose={() => setContextMenu(null)}
          theme={menuTheme}
        />
      ) : null}
    </div>
  )
}
