'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import type { ComponentElement } from '@randee/builder'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  Input,
  Loader,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@randee/ui'
import { getElementVariant } from '../element-registry'

type ElementPreviewOptions = {
  selectedElementId?: string | null
  onSelectElement?: (elementId: string) => void
  onDeleteElement?: (elementId: string) => void
  onDuplicateElement?: (elementId: string) => void
  onRenameElement?: (elementId: string, name: string) => void
  onMoveElement?: (elementId: string, direction: 'up' | 'down') => void
  onDropElement?: (
    catalogElementId: string,
    placement?: {
      parentId?: string | null
      afterElementId?: string | null
      beforeElementId?: string | null
      columnIndex?: number | null
    }
  ) => void
  onDropDebug?: (payload: {
    phase: 'dragover' | 'drop'
    targetElementId: string | null
    zone: 'inside' | 'before' | 'after' | 'root' | null
    draggedElementId: string
    parentId: string | null
  }) => void
  /** Double-click inline edit пропсов элемента */
  onPatchElementProps?: (elementId: string, props: Record<string, string>) => void
  viewport?: 'desktop' | 'macbook' | 'tablet' | 'mobile'
  /** CMS-resolved prop values for live preview */
  cmsPreviewValues?: Record<string, Record<string, string>>
  forceVisual?: boolean
}

function resolveElementProp(
  element: ComponentElement,
  propKey: string,
  cmsPreviewValues?: Record<string, Record<string, string>>
): string {
  const binding = element.cmsBindings?.[propKey]
  if (binding?.mode === 'binding') {
    const preview = cmsPreviewValues?.[element.id]?.[propKey]
    if (preview !== undefined && preview !== '') return preview
    if (binding.binding?.fallback) return binding.binding.fallback
    if (binding.staticValue) return binding.staticValue
  }
  return String(element.props[propKey] ?? '')
}

function buildElementDesignStyle(design: ComponentElement['design']): React.CSSProperties {
  if (!design) return {}
  const s: React.CSSProperties = {}

  const pos = design.position
  if (pos?.type && pos.type !== 'relative') {
    s.position = pos.type
    if (pos.top != null) s.top = `${pos.top}px`
    if (pos.right != null) s.right = `${pos.right}px`
    if (pos.bottom != null) s.bottom = `${pos.bottom}px`
    if (pos.left != null) s.left = `${pos.left}px`
    if (pos.zIndex != null) s.zIndex = pos.zIndex
  }

  const sz = design.size
  if (sz) {
    const wm = sz.widthMode
    if (wm === 'fill') s.width = '100%'
    else if (wm === 'fit') s.width = 'fit-content'
    else if (wm === 'relative') s.width = `${sz.widthPercent ?? 100}%`
    else if (wm === 'fixed' && sz.width) s.width = `${sz.width}px`
    const hm = sz.heightMode
    if (hm === 'fill') s.height = '100%'
    else if (hm === 'fit') s.height = 'fit-content'
    else if (hm === 'fixed' && sz.height) s.height = `${sz.height}px`
    if (sz.minWidth != null) s.minWidth = `${sz.minWidth}px`
    if (sz.maxWidth != null) s.maxWidth = `${sz.maxWidth}px`
    if (sz.minHeight != null) s.minHeight = `${sz.minHeight}px`
    if (sz.maxHeight != null) s.maxHeight = `${sz.maxHeight}px`
  }

  const lay = design.layout
  if (lay?.type === 'stack') {
    s.display = 'flex'
    s.flexDirection = lay.direction === 'horizontal' ? 'row' : 'column'
    s.flexWrap = lay.wrap ? 'wrap' : 'nowrap'
    const jcMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' }
    const aiMap: Record<string, string> = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' }
    if (lay.distribute) s.justifyContent = jcMap[lay.distribute]
    if (lay.align) s.alignItems = aiMap[lay.align]
    if (lay.gap != null) s.gap = `${lay.gap}px`
  }
  if (lay) {
    const { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl } = lay
    if (pt != null || pr != null || pb != null || pl != null) {
      s.paddingTop = `${pt ?? 0}px`
      s.paddingRight = `${pr ?? 0}px`
      s.paddingBottom = `${pb ?? 0}px`
      s.paddingLeft = `${pl ?? 0}px`
    }
  }

  if (design.opacity != null) s.opacity = design.opacity / 100
  if (design.borderRadius != null) s.borderRadius = `${design.borderRadius}px`
  if (design.fill) s.background = design.fill.startsWith('#') ? design.fill : `#${design.fill}`

  return s
}

function ElementPlaceholder({ element }: { element: ComponentElement }) {
  return (
    <div
      className="randee-element-placeholder flex min-h-[2.5rem] items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2"
      aria-label={element.elementId}
    >
      <div className="h-1.5 w-16 rounded-full bg-neutral-300" />
    </div>
  )
}

function isNestableElement(element: ComponentElement) {
  return element.elementId === 'container' || element.elementId === 'columns'
}

// ── Быстрые элементы для мини-каталога инлайн-вставки ────────────────────────
const QUICK_INSERT_ELEMENTS: Array<{ id: string; label: string; char: string; color: string }> = [
  { id: 'container', label: 'Container', char: '▣', color: '#3b82f6' },
  { id: 'columns',   label: 'Columns',   char: '⊞', color: '#06b6d4' },
  { id: 'heading',   label: 'Heading',   char: 'H', color: '#22c55e' },
  { id: 'text',      label: 'Text',      char: 'T', color: '#22c55e' },
  { id: 'button',    label: 'Button',    char: '◉', color: '#a855f7' },
  { id: 'image',     label: 'Image',     char: '⊟', color: '#f97316' },
  { id: 'input',     label: 'Input',     char: '▭', color: '#ec4899' },
  { id: 'link',      label: 'Link',      char: '↗', color: '#eab308' },
]

function computeColumnInsertPlacement(
  parentId: string,
  colIndex: number,
  columnsCount: number,
  siblings: ComponentElement[]
): {
  parentId: string
  afterElementId?: string | null
  beforeElementId?: string | null
  columnIndex?: number | null
} {
  if (siblings.length === 0) {
    return colIndex === 0 ? { parentId } : { parentId, columnIndex: colIndex }
  }

  const buckets: ComponentElement[][] = Array.from({ length: columnsCount }, () => [])
  siblings.forEach((child, index) => {
    buckets[index % columnsCount].push(child)
  })
  const columnItems = buckets[colIndex]
  if (columnItems.length > 0) {
    return { parentId, afterElementId: columnItems[columnItems.length - 1].id }
  }

  for (let flat = 0; flat <= siblings.length; flat++) {
    if (flat % columnsCount !== colIndex) continue
    if (flat >= siblings.length) {
      return { parentId, afterElementId: siblings[siblings.length - 1].id }
    }
    return { parentId, beforeElementId: siblings[flat].id }
  }

  return { parentId }
}

function readDraggedElementId(event: React.DragEvent<HTMLElement>, fallbackId?: string | null): string {
  return (
    event.dataTransfer.getData('application/x-randee-element-id') ||
    event.dataTransfer.getData('text/plain') ||
    fallbackId ||
    ''
  )
}

function renderReadyElement(
  element: ComponentElement,
  isEditMode: boolean,
  viewport: 'desktop' | 'macbook' | 'tablet' | 'mobile' = 'desktop',
  options?: ElementPreviewOptions
) {
  const props = element.props
  const cms = options?.cmsPreviewValues
  const id = element.elementId
  const renderId = id.startsWith('custom:') ? (props.__baseElementId ?? 'container') : id

  switch (renderId) {
    case 'button':
      return (
        <button
          type="button"
          style={{
            minHeight: 40,
            minWidth: 120,
            borderRadius: 10,
            border: '1px solid #2563eb',
            background: '#2563eb',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            padding: '8px 14px',
            lineHeight: 1.1
          }}
        >
          {resolveElementProp(element, 'label', cms) || 'Button'}
        </button>
      )
    case 'input':
    case 'text-field':
      return (
        <Input
          placeholder={
            resolveElementProp(element, 'placeholder', cms) ||
            resolveElementProp(element, 'label', cms) ||
            'Input'
          }
        />
      )
    case 'card':
      return (
        <Card>
          <CardHeader>
            <CardTitle>{props.title ?? 'Card'}</CardTitle>
          </CardHeader>
          <CardContent>{props.description ?? ''}</CardContent>
        </Card>
      )
    case 'select':
      return (
        <Select defaultValue="option-1">
          <SelectTrigger>
            <SelectValue placeholder={props.placeholder ?? 'Choose…'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option-1">Option 1</SelectItem>
            <SelectItem value="option-2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )
    case 'tabs':
      return (
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">{props.tab1 ?? 'Tab 1'}</TabsTrigger>
            <TabsTrigger value="tab2">{props.tab2 ?? 'Tab 2'}</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Tab 1 content</TabsContent>
          <TabsContent value="tab2">Tab 2 content</TabsContent>
        </Tabs>
      )
    case 'modal':
    case 'alert-dialog':
      return (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="font-medium">{props.title ?? 'Dialog'}</p>
          <p className="mt-1 text-sm text-neutral-600">{props.description ?? ''}</p>
          <Button className="mt-3" size="sm">
            Open
          </Button>
        </div>
      )
    case 'tooltip':
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                Hover me
              </Button>
            </TooltipTrigger>
            <TooltipContent>{props.label ?? 'Tooltip'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    case 'table':
      return (
        <Table>
          <thead>
            <tr>
              <th>Column</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Row</td>
              <td>Data</td>
            </tr>
          </tbody>
        </Table>
      )
    case 'accordion':
      return (
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>{props.title ?? 'Section'}</AccordionTrigger>
            <AccordionContent>{props.content ?? 'Content'}</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    case 'drawer':
    case 'popover':
      return (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
          {props.title ?? id} — {props.description ?? 'panel'}
        </div>
      )
    case 'dropdown':
      return (
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="outline" size="sm">
              {props.label ?? 'Menu'}
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownItem>Item 1</DropdownItem>
            <DropdownItem>Item 2</DropdownItem>
          </DropdownContent>
        </Dropdown>
      )
    case 'pagination':
      return <Pagination page={1} totalPages={5} />
    case 'container':
      return null
    case 'columns': {
      const desktopColumns = Math.max(1, Math.min(16, Number(props.columns ?? '2') || 2))
      const tabletColumns = Math.max(1, Math.min(16, Number(props.columnsTablet ?? String(desktopColumns)) || desktopColumns))
      const mobileColumns = Math.max(1, Math.min(16, Number(props.columnsMobile ?? '1') || 1))
      const columns = viewport === 'mobile' ? mobileColumns : viewport === 'tablet' ? tabletColumns : desktopColumns
      const desktopGap = Math.max(0, Math.min(64, Number(props.gap ?? '16') || 16))
      const tabletGap = Math.max(0, Math.min(64, Number(props.gapTablet ?? String(desktopGap)) || desktopGap))
      const mobileGap = Math.max(0, Math.min(64, Number(props.gapMobile ?? '12') || 12))
      const gap = viewport === 'mobile' ? mobileGap : viewport === 'tablet' ? tabletGap : desktopGap
      const minHeight = Math.max(0, Math.min(2000, Number(props.minHeight ?? '120') || 120))
      const align = (props.align ?? 'stretch') as 'stretch' | 'start' | 'center' | 'end'
      const alignItems =
        align === 'start' ? 'start' : align === 'center' ? 'center' : align === 'end' ? 'end' : 'stretch'
      return (
        <div
          style={{
            width: '100%',
            border: isEditMode ? '2px solid rgba(216, 180, 254, 0.8)' : 'none',
            borderRadius: isEditMode ? 10 : 0,
            background: isEditMode ? 'rgba(148, 163, 184, 0.04)' : 'transparent',
            padding: isEditMode ? 16 : 0
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap,
              minHeight,
              alignItems
            }}
          >
            {Array.from({ length: columns }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-[11px] text-neutral-500"
                style={{
                  minHeight: isEditMode ? 120 : 0,
                  border: isEditMode ? undefined : 'none',
                  background: isEditMode ? undefined : 'transparent'
                }}
              >
                {isEditMode ? (
                  <span
                    aria-hidden
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '999px',
                      border: '1px solid rgba(148, 163, 184, 0.75)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: 22,
                      lineHeight: 1
                    }}
                  >
                    +
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'heading':
      return (
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.2,
            color: '#111827'
          }}
        >
          {resolveElementProp(element, 'label', cms) ||
            resolveElementProp(element, 'text', cms) ||
            'Заголовок'}
        </h2>
      )
    case 'text':
    case 'paragraph':
      return (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.55,
            color: '#374151'
          }}
        >
          {resolveElementProp(element, 'text', cms) ||
            resolveElementProp(element, 'label', cms) ||
            'Текст'}
        </p>
      )
    case 'image': {
      const src = resolveElementProp(element, 'src', cms)
      const alt = resolveElementProp(element, 'alt', cms) || 'Изображение'
      if (src) {
        return (
          <img
            src={src}
            alt={alt}
            style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 8 }}
          />
        )
      }
      return (
        <div
          style={{
            display: 'flex',
            minHeight: 120,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: '1px dashed rgba(148,163,184,0.7)',
            background: 'rgba(148,163,184,0.12)',
            color: '#64748b',
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {alt}
        </div>
      )
    }
    case 'breadcrumbs':
      return <Breadcrumbs items={[{ label: 'Home' }, { label: props.label ?? 'Page' }]} />
    case 'badge':
    case 'chip':
      return <Badge>{props.label ?? 'Badge'}</Badge>
    case 'alert':
      return (
        <Alert variant={(props.variant as 'info') ?? 'info'}>{props.message ?? 'Alert'}</Alert>
      )
    case 'skeleton':
      return <Skeleton className="h-12 w-full" />
    case 'loader':
    case 'spinner':
      return <Loader />
    default:
      return null
  }
}

function ElementNode({
  element,
  parentId,
  prevSiblingId,
  dragFallbackId,
  options,
  onOpenContextMenu,
  childrenContent,
  hasChildren,
  childrenElements,
  renderChildNode
}: {
  element: ComponentElement
  parentId: string | null
  prevSiblingId: string | null
  dragFallbackId?: string | null
  options?: ElementPreviewOptions
  onOpenContextMenu?: (elementId: string, x: number, y: number) => void
  childrenContent?: React.ReactNode
  hasChildren?: boolean
  childrenElements?: ComponentElement[]
  renderChildNode?: (element: ComponentElement, parentId: string | null, prevSiblingId: string | null) => React.ReactNode
}) {
  const variant = getElementVariant(element.elementId)
  const selected = options?.selectedElementId === element.id
  const isEditMode = Boolean(options?.onDropElement || options?.onSelectElement)
  const readyNode = variant?.ready
    ? renderReadyElement(element, isEditMode, options?.viewport ?? 'desktop', options)
    : null
  const [dropZone, setDropZone] = React.useState<'inside' | 'before' | 'after' | null>(null)
  const [showColumnsPicker, setShowColumnsPicker] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [insertMenuOpen, setInsertMenuOpen] = React.useState(false)
  const [insertMenuPos, setInsertMenuPos] = React.useState({ x: 0, y: 0 })
  const [insertMenuPlacement, setInsertMenuPlacement] = React.useState<{
    parentId?: string | null
    afterElementId?: string | null
    beforeElementId?: string | null
    columnIndex?: number | null
  } | null>(null)

  const openInsertMenu = React.useCallback(
    (
      x: number,
      y: number,
      placement: {
        parentId?: string | null
        afterElementId?: string | null
        beforeElementId?: string | null
        columnIndex?: number | null
      }
    ) => {
      setInsertMenuPlacement(placement)
      setInsertMenuPos({ x, y })
      setInsertMenuOpen(true)
    },
    []
  )

  const closeInsertMenu = React.useCallback(() => {
    setInsertMenuOpen(false)
    setInsertMenuPlacement(null)
  }, [])
  const [inlineEdit, setInlineEdit] = React.useState<{ field: string; value: string } | null>(null)
  const inlineRef = React.useRef<HTMLTextAreaElement & HTMLInputElement>(null)
  const inlineEditSessionRef = React.useRef<string | null>(null)

  // Фокус и выделение только при открытии редактора (не на каждый символ — иначе select() затирает ввод)
  React.useEffect(() => {
    if (!inlineEdit) {
      inlineEditSessionRef.current = null
      return
    }
    const sessionKey = `${element.id}:${inlineEdit.field}`
    if (inlineEditSessionRef.current === sessionKey) return
    inlineEditSessionRef.current = sessionKey
    const frame = window.requestAnimationFrame(() => {
      inlineRef.current?.focus()
      inlineRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [element.id, inlineEdit?.field])

  // Закрыть инлайн-меню по клику вне
  React.useEffect(() => {
    if (!insertMenuOpen) return
    const close = () => closeInsertMenu()
    window.addEventListener('pointerdown', close, { once: true })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setInsertMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [closeInsertMenu, insertMenuOpen])
  const nestable = isNestableElement(element)
  const isDragging = Boolean(dragFallbackId)
  const isBeingDragged = dragFallbackId === element.id   // именно этот элемент тащат
  const isContainerElement = element.elementId === 'container'
  const hasRenderableChildren =
    (childrenElements?.length ?? 0) > 0 ||
    (Array.isArray(childrenContent) ? childrenContent.length > 0 : Boolean(childrenContent))

  React.useEffect(() => {
    const reset = () => setDropZone(null)
    window.addEventListener('dragend', reset)
    window.addEventListener('drop', reset)
    window.addEventListener('pointerup', reset)
    const onDragState = (event: Event) => {
      const custom = event as CustomEvent<{ phase?: 'start' | 'end' }>
      if (custom.detail?.phase === 'end') reset()
    }
    window.addEventListener('randee:element-drag', onDragState as EventListener)
    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', reset)
      window.removeEventListener('pointerup', reset)
      window.removeEventListener('randee:element-drag', onDragState as EventListener)
    }
  }, [])
  const columnPresets = [1, 2, 3, 4] as const

  return (
    <div
      className="randee-element-node"
      data-randee-element={element.id}
      data-randee-element-type={element.elementId}
      draggable={Boolean(options?.onDropElement)}
      style={{
        position: 'relative',
        width: '100%',
        outline: selected
          ? '2px solid #7c3aed'
          : hovered && isEditMode
            ? '1px solid rgba(124,58,237,0.45)'
            : undefined,
        outlineOffset: selected ? 2 : 1,
        borderRadius: 6,
        // grab-курсор при drag-режиме; pointer при select-режиме
        cursor: options?.onDropElement
          ? (isDragging && isBeingDragged ? 'grabbing' : hovered ? 'grab' : 'default')
          : options?.onSelectElement
            ? 'pointer'
            : undefined,
        // перетаскиваемый элемент чуть прозрачнее — UX-сигнал
        opacity: isBeingDragged ? 0.35 : undefined,
        transition: isBeingDragged ? 'none' : 'opacity 120ms',
        boxSizing: 'border-box',
        alignSelf: 'stretch',
        ...buildElementDesignStyle(element.design)
      }}
      onMouseEnter={(event) => {
        if (!isEditMode) return
        event.stopPropagation()
        setHovered(true)
      }}
      onMouseLeave={() => {
        if (!isEditMode) return
        setHovered(false)
      }}
      onClick={(event) => {
        if (!options?.onSelectElement) return
        event.stopPropagation()
        options.onSelectElement(element.id)
      }}
      onDoubleClick={(event) => {
        if (!options?.onPatchElementProps || !isEditMode) return
        event.stopPropagation()
        event.preventDefault()
        const el = element.elementId
        // Text-like elements: редактируем prop 'label'
        if (['heading', 'text', 'paragraph', 'button', 'link', 'badge'].includes(el)) {
          const field = el === 'text' || el === 'paragraph' ? 'text' : 'label'
          setInlineEdit({
            field,
            value: String(element.props[field] ?? element.props.label ?? '')
          })
          return
        }
        // Image: редактируем prop 'src'
        if (el === 'image') {
          setInlineEdit({ field: 'src', value: String(element.props.src ?? '') })
          return
        }
        // Input/TextField: редактируем placeholder
        if (['input', 'text-field'].includes(el)) {
          setInlineEdit({ field: 'placeholder', value: String(element.props.placeholder ?? '') })
          return
        }
      }}
      onDragStart={(event) => {
        if (!options?.onDropElement) return
        event.stopPropagation()
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('application/x-randee-element-id', element.id)
        event.dataTransfer.setData('text/plain', element.id)
        window.dispatchEvent(
          new CustomEvent('randee:element-drag', {
            detail: { phase: 'start', elementId: element.id }
          })
        )
      }}
      onDragEnd={() => {
        if (!options?.onDropElement) return
        window.dispatchEvent(
          new CustomEvent('randee:element-drag', {
            detail: { phase: 'end', elementId: element.id }
          })
        )
      }}
      onDragOver={(event) => {
        const elementId = readDraggedElementId(event, dragFallbackId)
        if (!options?.onDropElement || !elementId) return
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'move'
        const rect = event.currentTarget.getBoundingClientRect()
        const y = event.clientY - rect.top
        const yRatio = rect.height > 0 ? y / rect.height : 0.5
        const edge = 0.22
        const nextZone: 'inside' | 'before' | 'after' =
          nestable && yRatio > edge && yRatio < 1 - edge
            ? 'inside'
            : yRatio <= edge
              ? 'before'
              : 'after'
        if (dropZone !== nextZone) setDropZone(nextZone)
        options.onDropDebug?.({
          phase: 'dragover',
          targetElementId: element.id,
          zone: nextZone,
          draggedElementId: elementId,
          parentId
        })
      }}
      onDragLeave={() => {
        if (dropZone !== null) setDropZone(null)
      }}
      onDrop={(event) => {
        const elementId = readDraggedElementId(event, dragFallbackId)
        if (!options?.onDropElement || !elementId) return
        event.preventDefault()
        event.stopPropagation()
        const nextZone = dropZone ?? 'after'
        setDropZone(null)
        if (nextZone === 'inside') {
          options.onDropDebug?.({
            phase: 'drop',
            targetElementId: element.id,
            zone: 'inside',
            draggedElementId: elementId,
            parentId: element.id
          })
          options.onDropElement(elementId, { parentId: element.id })
        } else if (nextZone === 'before') {
          options.onDropDebug?.({
            phase: 'drop',
            targetElementId: element.id,
            zone: 'before',
            draggedElementId: elementId,
            parentId
          })
          if (prevSiblingId) {
            options.onDropElement(elementId, { parentId, afterElementId: prevSiblingId })
          } else {
            options.onDropElement(elementId, { parentId, beforeElementId: element.id })
          }
        } else {
          options.onDropDebug?.({
            phase: 'drop',
            targetElementId: element.id,
            zone: 'after',
            draggedElementId: elementId,
            parentId
          })
          options.onDropElement(elementId, { parentId, afterElementId: element.id })
        }
        window.dispatchEvent(
          new CustomEvent('randee:element-drag', {
            detail: { phase: 'end', elementId: null }
          })
        )
      }}
      onContextMenu={(event) => {
        if (!onOpenContextMenu) return
        event.preventDefault()
        event.stopPropagation()
        onOpenContextMenu(element.id, event.clientX, event.clientY)
      }}
    >
      {dropZone === 'before' ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: -10,
            zIndex: 20,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 3,
              background: '#d8b4fe',
              borderRadius: 999
            }}
          />
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              width: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              border: '1px solid #d8b4fe',
              background: '#ffffff',
              color: '#7e22ce',
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1
            }}
          >
            +
          </span>
        </div>
      ) : null}
      {dropZone === 'after' ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -10,
            zIndex: 20,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 3,
              background: '#d8b4fe',
              borderRadius: 999
            }}
          />
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              width: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              border: '1px solid #d8b4fe',
              background: '#ffffff',
              color: '#7e22ce',
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1
            }}
          >
            +
          </span>
        </div>
      ) : null}
      {/* ── Framer-style лейбл имени элемента (только при hover/selected в edit-режиме) ── */}
      {(hovered || selected) && isEditMode && !isBeingDragged ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: -18,
            zIndex: 32,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              height: 16,
              paddingLeft: 5,
              paddingRight: 5,
              borderRadius: 4,
              background: selected ? '#7c3aed' : 'rgba(124,58,237,0.7)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {element.name ?? element.elementId}
          </span>
        </div>
      ) : null}
      {/* ── Inline редактор пропсов (double-click) ── */}
      {inlineEdit ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            background: 'rgba(255,255,255,0.97)',
            border: '2px solid #7c3aed',
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            padding: 8,
            gap: 6,
            boxShadow: '0 4px 20px rgba(124,58,237,0.2)',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {inlineEdit.field === 'src' ? 'URL изображения' : inlineEdit.field === 'placeholder' ? 'Placeholder' : 'Текст'}
            </span>
            <button
              type="button"
              onClick={() => setInlineEdit(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
              aria-label="Закрыть"
            >×</button>
          </div>

          {/* Поле ввода */}
          {inlineEdit.field === 'src' ? (
            /* Image: однострочный input для URL */
            <input
              ref={inlineRef as React.RefObject<HTMLInputElement>}
              type="url"
              value={inlineEdit.value}
              placeholder="https://example.com/image.jpg"
              style={{
                flex: 1,
                border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                color: '#111',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onChange={(e) =>
                setInlineEdit((prev) => (prev ? { ...prev, value: e.target.value } : null))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  options?.onPatchElementProps?.(element.id, {
                    [inlineEdit.field]: e.currentTarget.value
                  })
                  setInlineEdit(null)
                }
                if (e.key === 'Escape') setInlineEdit(null)
              }}
            />
          ) : (
            /* Text/Heading/Button: textarea */
            <textarea
              ref={inlineRef as React.RefObject<HTMLTextAreaElement>}
              value={inlineEdit.value}
              rows={2}
              style={{
                flex: 1,
                border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                color: '#111',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
              onChange={(e) =>
                setInlineEdit((prev) => (prev ? { ...prev, value: e.target.value } : null))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  options?.onPatchElementProps?.(element.id, {
                    [inlineEdit.field]: e.currentTarget.value
                  })
                  setInlineEdit(null)
                }
                if (e.key === 'Escape') setInlineEdit(null)
              }}
            />
          )}

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setInlineEdit(null)}
              style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(148,163,184,0.5)', background: '#f8fafc', cursor: 'pointer', color: '#64748b' }}
            >Отмена</button>
            <button
              type="button"
              onClick={() => {
                options?.onPatchElementProps?.(element.id, { [inlineEdit.field]: inlineEdit.value })
                setInlineEdit(null)
              }}
              style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, border: 'none', background: '#7c3aed', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
            >Сохранить</button>
          </div>
        </div>
      ) : null}
      {/* ── Inline «+» кнопка вставки (при hover, только в edit-режиме с onDropElement) ── */}
      {hovered && isEditMode && Boolean(options?.onDropElement) && !isDragging && !insertMenuOpen ? (
        <button
          type="button"
          aria-label="Вставить элемент после"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const rect = e.currentTarget.getBoundingClientRect()
            openInsertMenu(rect.left + rect.width / 2, rect.bottom + 6, {
              parentId,
              afterElementId: element.id
            })
          }}
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -11,
            transform: 'translateX(-50%)',
            zIndex: 31,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 999,
            border: '1.5px solid #7c3aed',
            background: '#ffffff',
            color: '#7c3aed',
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
          }}
        >
          +
        </button>
      ) : null}
      {dropZone === 'inside' ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 19,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #d8b4fe',
            borderRadius: 8,
            background: 'rgba(216, 180, 254, 0.14)'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              border: '1px solid #d8b4fe',
              background: '#ffffff',
              color: '#7e22ce',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                width: 16,
                height: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                border: '1px solid #d8b4fe',
                lineHeight: 1
              }}
            >
              +
            </span>
            Drop inside
          </span>
        </div>
      ) : null}
      {nestable ? (
        <div className="flex w-full flex-col gap-2">
          {element.elementId === 'columns' ? (
            (() => {
              const desktopColumns = Math.max(1, Math.min(16, Number(element.props.columns ?? '2') || 2))
              const tabletColumns = Math.max(1, Math.min(16, Number(element.props.columnsTablet ?? String(desktopColumns)) || desktopColumns))
              const mobileColumns = Math.max(1, Math.min(16, Number(element.props.columnsMobile ?? '1') || 1))
              const viewport = options?.viewport ?? 'desktop'
              const columnsCount = viewport === 'mobile' ? mobileColumns : viewport === 'tablet' ? tabletColumns : desktopColumns
              const sourceChildren = childrenElements ?? []
              const columns: ComponentElement[][] = Array.from({ length: columnsCount }, () => [])
              sourceChildren.forEach((child, index) => {
                columns[index % columnsCount].push(child)
              })

              return (
                <div
                  style={{
                    width: '100%',
                    border: isEditMode ? '2px solid rgba(216, 180, 254, 0.8)' : 'none',
                    borderRadius: isEditMode ? 10 : 0,
                    background: isEditMode ? 'rgba(148, 163, 184, 0.04)' : 'transparent',
                    padding: isEditMode ? 12 : 0
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                      gap: (() => {
                        const desktopGap = Math.max(0, Math.min(64, Number(element.props.gap ?? '16') || 16))
                        const tabletGap = Math.max(0, Math.min(64, Number(element.props.gapTablet ?? String(desktopGap)) || desktopGap))
                        const mobileGap = Math.max(0, Math.min(64, Number(element.props.gapMobile ?? '12') || 12))
                        return viewport === 'mobile' ? mobileGap : viewport === 'tablet' ? tabletGap : desktopGap
                      })(),
                      minHeight: isEditMode ? 120 : 0
                    }}
                  >
                    {columns.map((items, colIndex) => (
                      <div
                        key={`${element.id}-col-${colIndex}`}
                        className={isEditMode ? 'rounded-md border border-dashed border-neutral-300 bg-neutral-50/40 p-2' : ''}
                        style={{ minHeight: isEditMode ? 110 : 0 }}
                      >
                        <NestDropZone
                          parentElementId={element.id}
                          options={options}
                          dragFallbackId={dragFallbackId}
                        >
                          {items.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {items.map((child, childIndex) =>
                                renderChildNode ? renderChildNode(child, element.id, childIndex > 0 ? items[childIndex - 1]?.id ?? null : null) : null
                              )}
                            </div>
                          ) : isEditMode ? (
                            <div className="flex min-h-[84px] items-center justify-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  const rect = event.currentTarget.getBoundingClientRect()
                                  openInsertMenu(
                                    rect.left + rect.width / 2,
                                    rect.bottom + 6,
                                    computeColumnInsertPlacement(
                                      element.id,
                                      colIndex,
                                      columnsCount,
                                      sourceChildren
                                    )
                                  )
                                }}
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '999px',
                                  border: '1px solid rgba(148,163,184,.7)',
                                  background: 'rgba(255,255,255,.9)',
                                  color: '#9ca3af',
                                  fontSize: 22,
                                  lineHeight: 1,
                                  cursor: 'pointer'
                                }}
                                aria-label="Add element in column"
                              >
                                +
                              </button>
                            </div>
                          ) : null}
                        </NestDropZone>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()
          ) : hasRenderableChildren || hasChildren ? (
            isContainerElement ? null : (readyNode ?? <ElementPlaceholder element={element} />)
          ) : isEditMode ? (
            <div
              style={{
                width: '100%',
                minHeight: 96,
                border: '2px dashed rgba(148, 163, 184, 0.45)',
                borderRadius: 10,
                background: 'rgba(148, 163, 184, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16
              }}
            >
              <div style={{ display: 'grid', gap: 14, justifyItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setShowColumnsPicker(true)
                    }}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(148, 163, 184, 0.25)',
                      color: '#111827',
                      fontWeight: 700,
                      fontSize: 20,
                      border: '1px solid rgba(148,163,184,.45)',
                      cursor: 'pointer'
                    }}
                    aria-label="Choose columns preset"
                  >
                    +
                  </button>
                  <span
                    aria-hidden
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(148, 163, 184, 0.25)',
                      color: '#111827',
                      fontWeight: 700,
                      fontSize: 14
                    }}
                  >
                    ▦
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(216, 180, 254, 0.85)',
                      color: '#111827',
                      fontWeight: 700,
                      fontSize: 20
                    }}
                  >
                    ✦
                  </span>
                </div>
                {!isDragging ? (
                  <p style={{ margin: 0, fontSize: 18, color: '#4b5563', fontStyle: 'italic' }}>Перетащите виджет</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {element.elementId !== 'columns' ? (
            <NestDropZone
              parentElementId={element.id}
              options={options}
              dragFallbackId={dragFallbackId}
            >
              {childrenContent}
            </NestDropZone>
          ) : null}
        </div>
      ) : inlineEdit ? null : (
        readyNode ?? <ElementPlaceholder element={element} />
      )}
      {showColumnsPicker && typeof document !== 'undefined'
        ? createPortal(
            <div
              onClick={() => setShowColumnsPicker(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100000,
                background: 'rgba(15,23,42,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12
              }}
            >
              <div
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                style={{
                  width: 'min(420px, 100%)',
                  maxHeight: 'calc(100vh - 24px)',
                  overflow: 'auto',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,.5)',
                  background: 'rgba(255,255,255,.99)',
                  boxShadow: '0 12px 30px rgba(0,0,0,.18)',
                  padding: 14,
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr',
                  gap: 10
                }}
              >
                <div className="flex items-center justify-between">
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>Выберите структуру</p>
                  <button
                    type="button"
                    onClick={() => setShowColumnsPicker(false)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#6b7280',
                      fontSize: 18,
                      lineHeight: 1,
                      cursor: 'pointer'
                    }}
                    aria-label="Close columns picker"
                  >
                    ×
                  </button>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 8,
                    alignContent: 'start'
                  }}
                >
                  {columnPresets.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        options?.onDropElement?.(`columns:${count}`, { parentId: element.id })
                        setShowColumnsPicker(false)
                      }}
                      style={{
                        border: '1px solid rgba(148,163,184,.6)',
                        borderRadius: 8,
                        background: '#f8fafc',
                        cursor: 'pointer',
                        padding: '10px 8px',
                        display: 'grid',
                        gap: 8
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                          gap: 4,
                          height: 26
                        }}
                      >
                        {Array.from({ length: count }).map((_, idx) => (
                          <span
                            key={idx}
                            style={{
                              border: '1px dashed #94a3b8',
                              borderRadius: 4,
                              background: 'rgba(148,163,184,.18)'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                        {count === 1 ? '1 блок' : `${count} блока`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
      {/* ── Портал: мини-каталог инлайн-вставки ── */}
      {insertMenuOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: Math.max(8, Math.min(insertMenuPos.x - 110, (typeof window !== 'undefined' ? window.innerWidth : 800) - 236)),
                top: insertMenuPos.y,
                zIndex: 100002,
                width: 228,
                borderRadius: 10,
                border: '1px solid rgba(124,58,237,0.25)',
                background: '#ffffff',
                boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                padding: 10,
              }}
            >
              {/* Заголовок */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Вставить элемент</span>
                <button
                  type="button"
                  onClick={() => closeInsertMenu()}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}
                  aria-label="Закрыть"
                >×</button>
              </div>
              {/* Сетка элементов */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {QUICK_INSERT_ELEMENTS.map(({ id, label, char, color }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      const placement = insertMenuPlacement ?? { parentId, afterElementId: element.id }
                      options?.onDropElement?.(id, placement)
                      closeInsertMenu()
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px 4px',
                      borderRadius: 8,
                      border: '1px solid rgba(148,163,184,0.3)',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${color}18` }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
                  >
                    <span style={{ fontSize: 16, color, lineHeight: 1 }}>{char}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#475569', lineHeight: 1.1, textAlign: 'center' }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

function NestDropZone({
  parentElementId,
  options,
  dragFallbackId,
  children
}: {
  parentElementId: string
  options?: ElementPreviewOptions
  dragFallbackId?: string | null
  children: React.ReactNode
}) {
  const [active, setActive] = React.useState(false)
  const dragDepthRef = React.useRef(0)

  React.useEffect(() => {
    const reset = () => {
      dragDepthRef.current = 0
      setActive(false)
    }
    window.addEventListener('dragend', reset)
    window.addEventListener('drop', reset)
    window.addEventListener('pointerup', reset)
    const onDragState = (event: Event) => {
      const custom = event as CustomEvent<{ phase?: 'start' | 'end' }>
      if (custom.detail?.phase === 'end') reset()
    }
    window.addEventListener('randee:element-drag', onDragState as EventListener)
    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', reset)
      window.removeEventListener('pointerup', reset)
      window.removeEventListener('randee:element-drag', onDragState as EventListener)
    }
  }, [])

  return (
    <div
      className="min-h-[24px] rounded-md p-1"
      onDragOver={(event) => {
        const elementId = readDraggedElementId(event, dragFallbackId)
        if (!options?.onDropElement || !elementId) return
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'move'
        if (!active) setActive(true)
        options.onDropDebug?.({
          phase: 'dragover',
          targetElementId: parentElementId,
          zone: 'inside',
          draggedElementId: elementId,
          parentId: parentElementId
        })
      }}
      onDragEnter={(event) => {
        const elementId = readDraggedElementId(event, dragFallbackId)
        if (!options?.onDropElement || !elementId) return
        event.preventDefault()
        event.stopPropagation()
        dragDepthRef.current += 1
        if (!active) setActive(true)
      }}
      onDragLeave={(event) => {
        const elementId = readDraggedElementId(event, dragFallbackId)
        if (!options?.onDropElement || !elementId) return
        event.preventDefault()
        event.stopPropagation()
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
        if (dragDepthRef.current === 0 && active) setActive(false)
      }}
      onDrop={(event) => {
        const elementId = readDraggedElementId(event, dragFallbackId)
        if (!options?.onDropElement || !elementId) return
        event.preventDefault()
        event.stopPropagation()
        dragDepthRef.current = 0
        setActive(false)
        options.onDropDebug?.({
          phase: 'drop',
          targetElementId: parentElementId,
          zone: 'inside',
          draggedElementId: elementId,
          parentId: parentElementId
        })
        options.onDropElement(elementId, { parentId: parentElementId })
        window.dispatchEvent(
          new CustomEvent('randee:element-drag', {
            detail: { phase: 'end', elementId: null }
          })
        )
      }}
      style={
        active
          ? {
              width: '100%',
              boxSizing: 'border-box',
              alignSelf: 'stretch',
              border: '2px dashed #d8b4fe',
              background: 'rgba(216, 180, 254, 0.14)'
            }
          : {
              width: '100%',
              boxSizing: 'border-box',
              alignSelf: 'stretch',
              border: '1px dashed transparent',
              background: 'transparent'
            }
      }
    >
      {active ? (
        <div className="mb-2 flex items-center justify-center">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              border: '1px solid #d8b4fe',
              background: '#ffffff',
              color: '#7e22ce',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                width: 16,
                height: 16,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
                border: '1px solid #d8b4fe',
                lineHeight: 1
              }}
            >
              +
            </span>
            Drop inside
          </span>
        </div>
      ) : null}
      {children}
    </div>
  )
}

export function ElementTreePreview({
  elements,
  options
}: {
  elements: ComponentElement[]
  options?: ElementPreviewOptions
}) {
  const [menu, setMenu] = React.useState<{ elementId: string; x: number; y: number } | null>(null)
  const [menuQuery, setMenuQuery] = React.useState('')
  const [portalReady, setPortalReady] = React.useState(false)
  const [isRootDropTarget, setIsRootDropTarget] = React.useState(false)
  const [dragFallbackId, setDragFallbackId] = React.useState<string | null>(null)

  const elementsByParent = React.useMemo(() => {
    const map = new Map<string | null, ComponentElement[]>()
    const push = (parentId: string | null, element: ComponentElement) => {
      const current = map.get(parentId) ?? []
      current.push(element)
      map.set(parentId, current)
    }
    elements.forEach((element) => push(element.parentId ?? null, element))
    return map
  }, [elements])

  const renderBranch = React.useCallback(
    (parentId: string | null): React.ReactNode => {
      const branch = elementsByParent.get(parentId) ?? []
      const renderOne = (
        element: ComponentElement,
        currentParentId: string | null,
        previousSiblingId: string | null
      ) => (
        <div key={element.id} className="flex w-full flex-col gap-2">
          <ElementNode
            element={element}
            parentId={currentParentId}
            prevSiblingId={previousSiblingId}
            dragFallbackId={dragFallbackId}
            options={{
              ...options,
              onDropDebug: (payload) => {
                options?.onDropDebug?.(payload)
              }
            }}
            onOpenContextMenu={(elementId, x, y) => setMenu({ elementId, x, y })}
            childrenContent={isNestableElement(element) ? renderBranch(element.id) : null}
            hasChildren={(elementsByParent.get(element.id)?.length ?? 0) > 0}
            childrenElements={elementsByParent.get(element.id) ?? []}
            renderChildNode={(child, childParentId, childPrevSiblingId) =>
              renderOne(child, childParentId, childPrevSiblingId)
            }
          />
        </div>
      )
      return branch.map((element, index) =>
        renderOne(element, parentId, index > 0 ? branch[index - 1].id : null)
      )
    },
    [dragFallbackId, elementsByParent, options]
  )

  React.useEffect(() => {
    setPortalReady(true)
  }, [])

  React.useEffect(() => {
    if (!menu) return
    setMenuQuery('')
    const close = () => setMenu(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      close()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menu])

  React.useEffect(() => {
    const onDragState = (event: Event) => {
      const custom = event as CustomEvent<{ phase?: 'start' | 'end'; elementId?: string | null }>
      const phase = custom.detail?.phase
      if (phase === 'start') {
        setDragFallbackId(custom.detail?.elementId ?? null)
      } else if (phase === 'end') {
        setDragFallbackId(null)
        setIsRootDropTarget(false)
      }
    }
    window.addEventListener('randee:element-drag', onDragState as EventListener)
    return () => window.removeEventListener('randee:element-drag', onDragState as EventListener)
  }, [])

  React.useEffect(() => {
    const reset = () => setIsRootDropTarget(false)
    window.addEventListener('dragend', reset)
    window.addEventListener('drop', reset)
    window.addEventListener('pointerup', reset)
    return () => {
      window.removeEventListener('dragend', reset)
      window.removeEventListener('drop', reset)
      window.removeEventListener('pointerup', reset)
    }
  }, [])

  return (
    <>
      <div
        className="randee-element-tree flex w-full flex-col gap-3 p-2"
        onDragOver={(event) => {
          const elementId = readDraggedElementId(event, dragFallbackId)
          if (!options?.onDropElement || !elementId) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          if (!isRootDropTarget) setIsRootDropTarget(true)
          const payload = {
            phase: 'dragover' as const,
            targetElementId: null,
            zone: 'root' as const,
            draggedElementId: elementId,
            parentId: null
          }
          options.onDropDebug?.(payload)
        }}
        onDragLeave={() => {
          if (isRootDropTarget) setIsRootDropTarget(false)
        }}
        onDrop={(event) => {
          const elementId = readDraggedElementId(event, dragFallbackId)
          if (!options?.onDropElement || !elementId) return
          event.preventDefault()
          setIsRootDropTarget(false)
          const payload = {
            phase: 'drop' as const,
            targetElementId: null,
            zone: 'root' as const,
            draggedElementId: elementId,
            parentId: null
          }
          options.onDropDebug?.(payload)
          options.onDropElement(elementId, { parentId: null })
          setDragFallbackId(null)
          window.dispatchEvent(
            new CustomEvent('randee:element-drag', {
              detail: { phase: 'end', elementId: null }
            })
          )
        }}
      >
        {isRootDropTarget ? (
          <div
            className="rounded-md"
            style={{
              minHeight: 68,
              border: '2px dashed #d8b4fe',
              background: 'rgba(216, 180, 254, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                border: '1px solid #d8b4fe',
                background: '#ffffff',
                color: '#7e22ce',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  width: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                border: '1px solid #d8b4fe',
                  lineHeight: 1
                }}
              >
                +
              </span>
              Drop element here
            </span>
          </div>
        ) : null}
        {!isRootDropTarget && elements.length === 0 ? (
          <div
            className="rounded-md"
            style={{
              minHeight: 68,
              border: '1px dashed rgba(148, 163, 184, 0.7)',
              background: 'rgba(148, 163, 184, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                border: '1px solid rgba(148, 163, 184, 0.8)',
                background: 'rgba(255,255,255,0.95)',
                color: '#334155',
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  width: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  border: '1px solid rgba(148, 163, 184, 0.8)',
                  lineHeight: 1
                }}
              >
                +
              </span>
              Drop first element here
            </span>
          </div>
        ) : null}
          {renderBranch(null)}
      </div>
      {portalReady && menu
        ? createPortal(
        <div
          data-context-menu
          style={{
            position: 'fixed',
            left: menu.x + 6,
            top: menu.y + 6,
            zIndex: 99999,
            width: 320,
            maxWidth: 'calc(100vw - 16px)',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: '#1f2127',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
            padding: 8
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            className="mb-2 flex items-center gap-2 rounded-md px-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span style={{ color: '#9ca3af', fontSize: 14 }}>⌕</span>
            <input
              value={menuQuery}
              onChange={(event) => setMenuQuery(event.target.value)}
              placeholder="Поиск действия…"
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#e5e7eb', border: 'none' }}
            />
          </div>
          {(() => {
            const menuElement = elements.find((item) => item.id === menu.elementId)
            const rows: Array<{
              type: 'item' | 'separator'
              label?: string
              shortcut?: string
              disabled?: boolean
              destructive?: boolean
              onClick?: () => void
            }> = [
              {
                type: 'item',
                label: 'Дублировать',
                shortcut: '⌘D',
                disabled: !options?.onDuplicateElement,
                onClick: () => options?.onDuplicateElement?.(menu.elementId)
              },
              {
                type: 'item',
                label: 'Переименовать',
                shortcut: '⌘R',
                disabled: !options?.onRenameElement,
                onClick: () => {
                  const current = menuElement?.name ?? menuElement?.elementId ?? 'Элемент'
                  const next = window.prompt('Имя элемента', current)?.trim()
                  if (next) options?.onRenameElement?.(menu.elementId, next)
                }
              },
              { type: 'separator' },
              {
                type: 'item',
                label: 'Выше',
                shortcut: '↑',
                disabled: !options?.onMoveElement,
                onClick: () => options?.onMoveElement?.(menu.elementId, 'up')
              },
              {
                type: 'item',
                label: 'Ниже',
                shortcut: '↓',
                disabled: !options?.onMoveElement,
                onClick: () => options?.onMoveElement?.(menu.elementId, 'down')
              },
              { type: 'separator' },
              {
                type: 'item',
                label: 'Удалить',
                destructive: true,
                disabled: !options?.onDeleteElement,
                onClick: () => options?.onDeleteElement?.(menu.elementId)
              }
            ]
            const query = menuQuery.trim().toLowerCase()
            const filtered = query
              ? rows.filter((row) => row.type === 'item' && row.label?.toLowerCase().includes(query))
              : rows
            return (
              <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                {filtered.map((row, index) =>
                  row.type === 'separator' ? (
                    <div
                      key={`sep-${index}`}
                      className="my-1 h-px"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    />
                  ) : (
                    <button
                      key={`${row.label}-${index}`}
                      type="button"
                      disabled={Boolean(row.disabled)}
                      className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm"
                      style={{
                        background: row.destructive ? '#1294f5' : 'transparent',
                        border: 'none',
                        cursor: row.disabled ? 'default' : 'pointer',
                        color: row.disabled ? '#6b7280' : row.destructive ? '#ffffff' : '#f3f4f6',
                        opacity: row.disabled ? 0.6 : 1
                      }}
                      onClick={() => {
                        row.onClick?.()
                        setMenu(null)
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate">{row.label}</span>
                      {row.shortcut ? (
                        <span className="ml-2 shrink-0 text-xs" style={{ color: row.destructive ? '#e5f4ff' : '#9ca3af' }}>
                          {row.shortcut}
                        </span>
                      ) : null}
                    </button>
                  )
                )}
              </div>
            )
          })()}
        </div>,
        document.body
      )
        : null}
    </>
  )
}
