'use client'

import * as React from 'react'
import {
  buildBuilderWebPageJsonLd,
  type BuilderCmsConnection,
  createBuilderStore,
  exportPageToJson,
  resolveComponentDesign,
  selectedBlock,
  type BuilderPage,
  type ElementVariant,
  type PageBlock,
  type ViewportMode
} from '@randee/builder'
import { BlockPreview, BlockVendorProvider, collectTemplateVendors, createBlockFromTemplate, getBlockLayerAssets, getElementVariant, invalidateTemplateStyles, isUserComponentTemplateId, listElementVariants, listLibraryVariants, listVendors, registerUserTemplate, setCustomElementVariants, TemplateRevisionProvider, type LibraryVariant } from '@randee/blocks'
import { BuilderElementPicker } from './builder-element-picker'
import { useSearchParams } from 'next/navigation'
import { useStore } from 'zustand'
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  Component,
  FileText,
  Globe,
  Play,
  X,
  Copy,
  Database,
  Download,
  GripVertical,
  Hand,
  Layers,
  LayoutTemplate,
  LayoutGrid,
  MoreHorizontal,
  MousePointer2,
  PanelLeftOpen,
  PanelRightClose,
  PenTool,
  Pencil,
  Plus,
  Redo2,
  Ruler,
  Save,
  Search,
  SlidersHorizontal,
  SquarePlus,
  Type,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CanvasBlockOverlay,
  type ResizeEdge,
  type BlockOverlayDragHandle
} from './builder-canvas-block-overlay'
import {
  CANVAS_PADDING,
  CanvasRulerHorizontal,
  CanvasRulerVertical,
  measureElementContentOrigin,
  PANEL_LEFT_DEFAULT,
  PANEL_LEFT_MAX,
  PANEL_LEFT_MIN,
  PANEL_RIGHT_DEFAULT,
  PANEL_RIGHT_MAX,
  PANEL_RIGHT_MIN,
  PanelResizeHandle,
  RULER_SIZE,
  canvasGridStyle,
  clampPanelWidth,
  isEditableTarget
} from './builder-canvas-chrome'
import {
  isCanvasTool,
  isViewportOrientation,
  loadBuilderSession,
  saveBuilderSession,
  type BuilderCanvasTool
} from './builder-session'
import { BuilderLeftPanel, type LeftTab, type SavedAssetComponent } from './builder-left-panel'
import { BuilderAssetEditor } from './builder-asset-editor'
import { isEditableAsset, type BuilderAssetTarget } from './builder-asset-types'
import { openTemplateAssetInIde } from './builder-ide'
import { useCmsPreviewData } from './use-cms-preview-data'
import { BuilderComponentInspector } from './builder-component-inspector'
import { BlockPropsFields } from './builder-block-props-fields'
import { componentArtboardStyle, componentRootStyle } from './builder-component-canvas'
import { BuilderThemeToggle } from './builder-theme-toggle'
import type { InspectorTheme } from './builder-inspector-ui'
import { BuilderViewportToolbar } from './builder-viewport-toolbar'
import { BuilderInstructions } from './builder-instructions'
import { BuilderCms } from './builder-cms'
import { resolveViewportSize, type ViewportOrientation } from './builder-viewport'
import {
  attachCanvasPinchZoom,
  CANVAS_PAN_TOUCH_STYLES,
  CANVAS_TOUCH_STYLES
} from './builder-canvas-gestures'

const CANVAS_WORKSPACE_PAD = 520
const CANVAS_PAN_GUTTER = 640
const MULTI_FRAME_GAP = 80
const TEMPLATE_SEARCH_ALIASES: Record<string, string[]> = {
  'component-03': ['slider', 'swiper', 'cms slider', 'анонсы', 'слайдер', 'карусель']
}

const DEFAULT_CMS_CONNECTION: BuilderCmsConnection = {
  provider: 'bitrix',
  siteUrl: '',
  connectorPath: '/local/modules/randee.connector/tools/connector.php',
  apiKey: '',
  enabled: false
}

function normalizeWheelDelta(event: WheelEvent) {
  let { deltaX, deltaY } = event
  if (event.deltaMode === 1) {
    deltaX *= 16
    deltaY *= 16
  } else if (event.deltaMode === 2) {
    deltaX *= window.innerWidth
    deltaY *= window.innerHeight
  }
  return { deltaX, deltaY }
}

function isTrackpadPinchZoom(event: WheelEvent) {
  return event.ctrlKey
}

function clampZoom(value: number) {
  return Math.min(200, Math.max(10, Math.round(value * 10) / 10))
}

type CanvasTool = BuilderCanvasTool
type UiTheme = 'light' | 'dark'

const vendorLibraries = listVendors()

const themeTokens = {
  dark: {
    // ── Framer-exact dark palette ──────────────────────────
    bg:            '#111111',
    panel:         '#1C1C1C',   // was #171717
    panelElevated: '#222222',   // was #1c1c1c
    canvas:        '#111111',   // was #2b2b2b — matches Framer
    chromeBorder:  '#252525',   // was rgba semi-transparent
    divider:       '#2C2C2C',   // was rgba — opaque Framer value
    text:          '#E8E8E8',   // was #f5f5f5
    textSecondary: '#999999',   // was #a3a3a3
    textMuted:     '#555555',   // was #737373
    hover:         '#242424',   // was rgba — opaque
    active:        '#2E2E2E',   // was rgba — opaque
    inputBg:       '#252525',   // was rgba — opaque, consistent
    inputFocus:    'rgba(0,153,255,0.4)',
    toolbar:       'rgba(20,20,20,0.97)',
    toolbarBorder: '#282828',
    menu:          '#1E1E1E',
    menuBorder:    '#303030',
    accent:        '#0099FF',
    accentHover:   '#33AAFF',
    pageFrame:     '#ffffff',
    fab:           '#1E1E1E',
    segmentTrack:  '#222222',
    segmentActive: '#333333',
    segmentShadow: '0 1px 3px rgba(0,0,0,0.5)'
  },
  light: {
    bg: '#ffffff',
    panel: '#ffffff',
    panelElevated: '#fafafa',
    canvas: '#ebebeb',
    chromeBorder: 'rgba(0,0,0,0.08)',
    divider: 'rgba(0,0,0,0.06)',
    text: '#171717',
    textSecondary: '#525252',
    textMuted: '#737373',
    hover: 'rgba(0,0,0,0.04)',
    active: 'rgba(0,0,0,0.07)',
    inputBg: 'rgba(0,0,0,0.03)',
    inputFocus: 'rgba(0,145,255,0.5)',
    toolbar: 'rgba(255,255,255,0.96)',
    toolbarBorder: 'rgba(0,0,0,0.1)',
    menu: '#ffffff',
    menuBorder: 'rgba(0,0,0,0.1)',
    accent: '#0091ff',
    accentHover: '#0077d6',
    pageFrame: '#ffffff',
    fab: '#ffffff',
    segmentTrack: '#f3f3f3',
    segmentActive: '#ffffff',
    segmentShadow: '0 1px 2px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)'
  }
} as const

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function BuilderEditor() {
  const searchParams = useSearchParams()
  const initialSlug = searchParams.get('slug')
  const [store] = React.useState(() => createBuilderStore())
  const [leftOpen, setLeftOpen] = React.useState(true)
  const [rightOpen, setRightOpen] = React.useState(true)
  const [leftTab, setLeftTab] = React.useState<LeftTab>('blocks')
  const [insertOpen, setInsertOpen] = React.useState(false)
  const [newOpen, setNewOpen] = React.useState(false)
  const [guideOpen, setGuideOpen] = React.useState(false)
  const [cmsOpen, setCmsOpen] = React.useState(false)
  const [creatingComponent, setCreatingComponent] = React.useState(false)
  const [variantTick, setVariantTick] = React.useState(0)
  const [templateRevisions, setTemplateRevisions] = React.useState<Record<string, number>>({})
  const [pageSaveStatus, setPageSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const pageLoadedFromDiskRef = React.useRef(false)
  const lastSavedPageJsonRef = React.useRef<string>('')
  const [pageHydrated, setPageHydrated] = React.useState(false)
  const [savedAssetComponents, setSavedAssetComponents] = React.useState<SavedAssetComponent[]>([])
  const [pagesList, setPagesList] = React.useState<Array<{ slug: string; page: string }>>([])
  const [savingToAssets, setSavingToAssets] = React.useState(false)
  const [pendingSaveTemplateId, setPendingSaveTemplateId] = React.useState<string | null>(null)
  const [customElementVariants, setCustomElementVariantsState] = React.useState<ElementVariant[]>([])
  const [componentEditMode, setComponentEditMode] = React.useState(false)
  const [componentEditFocus, setComponentEditFocus] = React.useState<'artboard' | 'component'>('component')
  const [zoomOpen, setZoomOpen] = React.useState(false)
  const [librarySearch, setLibrarySearch] = React.useState('')
  const [insertPanelTab, setInsertPanelTab] = React.useState<'insert' | 'layout' | 'text' | 'vector' | 'cms'>('insert')
  const [insertCategory, setInsertCategory] = React.useState('sections')
  const [isReady, setIsReady] = React.useState(false)
  const [zoom, setZoom] = React.useState(50)
  const [canvasTool, setCanvasTool] = React.useState<CanvasTool>('select')
  const [theme, setTheme] = React.useState<UiTheme>('dark')
  const [tabletOrientation, setTabletOrientation] = React.useState<ViewportOrientation>('portrait')
  const [mobileOrientation, setMobileOrientation] = React.useState<ViewportOrientation>('portrait')
  const [isPanning, setIsPanning] = React.useState(false)
  const [showRuler, setShowRuler] = React.useState(false)
  const [showGrid, setShowGrid] = React.useState(true)
  const [showHotkeys, setShowHotkeys] = React.useState(false)
  const [gridSize, setGridSize] = React.useState(20)
  const [gridMajorStep, setGridMajorStep] = React.useState(5)
  const [gridSettingsOpen, setGridSettingsOpen] = React.useState(false)
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false)
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false)
  const exportMenuRef = React.useRef<HTMLDivElement>(null)
  const [previewMode, setPreviewMode] = React.useState(false)
  // Какие viewport-ы показаны на canvas (мультиселект)
  // Инициализируется как ['desktop'], но синхронизируется с реальным viewport при загрузке сессии
  const [shownViewports, setShownViewports] = React.useState<ViewportMode[]>(['desktop'])
  const [pageInspectorTab, setPageInspectorTab] = React.useState<'page' | 'block' | 'seo'>('block')
  const [canvasScroll, setCanvasScroll] = React.useState({ left: 0, top: 0 })
  const [openAsset, setOpenAsset] = React.useState<BuilderAssetTarget | null>(null)
  const [rulerOrigin, setRulerOrigin] = React.useState({ x: CANVAS_WORKSPACE_PAD, y: CANVAS_WORKSPACE_PAD })
  const [frameNaturalHeight, setFrameNaturalHeight] = React.useState(900)
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(PANEL_LEFT_DEFAULT)
  const [rightPanelWidth, setRightPanelWidth] = React.useState(PANEL_RIGHT_DEFAULT)
  const [resizingPanel, setResizingPanel] = React.useState<'left' | 'right' | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = React.useState<string | null>(null)
  const [isResizingBlock, setIsResizingBlock] = React.useState(false)
  const resizingBlockRef = React.useRef<{
    blockId: string
    edge: ResizeEdge
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)

  const panStart = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const resizeStart = React.useRef({ x: 0, width: 0 })
  const autoSyncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoSyncStatus, setAutoSyncStatus] = React.useState<'idle' | 'syncing' | 'ok' | 'error' | 'readonly'>(
    'idle'
  )

  const insertRef = React.useRef<HTMLDivElement>(null)
  const newRef = React.useRef<HTMLDivElement>(null)
  const overflowMenuRef = React.useRef<HTMLDivElement>(null)
  const zoomMenuRef = React.useRef<HTMLDivElement>(null)
  const gridSettingsRef = React.useRef<HTMLDivElement>(null)
  const canvasScrollRef = React.useRef<HTMLDivElement>(null)
  const canvasPanRef = React.useRef<HTMLDivElement>(null)
  const canvasHostRef = React.useRef<HTMLElement>(null)
  const canvasFrameRef = React.useRef<HTMLDivElement>(null)
  const blockRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const zoomLevelRef = React.useRef(zoom)
  const pinchStartRef = React.useRef({ distance: 0, zoom: zoom })
  const workspaceCenteredRef = React.useRef(false)

  const t = themeTokens[theme]
  const inspectorTheme: InspectorTheme = React.useMemo(
    () => ({
      panel: t.panel,
      divider: t.divider,
      text: t.text,
      textSecondary: t.textSecondary,
      textMuted: t.textMuted,
      hover: t.hover,
      inputBg: t.inputBg,
      accent: t.accent,
      segmentTrack: t.segmentTrack,
      segmentActive: t.segmentActive,
      segmentShadow: t.segmentShadow
    }),
    [t]
  )

  React.useEffect(() => {
    let cancelled = false

    void fetch('/api/builder/components')
      .then((response) => (response.ok ? response.json() : []))
      .then((templates: Array<{ manifest: Parameters<typeof registerUserTemplate>[0]; assets: Parameters<typeof registerUserTemplate>[1] }>) => {
        if (cancelled) return
        for (const item of templates) {
          registerUserTemplate(item.manifest, item.assets)
        }
        setVariantTick((value) => value + 1)
      })
      .catch(() => undefined)

    void fetch('/api/builder/assets/components')
      .then((response) => (response.ok ? response.json() : []))
      .then((templates: Array<{ templateId: string; manifest: { name: string; description: string } }>) => {
        if (cancelled) return
        setSavedAssetComponents(
          templates.map((item) => ({
            templateId: item.templateId,
            name: item.manifest.name,
            description: item.manifest.description
          }))
        )
      })
      .catch(() => undefined)

    void fetch('/api/builder/assets/elements')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload?.ok || !Array.isArray(payload.variants)) return
        const variants = payload.variants as ElementVariant[]
        setCustomElementVariantsState(variants)
        setCustomElementVariants(variants)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  const refreshPagesList = React.useCallback(() => {
    void fetch('/api/builder/pages')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload?.ok || !Array.isArray(payload.pages)) return
        setPagesList(payload.pages as Array<{ slug: string; page: string }>)
      })
      .catch(() => undefined)
  }, [])

  React.useEffect(() => {
    refreshPagesList()
  }, [refreshPagesList])

  const libraryVariants = React.useMemo(() => listLibraryVariants(), [variantTick])
  const filteredVariants = React.useMemo(() => {
    const query = librarySearch.trim().toLowerCase()
    return libraryVariants.filter((item) => {
      if (!query) return true
      const aliases = TEMPLATE_SEARCH_ALIASES[item.template] ?? []
      return [item.group, item.name, item.template, item.description, item.type, ...aliases]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [librarySearch, libraryVariants])
  const allElementVariants = React.useMemo(() => {
    const base = listElementVariants().filter((item) => !item.id.startsWith('custom:'))
    return [...customElementVariants, ...base]
  }, [customElementVariants])
  const insertElementGroups = React.useMemo(() => {
    const groups = allElementVariants.reduce<Record<string, ElementVariant[]>>((acc, item) => {
      const key = item.group || 'Elements'
      if (!acc[key]) acc[key] = []
      acc[key]!.push(item)
      return acc
    }, {})
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0], 'ru'))
      .map(([name, items]) => ({ name, items: items.sort((x, y) => x.name.localeCompare(y.name, 'ru')) }))
  }, [allElementVariants])
  const insertBlockGroups = React.useMemo(() => {
    const source = filteredVariants
    const groups = source.reduce<Record<string, typeof source>>((acc, item) => {
      if (!acc[item.group]) acc[item.group] = []
      acc[item.group]!.push(item)
      return acc
    }, {})
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0], 'ru'))
      .map(([name, items]) => ({ name, items }))
  }, [filteredVariants])

  const blockPreviewKey = React.useCallback(
    (block: PageBlock) => `${block.id}:${block.template}:${templateRevisions[block.template] ?? 0}`,
    [templateRevisions]
  )

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedTheme = window.localStorage.getItem('randee-builder-theme') as UiTheme | null
      setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark')

      const session = loadBuilderSession()
      if (isCanvasTool(session.canvasTool)) setCanvasTool(session.canvasTool)
      const savedLeftTab = (session as { leftTab?: string }).leftTab
      if (savedLeftTab === 'insert' || savedLeftTab === 'assets') setLeftTab('assets')
      else if (savedLeftTab === 'layers' || savedLeftTab === 'blocks') setLeftTab('blocks')
      else if (savedLeftTab === 'pages') setLeftTab('pages')
      else if (savedLeftTab === 'cms') setLeftTab('cms')
      else if (savedLeftTab === 'media') setLeftTab('media')
      if (typeof session.showRuler === 'boolean') setShowRuler(session.showRuler)
      if (typeof session.showGrid === 'boolean') setShowGrid(session.showGrid)
      if (typeof session.gridSize === 'number') setGridSize(session.gridSize)
      if (typeof session.gridMajorStep === 'number') setGridMajorStep(session.gridMajorStep)
      if (typeof session.leftPanelWidth === 'number') setLeftPanelWidth(session.leftPanelWidth)
      if (typeof session.rightPanelWidth === 'number') setRightPanelWidth(session.rightPanelWidth)
      if (typeof session.leftOpen === 'boolean') setLeftOpen(session.leftOpen)
      if (typeof session.rightOpen === 'boolean') setRightOpen(session.rightOpen)
      if (isViewportOrientation(session.tabletOrientation)) setTabletOrientation(session.tabletOrientation)
      if (isViewportOrientation(session.mobileOrientation)) setMobileOrientation(session.mobileOrientation)

      // Синхронизируем shownViewports с реальным viewport из сессии
      const sessionViewport = store.getState().viewport
      setShownViewports([sessionViewport])

      setIsReady(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  React.useEffect(() => {
    window.localStorage.setItem('randee-builder-theme', theme)
  }, [theme])

  React.useEffect(() => {
    if (!isReady) return
    saveBuilderSession({
      canvasTool,
      leftTab,
      showRuler,
      showGrid,
      gridSize,
      gridMajorStep,
      leftPanelWidth,
      rightPanelWidth,
      leftOpen,
      rightOpen,
      tabletOrientation,
      mobileOrientation
    })
  }, [
    isReady,
    canvasTool,
    leftTab,
    showRuler,
    showGrid,
    gridSize,
    gridMajorStep,
    leftPanelWidth,
    rightPanelWidth,
    leftOpen,
    rightOpen,
    tabletOrientation,
    mobileOrientation
  ])

  React.useEffect(() => {
    if (!insertOpen && !newOpen && !zoomOpen && !gridSettingsOpen && !overflowMenuOpen && !exportMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (insertOpen && insertRef.current && !insertRef.current.contains(target)) setInsertOpen(false)
      if (newOpen && newRef.current && !newRef.current.contains(target)) setNewOpen(false)
      if (zoomOpen && zoomMenuRef.current && !zoomMenuRef.current.contains(target)) setZoomOpen(false)
      if (gridSettingsOpen && gridSettingsRef.current && !gridSettingsRef.current.contains(target)) {
        setGridSettingsOpen(false)
      }
      if (overflowMenuOpen && overflowMenuRef.current && !overflowMenuRef.current.contains(target)) {
        setOverflowMenuOpen(false)
      }
      if (exportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setExportMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [insertOpen, newOpen, zoomOpen, gridSettingsOpen, overflowMenuOpen, exportMenuOpen])

  const page = useStore(store, (state) => state.page)
  const activeId = useStore(store, (state) => state.selectedBlockId)
  const selectedElementId = useStore(store, (state) => state.selectedElementId)

  React.useEffect(() => {
    let cancelled = false
    const slugToLoad = (initialSlug?.trim() || 'home').replace(/^\//, '') || 'home'

    void fetch(`/api/builder/pages/${encodeURIComponent(slugToLoad)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded) => {
        if (cancelled || !loaded) return
        store.getState().loadPage(loaded as BuilderPage)
        pageLoadedFromDiskRef.current = true
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPageHydrated(true)
      })

    return () => {
      cancelled = true
    }
  }, [initialSlug, store])

  const pageJson = exportPageToJson(page)
  React.useEffect(() => {
    if (!pageHydrated) return
    if (!lastSavedPageJsonRef.current) {
      lastSavedPageJsonRef.current = pageJson
      setHasUnsavedChanges(false)
      return
    }
    setHasUnsavedChanges(pageJson !== lastSavedPageJsonRef.current)
  }, [pageHydrated, pageJson])

  React.useEffect(() => {
    if (pageSaveStatus !== 'saved' && pageSaveStatus !== 'error') return
    const timer = window.setTimeout(() => setPageSaveStatus('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [pageSaveStatus])

  React.useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  React.useEffect(() => {
    if (!pageHydrated) return
    const slug = page.slug.trim()
    const slugKey = slug.replace(/^\//, '') || 'home'
    const timer = window.setTimeout(() => {
      const savingJson = pageJson
      setPageSaveStatus('saving')
      void fetch(`/api/builder/pages/${encodeURIComponent(slugKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: savingJson
      })
        .then((response) => {
          if (response.ok) {
            lastSavedPageJsonRef.current = savingJson
            setHasUnsavedChanges(false)
          }
          setPageSaveStatus(response.ok ? 'saved' : 'error')
        })
        .catch(() => setPageSaveStatus('error'))
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [pageHydrated, pageJson, page.slug])

  const viewport = useStore(store, (state) => state.viewport)
  const block = useStore(store, selectedBlock)
  const componentDesign = React.useMemo(() => (block ? resolveComponentDesign(block.design) : null), [block])
  const canvasBlocks = React.useMemo(() => {
    if (!componentEditMode) return page.blocks
    if (!block) return []
    return page.blocks.filter((item) => item.id === block.id)
  }, [componentEditMode, block, page.blocks])
  const seoJsonLd = buildBuilderWebPageJsonLd(page.seo)
  const firstBlockId = page.blocks[0]?.id ?? null

  const updateRulerOrigin = React.useCallback(() => {
    const scrollEl = canvasScrollRef.current
    if (!scrollEl) return

    const blockIdForRuler = componentEditMode ? block?.id ?? firstBlockId : firstBlockId
    const blockEl = blockIdForRuler ? blockRefs.current[blockIdForRuler] : null
    const artboardEl = blockEl?.querySelector('[data-randee-component-artboard]') as HTMLElement | null
    const measureEl = artboardEl ?? blockEl ?? canvasFrameRef.current

    if (!measureEl) return

    setRulerOrigin(measureElementContentOrigin(measureEl, scrollEl))
  }, [block?.id, componentEditMode, firstBlockId])

  const viewportSize = React.useMemo(
    () => resolveViewportSize(viewport, tabletOrientation, mobileOrientation),
    [viewport, tabletOrientation, mobileOrientation]
  )

  const rotateViewport = React.useCallback((mode: 'tablet' | 'mobile') => {
    if (mode === 'tablet') {
      setTabletOrientation((value) => (value === 'portrait' ? 'landscape' : 'portrait'))
      return
    }
    setMobileOrientation((value) => (value === 'portrait' ? 'landscape' : 'portrait'))
  }, [])

  const groupedVariants = React.useMemo(
    () =>
      filteredVariants.reduce<Record<string, LibraryVariant[]>>((acc, item) => {
        acc[item.group] = [...(acc[item.group] ?? []), item]
        return acc
      }, {}),
    [filteredVariants]
  )

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  function handleCanvasDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const blocks = store.getState().page.blocks
    const fromIndex = blocks.findIndex((b) => b.id === active.id)
    const toIndex = blocks.findIndex((b) => b.id === over.id)
    if (fromIndex !== -1 && toIndex !== -1) {
      store.getState().moveBlock(fromIndex, toIndex)
    }
  }

  const onBlockResizeStart = React.useCallback(
    (blockId: string, edge: ResizeEdge, event: React.PointerEvent) => {
      event.stopPropagation()
      const target = store.getState().page.blocks.find((b) => b.id === blockId)
      if (!target) return
      const design = resolveComponentDesign(target.design)
      resizingBlockRef.current = {
        blockId,
        edge,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: design.size.width,
        startHeight: design.size.height
      }
      setIsResizingBlock(true)
    },
    [store]
  )

  const onBlockSelect = React.useCallback(
    (id: string) => { store.getState().selectBlock(id) },
    [store]
  )

  const onBlockEdit = React.useCallback(
    (id: string) => {
      store.getState().selectBlock(id)
      setComponentEditMode(true)
      setComponentEditFocus('component')
      setRightOpen(true)
    },
    [store]
  )

  const onBlockDuplicate = React.useCallback(
    (id: string) => { store.getState().duplicateBlock(id) },
    [store]
  )

  const onBlockDelete = React.useCallback(
    (id: string) => { store.getState().removeBlock(id) },
    [store]
  )

  const onBlockRef = React.useCallback(
    (id: string, el: HTMLElement | null) => { blockRefs.current[id] = el },
    []
  )

  const cmsConnection = page.cmsConnection ?? DEFAULT_CMS_CONNECTION

  React.useEffect(() => {
    if (!page.cmsConnection) {
      store.getState().setCmsConnection(DEFAULT_CMS_CONNECTION)
    }
  }, [page.cmsConnection, store])

  const saveCmsConnection = React.useCallback(
    (connection: BuilderCmsConnection) => {
      const nextConnection: BuilderCmsConnection = {
        ...connection,
        enabled: true,
        updatedAt: new Date().toISOString()
      }
      store.getState().setCmsConnection(nextConnection)

      const currentPage = store.getState().page
      const slug = currentPage.slug.trim()
      const slugKey = slug.replace(/^\//, '') || 'home'
      const pageJson = exportPageToJson({ ...currentPage, cmsConnection: nextConnection })

      setPageSaveStatus('saving')
      void fetch(`/api/builder/pages/${encodeURIComponent(slugKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pageJson
      })
        .then((response) => {
          setPageSaveStatus(response.ok ? 'saved' : 'error')
        })
        .catch(() => setPageSaveStatus('error'))
    },
    [store]
  )

  const savePageNow = React.useCallback(() => {
    const currentPage = store.getState().page
    const savingJson = exportPageToJson(currentPage)
    const slug = currentPage.slug.trim()
    const slugKey = slug.replace(/^\//, '') || 'home'
    setPageSaveStatus('saving')
    void fetch(`/api/builder/pages/${encodeURIComponent(slugKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: savingJson
    })
      .then((response) => {
        if (response.ok) {
          lastSavedPageJsonRef.current = savingJson
          setHasUnsavedChanges(false)
          refreshPagesList()
        }
        setPageSaveStatus(response.ok ? 'saved' : 'error')
      })
      .catch(() => setPageSaveStatus('error'))
  }, [refreshPagesList, store])

  const exportJson = () => download('page.json', exportPageToJson(page))
  const exportHtml = async () => {
    const response = await fetch('/api/builder/export-html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page)
    })
    if (!response.ok) return
    download('page.html', await response.text())
  }
  const exportBitrix = async () => {
    const response = await fetch('/api/builder/export-bitrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page)
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      window.alert(payload?.error ?? 'Bitrix export failed')
      return
    }
    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename =
      contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? 'randee-bitrix-export.zip'
    downloadBlob(filename, blob)
  }

  const exportFull = async () => {
    const response = await fetch('/api/builder/export-full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page)
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      window.alert(payload?.error ?? 'Full export failed')
      return
    }
    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename =
      contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? 'randee-full-export.zip'
    downloadBlob(filename, blob)
  }

  const exportBlock = React.useCallback(
    async (blockId: string) => {
      const target = page.blocks.find((item) => item.id === blockId)
      if (!target) return

      const response = await fetch('/api/builder/export-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        window.alert(payload?.error ?? 'Block export failed')
        return
      }
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename =
        contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? `randee-block-${target.template}.zip`
      downloadBlob(filename, blob)
    },
    [page.blocks]
  )

  const reloadUserTemplate = React.useCallback(async (templateId: string) => {
    const response = await fetch(`/api/builder/components/${templateId}`)
    if (!response.ok) return
    const entry = (await response.json()) as {
      manifest: Parameters<typeof registerUserTemplate>[0]
      assets: Parameters<typeof registerUserTemplate>[1]
    }
    registerUserTemplate(entry.manifest, entry.assets)
    setVariantTick((value) => value + 1)
  }, [])

  const bumpTemplateRevision = React.useCallback(
    (templateId: string) => {
      invalidateTemplateStyles(templateId)
      setTemplateRevisions((prev) => ({ ...prev, [templateId]: (prev[templateId] ?? 0) + 1 }))
      void reloadUserTemplate(templateId)
    },
    [reloadUserTemplate]
  )

  const duplicateComponent = React.useCallback(
    async (sourceTemplateId: string) => {
      const response = await fetch(`/api/builder/components/${sourceTemplateId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (!response.ok) return

      const created = (await response.json()) as {
        templateId: string
        manifest: Parameters<typeof registerUserTemplate>[0]
        assets: Parameters<typeof registerUserTemplate>[1]
      }

      registerUserTemplate(created.manifest, created.assets)
      setVariantTick((value) => value + 1)
      const block = createBlockFromTemplate(created.templateId)
      if (!block) return
      block.name = created.manifest.name
      store.getState().insertBlock(block)
      setPendingSaveTemplateId(created.templateId)
      setLeftOpen(true)
      setLeftTab('blocks')
    },
    [store]
  )

  const refreshSavedAssetComponents = React.useCallback(async () => {
    const response = await fetch('/api/builder/assets/components')
    if (!response.ok) return
    const templates = (await response.json()) as Array<{
      templateId: string
      manifest: { name: string; description: string }
    }>
    setSavedAssetComponents(
      templates.map((item) => ({
        templateId: item.templateId,
        name: item.manifest.name,
        description: item.manifest.description
      }))
    )
  }, [])

  const renameSavedComponent = React.useCallback(
    async (templateId: string, name: string) => {
      const response = await fetch(`/api/builder/components/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      if (!response.ok) return

      bumpTemplateRevision(templateId)
      await refreshSavedAssetComponents()
      store.setState((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.template === templateId ? { ...block, name } : block
          )
        }
      }))
    },
    [bumpTemplateRevision, refreshSavedAssetComponents, store]
  )

  const deleteSavedComponent = React.useCallback(
    async (templateId: string) => {
      if (page.blocks.some((block) => block.template === templateId)) {
        window.alert('Нельзя удалить: компонент используется на странице. Сначала уберите его с канваса.')
        return
      }

      const component = savedAssetComponents.find((entry) => entry.templateId === templateId)
      if (!window.confirm(`Удалить компонент «${component?.name ?? templateId}»?`)) return

      const response = await fetch(`/api/builder/components/${templateId}`, { method: 'DELETE' })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        window.alert(payload?.error ?? 'Не удалось удалить компонент')
        return
      }

      if (openAsset?.templateId === templateId) setOpenAsset(null)
      await refreshSavedAssetComponents()
      setVariantTick((value) => value + 1)
    },
    [openAsset?.templateId, page.blocks, refreshSavedAssetComponents, savedAssetComponents]
  )

  const saveComponentToAssets = React.useCallback(
    async (templateId: string, name?: string) => {
      setSavingToAssets(true)
      try {
        const response = await fetch(`/api/builder/components/${templateId}/save-to-assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        })
        if (!response.ok) return

        const saved = (await response.json()) as {
          templateId: string
          manifest: Parameters<typeof registerUserTemplate>[0]
          assets: Parameters<typeof registerUserTemplate>[1]
        }

        registerUserTemplate(saved.manifest, saved.assets)
        setVariantTick((value) => value + 1)
        setPendingSaveTemplateId(null)
        await refreshSavedAssetComponents()
        setLeftOpen(true)
        setLeftTab('assets')
      } finally {
        setSavingToAssets(false)
      }
    },
    [refreshSavedAssetComponents]
  )

  const addSavedComponent = React.useCallback((templateId: string, name: string) => {
    const block = createBlockFromTemplate(templateId)
    if (!block) return
    block.name = name
    store.getState().insertBlock(block)
  }, [store])

  const openAssetTemplateId = openAsset?.templateId ?? null
  const openAssetSavedToAssets = React.useMemo(() => {
    if (!openAssetTemplateId || !isUserComponentTemplateId(openAssetTemplateId)) return true
    return savedAssetComponents.some((item) => item.templateId === openAssetTemplateId)
  }, [openAssetTemplateId, savedAssetComponents])

  React.useEffect(() => {
    zoomLevelRef.current = zoom
  }, [zoom])

  const applyZoom = React.useCallback((nextZoom: number, focal?: { x: number; y: number }) => {
    const scrollEl = canvasScrollRef.current
    const clamped = clampZoom(nextZoom)
    const prev = zoomLevelRef.current

    if (!scrollEl || Math.abs(prev - clamped) < 0.05) {
      setZoom(clamped)
      return
    }

    const rect = scrollEl.getBoundingClientRect()
    const clientX = focal?.x ?? rect.left + rect.width / 2
    const clientY = focal?.y ?? rect.top + rect.height / 2
    const offsetX = clientX - rect.left + scrollEl.scrollLeft
    const offsetY = clientY - rect.top + scrollEl.scrollTop
    const ratio = clamped / prev

    setZoom(clamped)

    requestAnimationFrame(() => {
      scrollEl.scrollLeft = offsetX * ratio - (clientX - rect.left)
      scrollEl.scrollTop = offsetY * ratio - (clientY - rect.top)
    })
  }, [])

  const canvasCenter = React.useCallback(() => {
    const el = canvasScrollRef.current
    if (!el) return undefined
    const rect = el.getBoundingClientRect()
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const zoomIn = React.useCallback(
    (focal?: { x: number; y: number }) => applyZoom(zoomLevelRef.current + 10, focal ?? canvasCenter()),
    [applyZoom, canvasCenter]
  )
  const zoomOut = React.useCallback(
    (focal?: { x: number; y: number }) => applyZoom(zoomLevelRef.current - 10, focal ?? canvasCenter()),
    [applyZoom, canvasCenter]
  )
  const zoomTo100 = React.useCallback(
    (focal?: { x: number; y: number }) => applyZoom(100, focal ?? canvasCenter()),
    [applyZoom, canvasCenter]
  )
  const zoomToFit = React.useCallback(() => {
    const el = canvasScrollRef.current
    if (!el) return
    const padding = 64
    const fit = ((el.clientWidth - padding) / viewportSize.width) * 100
    applyZoom(fit, canvasCenter())
  }, [viewportSize.width, applyZoom, canvasCenter])
  const zoomToSelection = React.useCallback(() => {
    if (!activeId) return
    const blockEl = blockRefs.current[activeId]
    const scrollEl = canvasScrollRef.current
    if (blockEl && scrollEl) {
      const blockRect = blockEl.getBoundingClientRect()
      const scrollRect = scrollEl.getBoundingClientRect()
      const focal = {
        x: blockRect.left + blockRect.width / 2,
        y: blockRect.top + blockRect.height / 2
      }
      const padding = 64
      const fit = ((scrollEl.clientWidth - padding) / viewportSize.width) * 100
      applyZoom(Math.min(100, fit), focal)
      requestAnimationFrame(() => {
        blockEl.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
      })
      return
    }
    if (scrollEl) {
      const padding = 64
      const fit = ((scrollEl.clientWidth - padding) / viewportSize.width) * 100
      applyZoom(Math.min(100, fit), canvasCenter())
    }
  }, [activeId, viewportSize.width, applyZoom, canvasCenter])

  React.useEffect(() => {
    const el = canvasFrameRef.current
    if (!el) return

    const updateHeight = () => {
      setFrameNaturalHeight(el.offsetHeight)
      updateRulerOrigin()
    }
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [page.blocks, viewport, tabletOrientation, mobileOrientation, zoom, updateRulerOrigin])

  React.useEffect(() => {
    let cancelled = false
    let outer = 0
    outer = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) updateRulerOrigin()
      })
    })
    return () => {
      cancelled = true
      window.cancelAnimationFrame(outer)
    }
  }, [firstBlockId, zoom, frameNaturalHeight, viewport, tabletOrientation, mobileOrientation, updateRulerOrigin])

  React.useEffect(() => {
    if (openAsset || guideOpen || cmsOpen) return

    const host = canvasHostRef.current
    const scrollEl = canvasScrollRef.current
    if (!host || !scrollEl) return

    let lastGestureScale = 1

    const onWheel = (event: WheelEvent) => {
      if (isEditableTarget(event.target)) return

      if (isTrackpadPinchZoom(event)) {
        event.preventDefault()
        event.stopPropagation()
        const { deltaY } = normalizeWheelDelta(event)
        if (deltaY === 0) return
        const current = zoomLevelRef.current
        const factor = Math.exp(-deltaY * 0.003)
        applyZoom(current * factor, { x: event.clientX, y: event.clientY })
        return
      }

      const { deltaX, deltaY } = normalizeWheelDelta(event)
      if (deltaX === 0 && deltaY === 0) return

      event.preventDefault()
      scrollEl.scrollLeft += deltaX
      scrollEl.scrollTop += deltaY
    }

    const onGestureStart = (event: Event) => {
      event.preventDefault()
      lastGestureScale = (event as unknown as { scale: number }).scale || 1
    }

    const onGestureChange = (event: Event) => {
      event.preventDefault()
      const gesture = event as unknown as { scale: number; clientX: number; clientY: number }
      const scale = gesture.scale || 1
      const ratio = scale / lastGestureScale
      lastGestureScale = scale
      if (Math.abs(ratio - 1) < 0.001) return
      applyZoom(zoomLevelRef.current * ratio, { x: gesture.clientX, y: gesture.clientY })
    }

    const onGestureEnd = (event: Event) => {
      event.preventDefault()
      lastGestureScale = 1
    }

    let pinchStartDistance = 0
    let pinchStartZoom = zoomLevelRef.current

    const detachTouchPinch = attachCanvasPinchZoom(host, {
      onPinchStart: (distance) => {
        if (distance <= 0) return
        pinchStartDistance = distance
        pinchStartZoom = zoomLevelRef.current
        pinchStartRef.current = { distance, zoom: pinchStartZoom }
      },
      onPinchMove: (distance, focal) => {
        if (distance <= 0 || pinchStartDistance <= 0) return
        const ratio = distance / pinchStartDistance
        applyZoom(pinchStartZoom * ratio, focal)
      },
      onPinchEnd: () => {
        pinchStartDistance = 0
        pinchStartZoom = zoomLevelRef.current
      }
    })

    host.addEventListener('wheel', onWheel, { passive: false, capture: true })
    host.addEventListener('gesturestart', onGestureStart, { passive: false, capture: true })
    host.addEventListener('gesturechange', onGestureChange, { passive: false, capture: true })
    host.addEventListener('gestureend', onGestureEnd, { passive: false, capture: true })

    return () => {
      detachTouchPinch()
      host.removeEventListener('wheel', onWheel, true)
      host.removeEventListener('gesturestart', onGestureStart, true)
      host.removeEventListener('gesturechange', onGestureChange, true)
      host.removeEventListener('gestureend', onGestureEnd, true)
    }
  }, [applyZoom, cmsOpen, guideOpen, openAsset])

  React.useEffect(() => {
    const scrollEl = canvasScrollRef.current
    if (!scrollEl || !isReady) return

    const scale = zoom / 100
    const frameMinHeight = viewportSize.minHeight ?? 0
    const contentHeight = Math.max(frameNaturalHeight, frameMinHeight)
    const w = viewportSize.width * scale + CANVAS_WORKSPACE_PAD * 2
    const h = contentHeight * scale + CANVAS_WORKSPACE_PAD * 2

    requestAnimationFrame(() => {
      // Do not recenter on each zoom change; keep user camera position.
      // Center only on first workspace mount.
      if (!workspaceCenteredRef.current) {
        scrollEl.scrollLeft = Math.max(0, (w - scrollEl.clientWidth) / 2)
        scrollEl.scrollTop = Math.max(0, (h - scrollEl.clientHeight) / 2)
        workspaceCenteredRef.current = true
      }
      setCanvasScroll({ left: scrollEl.scrollLeft, top: scrollEl.scrollTop })
    })
  }, [isReady, frameNaturalHeight, viewportSize.width, viewportSize.minHeight])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Escape — выход из preview / закрыть горячие клавиши
      if (event.key === 'Escape') {
        if (previewMode) { setPreviewMode(false); return }
        if (showHotkeys) { setShowHotkeys(false); return }
      }

      if (isEditableTarget(event.target)) return

      if (!event.metaKey && !event.ctrlKey) {
        if (event.key === '?') {
          event.preventDefault()
          setShowHotkeys((value) => !value)
          return
        }
        if (event.key === 'r' || event.key === 'R') {
          event.preventDefault()
          setShowRuler((value) => !value)
          return
        }
        if (event.key === 'g' || event.key === 'G') {
          event.preventDefault()
          setShowGrid((value) => !value)
          return
        }
        if (event.key === 'v' || event.key === 'V') {
          event.preventDefault()
          setCanvasTool('select')
          return
        }
        if (event.key === 'h' || event.key === 'H') {
          event.preventDefault()
          setCanvasTool('pan')
          return
        }
        // Delete/Backspace — удалить выбранный блок
        if ((event.key === 'Delete' || event.key === 'Backspace') && activeId && page.blocks.length > 1) {
          event.preventDefault()
          store.getState().removeBlock(activeId)
          return
        }
      }

      if (!(event.metaKey || event.ctrlKey)) return

      // Ctrl+S — сохранить страницу
      if (event.key === 's' || event.key === 'S') {
        event.preventDefault()
        savePageNow()
        return
      }
      // Ctrl+D — дублировать выбранный блок
      if ((event.key === 'd' || event.key === 'D') && activeId) {
        event.preventDefault()
        store.getState().duplicateBlock(activeId)
        return
      }
      // Ctrl+Z — отмена, Ctrl+Y / Ctrl+Shift+Z — повтор
      if (event.key === 'z' || event.key === 'Z') {
        event.preventDefault()
        if (event.shiftKey) {
          if (store.getState().canRedo()) store.getState().redo()
        } else {
          if (store.getState().canUndo()) store.getState().undo()
        }
        return
      }
      if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault()
        if (store.getState().canRedo()) store.getState().redo()
        return
      }
      if (event.key === '=' || event.key === '+') {
        event.preventDefault()
        zoomIn()
      } else if (event.key === '-') {
        event.preventDefault()
        zoomOut()
      } else if (event.key === '0') {
        event.preventDefault()
        zoomTo100()
      } else if (event.key === '1') {
        event.preventDefault()
        zoomToFit()
      } else if (event.key === '2') {
        event.preventDefault()
        zoomToSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeId, page.blocks.length, savePageNow, showHotkeys, store, zoomIn, zoomOut, zoomTo100, zoomToFit, zoomToSelection])

  React.useEffect(() => {
    if (!isPanning) return
    const onMove = (event: PointerEvent) => {
      const el = canvasScrollRef.current
      if (!el) return
      el.scrollLeft = panStart.current.scrollLeft - (event.clientX - panStart.current.x)
      el.scrollTop = panStart.current.scrollTop - (event.clientY - panStart.current.y)
    }
    const onUp = () => setIsPanning(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [isPanning])

  React.useEffect(() => {
    if (!resizingPanel) return
    const onMove = (event: PointerEvent) => {
      const delta = event.clientX - resizeStart.current.x
      if (resizingPanel === 'left') {
        setLeftPanelWidth(clampPanelWidth(resizeStart.current.width + delta, PANEL_LEFT_MIN, PANEL_LEFT_MAX))
      } else {
        setRightPanelWidth(clampPanelWidth(resizeStart.current.width - delta, PANEL_RIGHT_MIN, PANEL_RIGHT_MAX))
      }
    }
    const onUp = () => setResizingPanel(null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [resizingPanel])

  React.useEffect(() => {
    if (!isResizingBlock) return
    const snapToGrid = (value: number) => Math.round(value / gridSize) * gridSize
    const onMove = (event: PointerEvent) => {
      const info = resizingBlockRef.current
      if (!info) return
      const scale = zoomLevelRef.current / 100
      const dx = (event.clientX - info.startX) / scale
      const dy = (event.clientY - info.startY) / scale
      const newWidth =
        info.edge !== 'bottom'
          ? Math.max(320, snapToGrid(info.startWidth + dx))
          : info.startWidth
      const newHeight =
        info.edge !== 'right'
          ? Math.max(160, snapToGrid(info.startHeight + dy))
          : info.startHeight
      store.getState().updateBlockDesign(info.blockId, {
        size: { width: newWidth, height: newHeight }
      })
    }
    const onUp = () => {
      resizingBlockRef.current = null
      setIsResizingBlock(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [isResizingBlock, gridSize, store])

  function startPanelResize(side: 'left' | 'right', event: React.PointerEvent) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setResizingPanel(side)
    resizeStart.current = {
      x: event.clientX,
      width: side === 'left' ? leftPanelWidth : rightPanelWidth
    }
  }

  function onCanvasScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget
    setCanvasScroll({ left: target.scrollLeft, top: target.scrollTop })
  }

  function addVariant(variant: LibraryVariant) {
    const block = createBlockFromTemplate(variant.template)
    if (!block) return
    store.getState().insertBlock(block)
    setInsertOpen(false)
  }

  function addElement(variant: ElementVariant) {
    const targetBlock =
      block?.type === 'component'
        ? block
        : page.blocks.find((item) => item.type === 'component')
    if (!targetBlock) {
      window.alert('Сначала добавьте component на страницу: New → Component или Insert → Blocks.')
      return
    }
    const selected = (targetBlock.elements ?? []).find((item) => item.id === selectedElementId)
    const selectedBaseId = selected?.props?.__baseElementId
    const selectedIsNestable =
      selected?.elementId === 'container' ||
      selected?.elementId === 'columns' ||
      selectedBaseId === 'container' ||
      selectedBaseId === 'columns'

    const defaultPlacement =
      selected
        ? selectedIsNestable
          ? { parentId: selected.id as string }
          : { parentId: selected.parentId ?? null, afterElementId: selected.id }
        : undefined

    store.getState().selectBlock(targetBlock.id)
    store
      .getState()
      .insertElement(targetBlock.id, variant.id, variant.defaultProps, variant.name, defaultPlacement)
    setInsertOpen(false)
    setComponentEditFocus('component')
  }

  function createNewPageFromSidebar() {
    const nameInput = window.prompt('Page name', 'Новая страница')
    if (nameInput === null) return
    const pageName = nameInput.trim() || 'Новая страница'

    const suggestedSlug = `/${pageName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9а-яё-]/gi, '')
      .replace(/-+/g, '-')}`
    const slugInput = window.prompt('Page slug', suggestedSlug)
    if (slugInput === null) return

    const slugRaw = slugInput.trim()
    const slugWithPrefix = slugRaw.startsWith('/') ? slugRaw : `/${slugRaw}`
    const slug = slugWithPrefix === '/' ? '/new-page' : slugWithPrefix

    const starterBlock =
      createBlockFromTemplate('hero-01') ??
      createBlockFromTemplate('features-01') ??
      null

    const nextPage: BuilderPage = {
      page: pageName,
      slug,
      seo: {
        title: pageName,
        description: 'Описание страницы'
      },
      blocks: starterBlock ? [{ ...starterBlock }] : [],
      cmsConnection: page.cmsConnection,
      vendors: page.vendors
    }

    store.getState().loadPage(nextPage)
    setPageSaveStatus('idle')
    setHasUnsavedChanges(true)
    refreshPagesList()
  }

  function openPageFromSidebar(slug: string) {
    if (hasUnsavedChanges && !window.confirm('Есть несохраненные изменения. Открыть другую страницу?')) {
      return
    }
    const slugKey = slug.replace(/^\//, '') || 'home'
    void fetch(`/api/builder/pages/${encodeURIComponent(slugKey)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded) => {
        if (!loaded) return
        store.getState().loadPage(loaded as BuilderPage)
        setPageSaveStatus('idle')
        setHasUnsavedChanges(false)
      })
      .catch(() => undefined)
  }

  function duplicatePageFromSidebar(slug: string) {
    const source = pagesList.find((item) => item.slug === slug)
    const baseName = source?.page ?? 'Новая страница'
    const copyName = `${baseName} Copy`
    const copySlug = `${slug === '/' ? '/home' : slug}-copy`.replace(/--+/g, '-')

    const sourceSlugKey = slug.replace(/^\//, '') || 'home'
    const copySlugKey = copySlug.replace(/^\//, '') || 'home-copy'

    void fetch(`/api/builder/pages/${encodeURIComponent(sourceSlugKey)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded) => {
        if (!loaded) return
        const loadedPage = loaded as BuilderPage
        const duplicated: BuilderPage = {
          ...loadedPage,
          page: copyName,
          slug: copySlug
        }
        return fetch(`/api/builder/pages/${encodeURIComponent(copySlugKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: exportPageToJson(duplicated)
        })
      })
      .then((response) => {
        if (!response || !response.ok) return
        refreshPagesList()
      })
      .catch(() => undefined)
  }

  function renamePageFromSidebar(slug: string) {
    const source = pagesList.find((item) => item.slug === slug)
    if (!source) return

    const newNameInput = window.prompt('New page name', source.page)
    if (newNameInput === null) return
    const newPageName = newNameInput.trim() || source.page

    const currentSlugValue = source.slug === '/' ? '/home' : source.slug
    const newSlugInput = window.prompt('New page slug', currentSlugValue)
    if (newSlugInput === null) return
    const normalizedNewSlug = (newSlugInput.trim().startsWith('/') ? newSlugInput.trim() : `/${newSlugInput.trim()}`) || '/home'
    const newSlug = normalizedNewSlug === '/' ? '/home' : normalizedNewSlug

    const oldSlugKey = source.slug.replace(/^\//, '') || 'home'
    const newSlugKey = newSlug.replace(/^\//, '') || 'home'

    void fetch(`/api/builder/pages/${encodeURIComponent(oldSlugKey)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded) => {
        if (!loaded) return null
        const nextPage: BuilderPage = {
          ...(loaded as BuilderPage),
          page: newPageName,
          slug: newSlug
        }
        return fetch(`/api/builder/pages/${encodeURIComponent(newSlugKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: exportPageToJson(nextPage)
        }).then((saveResponse) => ({ saveResponse, wasSameSlug: oldSlugKey === newSlugKey, nextPage }))
      })
      .then((payload) => {
        if (!payload?.saveResponse.ok) return
        if (!payload.wasSameSlug) {
          return fetch(`/api/builder/pages/${encodeURIComponent(oldSlugKey)}`, { method: 'DELETE' }).then(() => payload.nextPage)
        }
        return payload.nextPage
      })
      .then((nextPage) => {
        if (!nextPage) return
        if (page.slug === slug) {
          store.getState().loadPage(nextPage)
          setHasUnsavedChanges(false)
          setPageSaveStatus('idle')
        }
        refreshPagesList()
      })
      .catch(() => undefined)
  }

  function deletePageFromSidebar(slug: string) {
    if (slug === '/') {
      window.alert('Главную страницу (/) удалять нельзя.')
      return
    }
    if (!window.confirm(`Удалить страницу ${slug}?`)) return

    const slugKey = slug.replace(/^\//, '') || 'home'
    void fetch(`/api/builder/pages/${encodeURIComponent(slugKey)}`, { method: 'DELETE' })
      .then((response) => {
        if (!response.ok) return
        if (page.slug === slug) {
          openPageFromSidebar('/')
        }
        refreshPagesList()
      })
      .catch(() => undefined)
  }

  const componentTargetBlock =
    block?.type === 'component' ? block : page.blocks.find((item) => item.type === 'component')
  const insertShowsElements = componentEditMode && Boolean(componentTargetBlock)
  const elementVariantById = React.useMemo(() => {
    const map = new Map<string, ElementVariant>()
    for (const item of allElementVariants) map.set(item.id, item)
    return map
  }, [allElementVariants])

  React.useEffect(() => {
    if (!componentEditMode || !block || block.type !== 'component') return
    const current = block.design
    const isLegacyTallFixed =
      current?.size?.heightMode === 'fixed' &&
      current?.size?.height === 1000 &&
      (current?.layout?.padding ?? 0) === 0
    if (current && !isLegacyTallFixed) return
    store.getState().updateBlockDesign(block.id, {
      size: { height: 0, heightMode: 'hug' },
      layout: { padding: 0, paddingIndividual: false }
    })
  }, [block, componentEditMode, store])

  const elementPreviewOptions = React.useMemo(
    () =>
      componentEditMode
        ? {
            selectedElementId,
            onSelectElement: (elementId: string) => {
              store.getState().selectElement(elementId)
              setComponentEditFocus('component')
            },
            onDeleteElement: (elementId: string) => {
              if (!block || block.type !== 'component') return
              store.getState().removeElement(block.id, elementId)
            },
            onDuplicateElement: (elementId: string) => {
              if (!block || block.type !== 'component') return
              store.getState().duplicateElement(block.id, elementId)
            },
            onRenameElement: (elementId: string, name: string) => {
              if (!block || block.type !== 'component') return
              store.getState().renameElement(block.id, elementId, name)
            },
            onMoveElement: (elementId: string, direction: 'up' | 'down') => {
              if (!block || block.type !== 'component') return
              store.getState().moveElementDirection(block.id, elementId, direction)
            },
            onDropElement: (
              catalogElementId: string,
              placement?: {
                parentId?: string | null
                afterElementId?: string | null
                beforeElementId?: string | null
                columnIndex?: number | null
              }
            ) => {
              if (!block || block.type !== 'component') return
              const presetMatch = /^columns:(\d+)$/.exec(catalogElementId)
              if (presetMatch) {
                const variant = getElementVariant('columns')
                if (!variant) return
                const nextCount = String(Math.max(1, Math.min(16, Number(presetMatch[1]) || 2)))
                store
                  .getState()
                  .insertElement(
                    block.id,
                    variant.id,
                    { ...variant.defaultProps, columns: nextCount },
                    variant.name,
                    placement
                  )
                return
              }
              const existingElement = (block.elements ?? []).find((item) => item.id === catalogElementId)
              if (existingElement) {
                store.getState().moveElementWithPlacement(block.id, existingElement.id, placement)
                return
              }
              const variant = elementVariantById.get(catalogElementId) ?? getElementVariant(catalogElementId)
              if (!variant) return

              store
                .getState()
                .insertElement(block.id, variant.id, variant.defaultProps, variant.name, placement)
            },
            viewport
          }
        : undefined,
    [block, componentEditMode, selectedElementId, store, elementVariantById, viewport]
  )

  const cmsPreviewValues = useCmsPreviewData(
    block?.type === 'component' ? block : undefined,
    page.cmsConnection ?? cmsConnection
  )

  // Опции для ВИЗУАЛЬНОГО превью в артборде:
  // forceVisual=true → BlockPreview показывает реальный компонент (не tree-view)
  // onDropElement → drag из левой панели + inline «+» кнопка работают
  const artboardElementOptions = React.useMemo(
    () =>
      elementPreviewOptions
        ? {
            ...elementPreviewOptions,
            onPatchElementProps: (elementId: string, props: Record<string, string>) => {
              if (!block || block.type !== 'component') return
              store.getState().updateElementProps(block.id, elementId, props)
            },
            cmsPreviewValues,
            forceVisual: true as const
          }
        : undefined,
    [block, elementPreviewOptions, store, cmsPreviewValues]
  )

  const saveSelectedElementAsCustom = React.useCallback(async () => {
    if (!block || block.type !== 'component' || !selectedElementId) return
    const source = block.elements?.find((item) => item.id === selectedElementId)
    if (!source) return
    const suggested = source.name ?? `Custom ${source.elementId}`
    const name = window.prompt('Name for custom element', suggested)?.trim()
    if (!name) return
    const response = await fetch('/api/builder/assets/elements', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source, name })
    })
    if (!response.ok) return
    const payload = (await response.json()) as { ok?: boolean; variant?: ElementVariant }
    if (!payload.ok || !payload.variant) return
    setCustomElementVariantsState((prev) => {
      const next = [payload.variant!, ...prev.filter((item) => item.id !== payload.variant!.id)]
      setCustomElementVariants(next)
      return next
    })
  }, [block, selectedElementId])

  function toggleComponentEditMode() {
    setComponentEditMode((value) => {
      const next = !value
      if (next) {
        setRightOpen(true)
        setLeftOpen(true)
        setLeftTab('assets')
        setComponentEditFocus('component')
        setShownViewports([viewport]) // Редактор всегда в single-viewport
        setInsertOpen(false)
        setNewOpen(false)
        setOpenAsset(null)
        const current = store.getState().selectedBlockId
        const selected = current ? page.blocks.find((item) => item.id === current) : undefined
        if (!selected) {
          const firstComponent = page.blocks.find((item) => item.type === 'component') ?? page.blocks[0]
          if (firstComponent) store.getState().selectBlock(firstComponent.id)
        }
      } else {
        setLeftTab('blocks')
      }
      return next
    })
  }

  const openCodeAssetFromInspector = React.useCallback(
    (path: string, label: string) => {
      if (!block) return
      const assets = getBlockLayerAssets(block.template)
      if (!assets) return
      const candidates = [assets.preview, assets.style, assets.script, assets.init, ...assets.images]
      const asset =
        candidates.find((item) => item.path === path || item.label === label) ??
        candidates.find((item) => item.path.endsWith(`/${path}`))
      if (!asset) return

      if (!isEditableAsset(asset)) {
        window.open(asset.url, '_blank', 'noopener,noreferrer')
        return
      }

      setGuideOpen(false)
      setCmsOpen(false)
      setOpenAsset({
        templateId: block.template,
        blockId: block.id,
        blockName: block.name,
        path: asset.path,
        label: asset.label,
        kind: asset.kind,
        url: asset.url
      })
    },
    [block]
  )

  const openInIdeFromInspector = React.useCallback(
    (relativePath: string, ide: 'vscode' | 'cursor' = 'vscode') => {
      if (!block || block.type !== 'component') return
      void openTemplateAssetInIde(block.template, relativePath, { ide }).catch((error) => {
        console.error(error)
      })
    },
    [block]
  )

  // R4.3: poll file mtimes → hot reload preview when IDE saves files
  React.useEffect(() => {
    if (!componentEditMode || !block || block.type !== 'component') return
    const templateId = block.template
    let lastRevision = ''
    let active = true

    const tick = async () => {
      try {
        const response = await fetch(`/api/builder/components/${encodeURIComponent(templateId)}/file-revision`)
        if (!response.ok || !active) return
        const payload = (await response.json()) as { revision?: string }
        const revision = payload.revision ?? ''
        if (lastRevision && revision && revision !== lastRevision) {
          bumpTemplateRevision(templateId)
        }
        lastRevision = revision
      } catch {
        // ignore polling errors
      }
    }

    void tick()
    const intervalId = window.setInterval(tick, 1500)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [block?.template, componentEditMode, bumpTemplateRevision])

  const syncCodeLayoutFromInspector = React.useCallback(async () => {
    if (!block || block.type !== 'component') return
    const response = await fetch(`/api/builder/components/${encodeURIComponent(block.template)}/sync-layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        elements: block.elements ?? []
      })
    })
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? 'Code sync failed')
    }
    bumpTemplateRevision(block.template)
  }, [block, bumpTemplateRevision])

  // Автосинк: при изменении элементов компонента → обновляем layout.generated.tsx через 600мс
  React.useEffect(() => {
    if (!componentEditMode || !block || block.type !== 'component') return
    if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current)

    autoSyncTimerRef.current = setTimeout(async () => {
      try {
        setAutoSyncStatus('syncing')
        const response = await fetch(
          `/api/builder/components/${encodeURIComponent(block.template)}/sync-layout`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ elements: block.elements ?? [] })
          }
        )
        if (response.status === 403) {
          setAutoSyncStatus('readonly')
          return
        }
        if (!response.ok) throw new Error('sync failed')
        bumpTemplateRevision(block.template)
        setAutoSyncStatus('ok')
        setTimeout(() => setAutoSyncStatus('idle'), 2000)
      } catch {
        setAutoSyncStatus('error')
        setTimeout(() => setAutoSyncStatus('idle'), 3000)
      }
    }, 600)

    return () => {
      if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block?.elements, componentEditMode])

  function componentArtboardOutline(): React.CSSProperties | undefined {
    if (!componentEditMode || componentEditFocus !== 'artboard' || !componentDesign) return undefined
    return { boxShadow: `inset 0 0 0 2px ${t.accent}` }
  }

  async function createNewComponent() {
    if (creatingComponent) return
    setCreatingComponent(true)
    try {
      const response = await fetch('/api/builder/new-component', { method: 'POST' })
      if (!response.ok) return

      const created = (await response.json()) as {
        templateId: string
        manifest: Parameters<typeof registerUserTemplate>[0]
        assets: Parameters<typeof registerUserTemplate>[1]
      }

      registerUserTemplate(created.manifest, created.assets)
      setVariantTick((value) => value + 1)

      const block = createBlockFromTemplate(created.templateId)
      if (!block) return

      block.name = created.manifest.name
      store.getState().insertBlock(block)
      store.getState().selectBlock(block.id)
      setPendingSaveTemplateId(created.templateId)
      setNewOpen(false)
      setLeftOpen(true)
      setLeftTab('blocks')
    } finally {
      setCreatingComponent(false)
    }
  }

  function onCanvasPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (canvasTool !== 'pan') return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const el = canvasScrollRef.current
    if (!el) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsPanning(true)
    panStart.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop
    }
  }

  function onCanvasPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsPanning(false)
  }

  const inputStyle: React.CSSProperties = {
    height: 32,
    width: '100%',
    borderRadius: 6,
    border: '1px solid transparent',
    background: t.inputBg,
    padding: '0 10px',
    fontSize: 12,
    color: t.text,
    outline: 'none'
  }

  const frameWidth = viewportSize.width
  const frameMinHeight = viewportSize.minHeight ?? 0
  const frameContentHeight = Math.max(frameNaturalHeight, frameMinHeight)
  const frameScale = zoom / 100
  const scaledFrameWidth = frameWidth * frameScale
  const scaledFrameHeight = frameContentHeight * frameScale
  const workspaceWidth = scaledFrameWidth + CANVAS_WORKSPACE_PAD * 2
  const workspaceHeight = scaledFrameHeight + CANVAS_WORKSPACE_PAD * 2

  // Multi-viewport: общая ширина workspace для всех видимых фреймов
  const isMultiViewport = !componentEditMode && shownViewports.length > 1
  const multiWorkspaceWidth = isMultiViewport
    ? CANVAS_WORKSPACE_PAD * 2
      + shownViewports.reduce((sum, vp) => {
          const vpSize = resolveViewportSize(vp, tabletOrientation, mobileOrientation)
          return sum + vpSize.width * frameScale
        }, 0)
      + (shownViewports.length - 1) * MULTI_FRAME_GAP
    : workspaceWidth

  const toolbarBtnStyle = (active?: boolean): React.CSSProperties => ({
    display: 'flex',
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    color: active ? '#ffffff' : t.textMuted,
    background: active ? t.accent : 'transparent',
    boxShadow: active ? `0 0 0 1px ${t.accent}55` : 'none'
  })

  return (
    <main
      className="randee-builder-editor flex h-screen w-screen flex-col overflow-hidden"
      data-randee-page="builder"
      data-builder-ready={isReady ? 'true' : 'false'}
      style={{ background: t.bg, color: t.text }}
    >
      {/* ── Sprint B: Framer-style topbar ───────────────────────────────── */}
      <header
        className="relative z-20 flex h-10 shrink-0 items-center px-2"
        style={{ borderBottom: `1px solid ${t.chromeBorder}`, background: t.bg }}
      >
        {/* ── Left: panel toggle + logo + component breadcrumb ── */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            style={toolbarBtnStyle(false)}
            onClick={() => setLeftOpen((v) => !v)}
            title={leftOpen ? 'Скрыть панель' : 'Показать панель'}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>

          <span
            className="select-none px-1 text-[12px] font-semibold tracking-tight"
            style={{ color: t.text, letterSpacing: '-0.02em' }}
          >
            Randee
          </span>

          {componentEditMode && block ? (
            <>
              <span className="text-[11px]" style={{ color: t.textMuted }}>/</span>
              <button
                type="button"
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
                style={{ color: t.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                onClick={toggleComponentEditMode}
                title="Выйти из редактирования компонента"
              >
                <ChevronLeft className="h-3 w-3" />
                Страница
              </button>
              <span className="text-[11px]" style={{ color: t.textMuted }}>/</span>
              <span className="max-w-[160px] truncate text-[11px] font-medium" style={{ color: t.text }}>
                {(block.props as Record<string, string> | undefined)?.name ?? block.id}
              </span>
              {autoSyncStatus !== 'idle' ? (
                <span
                  className="ml-1 rounded px-1 py-0.5 text-[10px] font-medium"
                  title={
                    autoSyncStatus === 'readonly'
                      ? 'Встроенный шаблон: автосохранение в layout.generated.tsx недоступно. Сохраните компонент в Assets или правьте preview.tsx в IDE.'
                      : undefined
                  }
                  style={{
                    color:
                      autoSyncStatus === 'ok'
                        ? '#22c55e'
                        : autoSyncStatus === 'error'
                          ? '#ef4444'
                          : autoSyncStatus === 'readonly'
                            ? '#f59e0b'
                            : t.textMuted,
                    background:
                      autoSyncStatus === 'ok'
                        ? 'rgba(34,197,94,.10)'
                        : autoSyncStatus === 'error'
                          ? 'rgba(239,68,68,.10)'
                          : autoSyncStatus === 'readonly'
                            ? 'rgba(245,158,11,.12)'
                            : 'transparent'
                  }}
                >
                  {autoSyncStatus === 'syncing'
                    ? '⟳'
                    : autoSyncStatus === 'ok'
                      ? '✓'
                      : autoSyncStatus === 'readonly'
                        ? 'только IDE'
                        : '✗'}
                </span>
              ) : null}
            </>
          ) : null}
        </div>

        {/* ── Center: page name + save dot (absolute centered) ── */}
        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="max-w-[220px] truncate text-[12px] font-medium" style={{ color: t.text }}>
              {page.page}
            </span>
            {pageSaveStatus === 'saving' ? (
              <span
                className="h-[6px] w-[6px] animate-pulse rounded-full"
                style={{ background: t.textMuted }}
                title="Сохраняем..."
              />
            ) : pageSaveStatus === 'saved' ? (
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: '#22c55e' }}
                title="Сохранено"
              />
            ) : pageSaveStatus === 'error' ? (
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: '#ef4444' }}
                title="Ошибка сохранения"
              />
            ) : hasUnsavedChanges ? (
              <span
                className="h-[6px] w-[6px] rounded-full"
                style={{ background: '#f59e0b' }}
                title="Есть несохранённые изменения"
              />
            ) : null}
          </div>
        </div>

        {/* ── Right: viewport + theme + save + overflow + export ── */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Compact viewport switcher — multi-select */}
          <BuilderViewportToolbar
            variant="topbar"
            viewport={viewport}
            tabletOrientation={tabletOrientation}
            mobileOrientation={mobileOrientation}
            onViewportChange={(mode) => {
              store.getState().setViewport(mode)
              setShownViewports([mode])
            }}
            onRotate={rotateViewport}
            t={t}
            shownViewports={shownViewports}
            onToggleViewport={(mode) => {
              const isShown = shownViewports.includes(mode)
              const isPrimary = mode === viewport
              if (isShown) {
                // Убрать, но не последний
                if (shownViewports.length === 1) {
                  // Единственный — только ротация для tablet/mobile
                  if (mode === 'tablet' || mode === 'mobile') rotateViewport(mode)
                  return
                }
                const next = shownViewports.filter((v) => v !== mode)
                // Если убирали primary — переключить inspector на первый оставшийся
                if (isPrimary) store.getState().setViewport(next[0])
                setShownViewports(next)
              } else {
                // Добавить + сделать primary
                store.getState().setViewport(mode)
                setShownViewports((prev) => [...prev, mode])
              }
            }}
          />

          <span className="mx-1 h-4 w-px" style={{ background: t.divider }} />

          <BuilderThemeToggle theme={theme} onThemeChange={setTheme} t={t} />

          {/* Save icon button */}
          <button
            type="button"
            style={{
              ...toolbarBtnStyle(false),
              color:
                pageSaveStatus === 'error'
                  ? '#ef4444'
                  : pageSaveStatus === 'saved'
                    ? '#22c55e'
                    : t.textSecondary,
              cursor: pageSaveStatus === 'saving' ? 'wait' : 'pointer'
            }}
            onClick={savePageNow}
            disabled={pageSaveStatus === 'saving'}
            title="Сохранить (⌘S)"
          >
            <Save className="h-4 w-4" />
          </button>

          {/* "..." overflow menu */}
          <div ref={overflowMenuRef} className="relative">
            <button
              type="button"
              style={toolbarBtnStyle(overflowMenuOpen)}
              onClick={() => setOverflowMenuOpen((v) => !v)}
              title="Ещё"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {overflowMenuOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg py-1 shadow-2xl"
                style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
              >
                {/* Insert */}
                <div ref={insertRef} className="relative">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                    style={{ background: insertOpen ? t.hover : 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = insertOpen ? t.hover : 'transparent' }}
                    onClick={() => {
                      setInsertOpen((v) => !v)
                      setNewOpen(false)
                      setOverflowMenuOpen(false)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                    Insert
                  </button>
                </div>

                {/* New Component */}
                <div ref={newRef} className="relative">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                    style={{ background: newOpen ? t.hover : 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = newOpen ? t.hover : 'transparent' }}
                    onClick={() => {
                      setNewOpen((v) => !v)
                      setInsertOpen(false)
                      setOverflowMenuOpen(false)
                    }}
                  >
                    <SquarePlus className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                    New Component
                  </button>
                </div>

                {/* Редактор */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{
                    background: componentEditMode ? t.hover : 'transparent',
                    color: componentEditMode ? t.text : t.textSecondary,
                    border: 'none', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = componentEditMode ? t.hover : 'transparent' }}
                  onClick={() => {
                    toggleComponentEditMode()
                    setOverflowMenuOpen(false)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  Редактировать компонент
                </button>

                {/* CMS */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{
                    background: cmsOpen ? t.hover : 'transparent',
                    color: cmsOpen ? t.text : t.textSecondary,
                    border: 'none', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = cmsOpen ? t.hover : 'transparent' }}
                  onClick={() => {
                    setCmsOpen((v) => {
                      const next = !v
                      if (next) { setInsertOpen(false); setNewOpen(false); setGuideOpen(false); setOpenAsset(null) }
                      return next
                    })
                    setOverflowMenuOpen(false)
                  }}
                >
                  <Boxes className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  CMS
                </button>

                {/* Инструкция */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{
                    background: guideOpen ? t.hover : 'transparent',
                    color: guideOpen ? t.text : t.textSecondary,
                    border: 'none', cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = guideOpen ? t.hover : 'transparent' }}
                  onClick={() => {
                    setGuideOpen((v) => {
                      const next = !v
                      if (next) { setInsertOpen(false); setNewOpen(false); setOpenAsset(null) }
                      return next
                    })
                    setOverflowMenuOpen(false)
                  }}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  Инструкция
                </button>

                <div style={{ height: 1, background: t.menuBorder, margin: '4px 0' }} />

                {/* JSON export */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{ background: 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { exportJson(); setOverflowMenuOpen(false) }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  Скачать JSON
                </button>

                {/* HTML export */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{ background: 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { exportHtml(); setOverflowMenuOpen(false) }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  Скачать HTML
                </button>
              </div>
            ) : null}
          </div>

          {/* Preview ▶ */}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{
              background: 'transparent',
              border: `1px solid ${t.chromeBorder}`,
              color: t.textSecondary,
              cursor: 'pointer',
            }}
            title="Предпросмотр (▶)"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#22C55E22'
              e.currentTarget.style.color = '#22C55E'
              e.currentTarget.style.borderColor = '#22C55E44'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = t.textSecondary
              e.currentTarget.style.borderColor = t.chromeBorder
            }}
            onClick={() => setPreviewMode(true)}
          >
            <Play className="h-3.5 w-3.5" style={{ marginLeft: 1 }} />
          </button>

          {/* Export split-button: основная кнопка = Bitrix, стрелка = dropdown */}
          <div ref={exportMenuRef} className="relative flex">
            <button
              type="button"
              className="flex h-7 items-center gap-1.5 rounded-l-md px-3 text-[11px] font-semibold text-white"
              style={{ background: t.accent, border: 'none', borderRight: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer' }}
              onClick={exportBitrix}
              title="Экспорт Bitrix ZIP"
            >
              <Boxes className="h-3.5 w-3.5" />
              Экспорт
            </button>
            <button
              type="button"
              className="flex h-7 w-6 items-center justify-center rounded-r-md text-white"
              style={{ background: t.accent, border: 'none', cursor: 'pointer' }}
              onClick={() => setExportMenuOpen((v) => !v)}
              title="Варианты экспорта"
            >
              <ChevronDown className="h-3 w-3" />
            </button>

            {exportMenuOpen ? (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl shadow-2xl"
                style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
              >
                <p className="px-3 pt-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  Экспорт
                </p>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{ background: 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { void exportBitrix(); setExportMenuOpen(false) }}
                >
                  <Boxes className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
                  <div className="text-left">
                    <span className="block font-medium">Bitrix компоненты</span>
                    <span className="block text-[10px]" style={{ color: t.textMuted }}>local/components/randee/…</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{ background: 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { void exportFull(); setExportMenuOpen(false) }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" style={{ color: '#10b981' }} />
                  <div className="text-left">
                    <span className="block font-medium" style={{ color: '#10b981' }}>HTML + Bitrix (всё)</span>
                    <span className="block text-[10px]" style={{ color: t.textMuted }}>page.html + bitrix/ в одном ZIP</span>
                  </div>
                </button>

                <div style={{ height: 1, background: t.menuBorder, margin: '4px 0' }} />

                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px]"
                  style={{ background: 'transparent', color: t.textSecondary, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  onClick={() => { void exportHtml(); setExportMenuOpen(false) }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" style={{ color: t.textMuted }} />
                  <div className="text-left">
                    <span className="block">Только HTML</span>
                    <span className="block text-[10px]" style={{ color: t.textMuted }}>page.html без Bitrix</span>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Insert panel dropdown (opens below topbar, anchored left) */}
        {insertOpen ? (
          <div
            className="absolute left-2 top-full z-50 mt-1 w-[920px] overflow-hidden rounded-xl shadow-2xl"
            style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${t.divider}` }}>
              {[
                { id: 'insert' as const, label: 'Добавить', icon: Plus },
                { id: 'layout' as const, label: 'Макет', icon: LayoutTemplate },
                { id: 'text' as const, label: 'Текст', icon: Type },
                { id: 'vector' as const, label: 'Вектор', icon: PenTool },
                { id: 'cms' as const, label: 'CMS', icon: Database }
              ].map((tab) => {
                const Icon = tab.icon
                const active = insertPanelTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold"
                    style={{
                      border: `1px solid ${active ? `${t.accent}44` : 'transparent'}`,
                      background: active ? t.inputBg : 'transparent',
                      color: active ? t.text : t.textSecondary
                    }}
                    onClick={() => setInsertPanelTab(tab.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="grid h-[640px] grid-cols-[330px_1fr]">
              <div className="border-r p-4" style={{ borderColor: t.divider }}>
                <div
                  className="mb-3 flex items-center gap-2 rounded-xl px-3"
                  style={{ background: t.inputBg }}
                >
                  <Search className="h-4 w-4" style={{ color: t.textMuted }} />
                  <input
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    style={{ color: t.text, border: 'none' }}
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    placeholder="Поиск..."
                  />
                </div>
                <div className="max-h-[560px] overflow-y-auto pr-1">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                    {insertShowsElements ? 'Элементы' : 'Блоки'}
                  </p>
                  {(insertShowsElements
                    ? [
                        { id: 'sections', label: 'Секции' },
                        ...insertElementGroups.map((group) => ({ id: `group:${group.name}`, label: group.name }))
                      ]
                    : [
                        { id: 'sections', label: 'Секции' },
                        ...insertBlockGroups.map((group) => ({ id: `group:${group.name}`, label: group.name }))
                      ]).map((category) => {
                    const active = insertCategory === category.id
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className="mb-2 flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-base font-semibold"
                        style={{
                          background: active ? t.inputBg : 'transparent',
                          border: `1px solid ${active ? `${t.accent}33` : t.divider}`,
                          color: active ? t.text : t.textSecondary
                        }}
                        onClick={() => setInsertCategory(category.id)}
                      >
                        <span>{category.label}</span>
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: t.textSecondary }}>
                    {insertShowsElements ? 'Элементы интерфейса' : 'Блоки страницы'}
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
                    style={{ background: t.inputBg, color: t.textMuted, border: `1px solid ${t.divider}` }}
                    onClick={() => setTheme((v) => (v === 'dark' ? 'light' : 'dark'))}
                  >
                    Theme <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid gap-3">
                  {insertShowsElements
                    ? (insertCategory === 'sections'
                        ? allElementVariants
                        : allElementVariants.filter((item) => `group:${item.group}` === insertCategory)
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="rounded-xl p-3 text-left"
                          style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
                          onClick={() => addElement(item)}
                        >
                          <p className="text-sm font-semibold" style={{ color: t.text }}>{item.name}</p>
                          <p className="text-xs" style={{ color: t.textMuted }}>{item.description}</p>
                        </button>
                      ))
                    : (insertCategory === 'sections'
                        ? filteredVariants
                        : filteredVariants.filter((item) => `group:${item.group}` === insertCategory)
                      ).map((item) => (
                        <button
                          key={item.template}
                          type="button"
                          className="rounded-xl p-3 text-left"
                          style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
                          onClick={() => addVariant(item)}
                        >
                          <p className="text-sm font-semibold" style={{ color: t.text }}>{item.name}</p>
                          <p className="text-xs" style={{ color: t.textMuted }}>{item.description}</p>
                        </button>
                      ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* New Component dropdown */}
        {newOpen ? (
          <div
            className="absolute left-2 top-full z-50 mt-1 w-52 rounded-lg p-1 shadow-xl"
            style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
              Создать
            </p>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: creatingComponent ? 'wait' : 'pointer',
                opacity: creatingComponent ? 0.7 : 1
              }}
              disabled={creatingComponent}
              onMouseEnter={(event) => { event.currentTarget.style.background = t.hover }}
              onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}
              onClick={() => void createNewComponent()}
            >
              <Component className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium" style={{ color: t.text }}>
                  Component
                </span>
                <span className="block text-[10px]" style={{ color: t.textMuted }}>
                  Пустой компонент со стилями, скриптом и preview
                </span>
              </span>
            </button>
          </div>
        ) : null}
      </header>

      <BlockVendorProvider page={page}>
      <TemplateRevisionProvider revisions={templateRevisions}>
      <div className="flex min-h-0 flex-1">
        {/* ── Left panel: slide transition ── */}
        <aside
          className="relative shrink-0 overflow-hidden"
          style={{
            width: leftOpen ? leftPanelWidth : 0,
            minWidth: 0,
            borderRight: leftOpen ? `1px solid ${t.chromeBorder}` : 'none',
            background: t.panel,
            transition: resizingPanel === 'left' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Inner container keeps fixed width so content doesn't squash during animation */}
          <div
            className="flex h-full flex-col"
            style={{ width: leftPanelWidth, minWidth: leftPanelWidth }}
          >
            <PanelResizeHandle
              side="left"
              accent={t.accent}
              hoverBg={t.hover}
              onResizeStart={(event) => startPanelResize('left', event)}
            />
            <BuilderLeftPanel
              t={t}
              leftTab={leftTab}
              onLeftTabChange={setLeftTab}
              librarySearch={librarySearch}
              onLibrarySearchChange={setLibrarySearch}
              page={page}
              store={store}
              activeId={activeId}
              filteredVariants={filteredVariants}
              groupedVariants={groupedVariants}
              onAddVariant={addVariant}
              onClose={() => setLeftOpen(false)}
              vendorLibraries={vendorLibraries}
              pageVendors={page.vendors ?? []}
              requiredVendors={page.blocks.flatMap((block) => collectTemplateVendors(block.template))}
              onToggleVendor={(vendorId) => store.getState().togglePageVendor(vendorId)}
              onOpenAsset={(asset) => {
                setGuideOpen(false)
                setCmsOpen(false)
                setOpenAsset(asset)
                if (asset.blockId) store.getState().selectBlock(asset.blockId)
              }}
              activeAssetPath={openAsset ? `${openAsset.templateId}:${openAsset.path}` : null}
              savedAssetComponents={savedAssetComponents}
              canvasTemplateIds={page.blocks.map((block) => block.template)}
              onAddSavedComponent={addSavedComponent}
              onRenameSavedComponent={renameSavedComponent}
              onDeleteSavedComponent={deleteSavedComponent}
              onDuplicateComponent={duplicateComponent}
              onExportBlock={exportBlock}
              componentEditMode={componentEditMode}
              onAddElement={addElement}
              elementVariants={allElementVariants}
              onSaveSelectedElementAsCustom={saveSelectedElementAsCustom}
              canSaveSelectedElementAsCustom={Boolean(componentEditMode && selectedElementId)}
              selectedElementId={selectedElementId}
              onSelectElement={(id) => {
                store.getState().selectElement(id || null)
                if (id) setComponentEditFocus('component')
              }}
              onCreatePage={createNewPageFromSidebar}
              onRefreshPages={refreshPagesList}
              pagesList={pagesList}
              onOpenPage={openPageFromSidebar}
              onDuplicatePage={duplicatePageFromSidebar}
              onRenamePage={renamePageFromSidebar}
              onDeletePage={deletePageFromSidebar}
              cmsConnection={cmsConnection}
              onOpenCmsSettings={() => {
                setGuideOpen(false)
                setCmsOpen(true)
              }}
              onEditComponent={toggleComponentEditMode}
              onNewComponent={() => setNewOpen(true)}
              onExitComponentEdit={() => setComponentEditMode(false)}
              onOpenComponentCode={(componentBlock) => {
                const assets = getBlockLayerAssets(componentBlock.template)
                const preview = assets?.preview
                if (!preview || !isEditableAsset(preview)) return
                setOpenAsset({
                  templateId: componentBlock.template,
                  blockId: componentBlock.id,
                  blockName: componentBlock.name,
                  path: preview.path,
                  label: preview.label,
                  kind: preview.kind,
                  url: preview.url
                })
              }}
            />
          </div>
        </aside>

        <section
          ref={canvasHostRef}
          className={`relative flex min-h-0 min-w-0 flex-1 flex-col${showGrid && theme === 'dark' ? ' rb-canvas-dots' : ''}`}
          style={{ backgroundColor: t.canvas, touchAction: guideOpen || cmsOpen || openAsset ? 'auto' : 'manipulation' }}
        >
          {guideOpen ? (
            <div className="absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden">
              <BuilderInstructions t={t} onClose={() => setGuideOpen(false)} />
            </div>
          ) : cmsOpen ? (
            <div className="absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden">
              <BuilderCms
                t={t}
                onClose={() => setCmsOpen(false)}
                connection={cmsConnection}
                onConnectionChange={(connection) => store.getState().setCmsConnection(connection)}
                saveStatus={pageSaveStatus}
                onSaveConnection={saveCmsConnection}
              />
            </div>
          ) : openAsset ? (
            <BuilderAssetEditor
              asset={openAsset}
              pageName={page.page}
              uiTheme={theme}
              t={t}
              onClose={() => setOpenAsset(null)}
              canSaveToAssets={isUserComponentTemplateId(openAsset.templateId)}
              savedToAssets={openAssetSavedToAssets}
              savingToAssets={savingToAssets}
              onSaveToAssets={() => {
                const block = page.blocks.find((item) => item.template === openAsset.templateId)
                void saveComponentToAssets(openAsset.templateId, block?.name ?? openAsset.blockName)
              }}
              onAssetSaved={(asset) => bumpTemplateRevision(asset.templateId)}
            />
          ) : (
            <>
          {pendingSaveTemplateId &&
          !savedAssetComponents.some((item) => item.templateId === pendingSaveTemplateId) ? (
            <div
              className="flex shrink-0 items-center justify-between gap-3 px-3 py-2 text-xs"
              style={{ borderBottom: `1px solid ${t.divider}`, background: `${t.accent}14`, color: t.textSecondary }}
            >
              <span>
                Компонент <strong style={{ color: t.text }}>{pendingSaveTemplateId}</strong> добавлен на канвас.
                Сохраните в Assets, чтобы переиспользовать и экспортировать в Bitrix.
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: t.accent,
                  color: '#fff',
                  border: 'none',
                  cursor: savingToAssets ? 'wait' : 'pointer',
                  opacity: savingToAssets ? 0.75 : 1
                }}
                disabled={savingToAssets}
                onClick={() => {
                  const block = page.blocks.find((item) => item.template === pendingSaveTemplateId)
                  void saveComponentToAssets(pendingSaveTemplateId, block?.name)
                }}
              >
                Сохранить в Assets
              </button>
            </div>
          ) : null}
          {/* ── Canvas subheader ── */}
          <div
            className="flex h-8 shrink-0 items-center justify-between gap-2 px-3"
            style={{ borderBottom: `1px solid ${t.divider}`, background: componentEditMode ? t.panel : t.panelElevated }}
          >
            {componentEditMode ? (
              /* Редактор mode: breadcrumb + exit */
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Component className="h-3.5 w-3.5 shrink-0" style={{ color: '#A855F7' }} />
                <span className="truncate text-[11px] font-semibold" style={{ color: t.text }}>
                  {(block?.props as Record<string, string> | undefined)?.name ?? block?.id ?? 'Компонент'}
                </span>
                <span className="text-[10px]" style={{ color: t.textMuted }}>· редактирование</span>
              </div>
            ) : (
              <span className="shrink-0 text-[11px] font-medium" style={{ color: t.textSecondary }}>
                {viewportSize.label}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-medium"
                style={{
                  background: showRuler ? `${t.accent}22` : 'transparent',
                  color: showRuler ? t.accent : t.textMuted,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowRuler((value) => !value)}
                title="Линейка (R)"
              >
                <Ruler className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-medium"
                style={{
                  background: showGrid ? `${t.accent}22` : 'transparent',
                  color: showGrid ? t.accent : t.textMuted,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowGrid((value) => !value)}
                title="Сетка (G)"
              >
                <LayoutGrid className="h-3 w-3" />
              </button>
              <div ref={gridSettingsRef} className="relative">
                <button
                  type="button"
                  className="flex h-5 items-center gap-1 rounded px-1.5 text-[10px]"
                  style={{
                    background: gridSettingsOpen ? t.active : 'transparent',
                    color: t.textMuted,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setGridSettingsOpen((value) => !value)}
                  title="Настройки сетки"
                >
                  {gridSize}px
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {gridSettingsOpen ? (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg p-2 shadow-xl"
                    style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                      Настройки сетки
                    </p>
                    <label className="mb-1 block text-[10px]" style={{ color: t.textSecondary }}>
                      Ячейка (px)
                    </label>
                    <input
                      type="number"
                      min={4}
                      max={80}
                      value={gridSize}
                      onChange={(event) => setGridSize(Math.min(80, Math.max(4, Number(event.target.value) || 20)))}
                      style={{ ...inputStyle, marginBottom: 8 }}
                    />
                    <label className="mb-1 block text-[10px]" style={{ color: t.textSecondary }}>
                      Крупная каждые
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={20}
                      value={gridMajorStep}
                      onChange={(event) =>
                        setGridMajorStep(Math.min(20, Math.max(2, Number(event.target.value) || 5)))
                      }
                      style={inputStyle}
                    />
                  </div>
                ) : null}
              </div>
              <span className="mx-0.5 h-3 w-px shrink-0" style={{ background: t.divider }} />
              <button
                type="button"
                className="flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-medium"
                style={{
                  background: showHotkeys ? `${t.accent}22` : 'transparent',
                  color: showHotkeys ? t.accent : t.textMuted,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowHotkeys((value) => !value)}
                title="Горячие клавиши (?)"
              >
                ?
              </button>
              {componentEditMode ? (
                <>
                  <span className="mx-1 h-3 w-px shrink-0" style={{ background: t.divider }} />
                  <button
                    type="button"
                    className="flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-medium"
                    style={{
                      background: 'transparent',
                      color: '#A855F7',
                      border: `1px solid rgba(168,85,247,0.3)`,
                      cursor: 'pointer',
                      borderRadius: 6
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    onClick={toggleComponentEditMode}
                    title="Выйти из редактирования компонента"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Выйти
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div
            ref={canvasPanRef}
            className="relative flex min-h-0 flex-1 flex-col"
          >
            {showRuler ? (
              <div
                className="grid shrink-0"
                style={{
                  gridTemplateColumns: `${RULER_SIZE}px 1fr`,
                  gridTemplateRows: `${RULER_SIZE}px auto`,
                  borderBottom: `1px solid ${t.divider}`
                }}
              >
                <div style={{ background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5' }} />
                <CanvasRulerHorizontal
                  scrollOffset={canvasScroll.left}
                  zoom={zoom}
                  viewportSize={frameWidth}
                  theme={theme}
                  contentOrigin={rulerOrigin.x}
                />
              </div>
            ) : null}

            <div
              className="relative flex min-h-0 flex-1"
              style={showRuler ? { display: 'grid', gridTemplateColumns: `${RULER_SIZE}px 1fr` } : undefined}
            >
              {showRuler ? (
                <CanvasRulerVertical scrollOffset={canvasScroll.top} zoom={zoom} theme={theme} contentOrigin={rulerOrigin.y} />
              ) : null}

              <div
                ref={canvasScrollRef}
                className="min-h-0 flex-1 overflow-auto"
                style={{
                  cursor: canvasTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default',
                  padding: CANVAS_PADDING,
                  overscrollBehavior: 'contain',
                  ...(canvasTool === 'pan' ? CANVAS_PAN_TOUCH_STYLES : CANVAS_TOUCH_STYLES),
                  ...(showGrid
                    ? canvasGridStyle(
                        Math.max(4, gridSize * frameScale),
                        gridMajorStep,
                        theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
                        theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                      )
                    : {})
                }}
                onScroll={onCanvasScroll}
                onPointerDown={onCanvasPointerDown}
                onPointerUp={onCanvasPointerUp}
                onPointerCancel={onCanvasPointerUp}
              >
            <div
              className="mx-auto"
              style={{
                position: 'relative',
                width: multiWorkspaceWidth,
                height: workspaceHeight,
                minWidth: `calc(100% + ${CANVAS_PAN_GUTTER * 2}px)`,
                minHeight: `calc(100% + ${CANVAS_PAN_GUTTER * 2}px)`
              }}
            >
              {/* ── Multi-viewport: несколько фреймов рядом (ВНУТРИ scroll+grid) ── */}
              {isMultiViewport ? (
                <div
                  style={{
                    position: 'absolute',
                    left: CANVAS_WORKSPACE_PAD,
                    top: CANVAS_WORKSPACE_PAD,
                    display: 'flex',
                    gap: MULTI_FRAME_GAP,
                    alignItems: 'flex-start',
                  }}
                >
                  {shownViewports.map((vp) => {
                    const VIEWPORT_COLOR: Record<ViewportMode, string> = {
                      desktop: '#0099FF',
                      macbook: '#6366F1',
                      tablet:  '#10B981',
                      mobile:  '#F59E0B',
                    }
                    const VIEWPORT_LABEL: Record<ViewportMode, string> = {
                      desktop: 'Desktop',
                      macbook: 'MacBook',
                      tablet:  'Планшет',
                      mobile:  'Мобильный',
                    }
                    const vpSize = resolveViewportSize(vp, tabletOrientation, mobileOrientation)
                    const vpNaturalWidth = vpSize.width
                    const scaledVpWidth = vpNaturalWidth * frameScale
                    const isPrimary = vp === viewport
                    const color = VIEWPORT_COLOR[vp]
                    const label = VIEWPORT_LABEL[vp]
                    return (
                      <div key={vp} className="flex shrink-0 flex-col" style={{ width: scaledVpWidth }}>
                        {/* Label */}
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                          <span className="text-[11px] font-semibold" style={{ color: isPrimary ? t.text : t.textSecondary }}>
                            {label}
                          </span>
                          <span className="text-[10px]" style={{ color: t.textMuted }}>{vpNaturalWidth}px</span>
                          {isPrimary && (
                            <span className="rounded px-1 text-[9px] font-semibold uppercase" style={{ background: `${color}22`, color }}>
                              активный
                            </span>
                          )}
                        </div>
                        {/* Frame wrapper */}
                        <div
                          style={{
                            width: scaledVpWidth,
                            overflow: 'hidden',
                            borderRadius: 8,
                            boxShadow: isPrimary ? `0 8px 32px ${color}33` : '0 4px 20px rgba(0,0,0,0.3)',
                            border: `1px solid ${isPrimary ? color + '66' : t.chromeBorder}`,
                            cursor: isPrimary ? 'default' : 'pointer',
                            background: t.pageFrame,
                          }}
                          onClick={() => { if (!isPrimary) store.getState().setViewport(vp) }}
                          title={isPrimary ? undefined : `Переключить на ${label}`}
                        >
                          {/* Chrome bar */}
                          <div
                            className="flex items-center px-3 py-1.5"
                            style={{ background: t.panelElevated, borderBottom: `1px solid ${t.divider}` }}
                          >
                            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full mr-1.5" style={{ background: color, opacity: 0.8 }} />
                            <span className="text-[10px]" style={{ color: t.textMuted }}>{label} · {vpNaturalWidth}px</span>
                          </div>
                          {/* Scaled content */}
                          {isPrimary ? (
                            /* Основной viewport: полноценный canvasFrameRef с оверлеями */
                            <div
                              ref={canvasFrameRef}
                              style={{
                                transform: `scale(${frameScale})`,
                                transformOrigin: 'top left',
                                width: vpNaturalWidth,
                              }}
                            >
                              <div
                                className="overflow-hidden"
                                style={{
                                  background: t.pageFrame,
                                  minHeight: frameMinHeight > 0 ? frameMinHeight : undefined
                                }}
                              >
                                <div>
                                  {componentEditMode ? null : (
                                    <>
                                      {isReady ? (
                                      <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleCanvasDragEnd}
                                      >
                                        <SortableContext
                                          items={canvasBlocks.map((b) => b.id)}
                                          strategy={verticalListSortingStrategy}
                                        >
                                          {canvasBlocks.map((item) => (
                                            <SortableCanvasBlock
                                              key={item.id}
                                              item={item}
                                              selected={activeId === item.id}
                                              hovered={hoveredBlockId === item.id && activeId !== item.id}
                                              canvasTool={canvasTool}
                                              t={t}
                                              viewport={viewport}
                                              blockPreviewKey={blockPreviewKey}
                                              onRef={onBlockRef}
                                              onSelect={onBlockSelect}
                                              onEdit={onBlockEdit}
                                              onDuplicate={onBlockDuplicate}
                                              onDelete={onBlockDelete}
                                              onHover={setHoveredBlockId}
                                              onResizeStart={onBlockResizeStart}
                                            />
                                          ))}
                                        </SortableContext>
                                      </DndContext>
                                      ) : canvasBlocks.map((item) => (
                                        <section
                                          key={item.id}
                                          ref={(el) => { blockRefs.current[item.id] = el }}
                                          className="relative"
                                          onClick={() => { if (canvasTool === 'select') store.getState().selectBlock(item.id) }}
                                        >
                                          {item.type === 'component' ? (
                                            <div style={{ ...componentRootStyle(resolveComponentDesign(item.design)), cursor: 'default' }}>
                                              <BlockPreview key={blockPreviewKey(item)} block={item} elementOptions={{ viewport }} />
                                            </div>
                                          ) : (
                                            <BlockPreview key={blockPreviewKey(item)} block={item} elementOptions={{ viewport }} />
                                          )}
                                        </section>
                                      ))}
                                      {canvasBlocks.length === 0 ? (
                                        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6">
                                          <div
                                            className="flex h-16 w-16 items-center justify-center rounded-2xl"
                                            style={{ background: `${t.accent}18`, border: `1px dashed ${t.accent}44` }}
                                          >
                                            <Layers className="h-7 w-7" style={{ color: t.accent, opacity: 0.7 }} />
                                          </div>
                                          <div className="text-center">
                                            <p className="text-sm font-semibold" style={{ color: t.text }}>
                                              Страница пустая
                                            </p>
                                            <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                                              Добавьте первый блок из библиотеки или создайте компонент
                                            </p>
                                          </div>
                                          <div className="flex flex-wrap justify-center gap-2">
                                            <button
                                              type="button"
                                              className="rounded-lg px-4 py-2 text-xs font-medium"
                                              style={{ background: t.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                                              onClick={() => { setLeftOpen(true); setLeftTab('assets') }}
                                            >
                                              + Из Insert
                                            </button>
                                            <button
                                              type="button"
                                              className="rounded-lg px-4 py-2 text-xs font-medium"
                                              style={{ background: t.inputBg, color: t.textSecondary, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
                                              onClick={() => setNewOpen(true)}
                                            >
                                              Создать компонент
                                            </button>
                                          </div>
                                          <p className="text-[10px]" style={{ color: t.textMuted }}>
                                            Подсказка: нажмите <kbd className="rounded px-1 py-0.5 font-mono text-[9px]" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}>?</kbd> для горячих клавиш
                                          </p>
                                        </div>
                                      ) : null}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Дополнительный viewport: превью + синхронизация выделения */
                            <div
                              style={{
                                transform: `scale(${frameScale})`,
                                transformOrigin: 'top left',
                                width: vpNaturalWidth,
                              }}
                            >
                              {canvasBlocks.length > 0 ? (
                                canvasBlocks.map((item) => {
                                  const isSelected = activeId === item.id
                                  const isHoveredHere = hoveredBlockId === item.id
                                  return (
                                    <div
                                      key={`${item.id}-${vp}`}
                                      style={{ position: 'relative' }}
                                      onClick={(e) => {
                                        if (canvasTool !== 'select') return
                                        e.stopPropagation() // не переключаем viewport
                                        store.getState().selectBlock(item.id)
                                      }}
                                      onMouseEnter={() => setHoveredBlockId(item.id)}
                                      onMouseLeave={() => setHoveredBlockId(null)}
                                    >
                                      <BlockPreview
                                        key={blockPreviewKey(item)}
                                        block={item}
                                        elementOptions={{ viewport: vp }}
                                      />
                                      {/* Overlay: hover / selection */}
                                      {(isSelected || isHoveredHere) && canvasTool === 'select' ? (
                                        <div
                                          aria-hidden
                                          style={{
                                            position: 'absolute',
                                            inset: 0,
                                            pointerEvents: 'none',
                                            outline: isSelected
                                              ? `2px solid ${color}`
                                              : `1px solid ${color}66`,
                                            outlineOffset: isSelected ? -2 : -1,
                                            borderRadius: 2,
                                            background: isSelected
                                              ? `${color}0A`
                                              : 'transparent',
                                          }}
                                        />
                                      ) : null}
                                      {/* Selection label */}
                                      {isSelected ? (
                                        <div
                                          aria-hidden
                                          style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            zIndex: 10,
                                            pointerEvents: 'none',
                                            background: color,
                                            color: '#fff',
                                            fontSize: 9,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                            padding: '2px 5px',
                                            borderRadius: '0 0 4px 0',
                                          }}
                                        >
                                          {item.name ?? item.template}
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                })
                              ) : (
                                <div className="flex items-center justify-center" style={{ height: 400, color: t.textMuted, fontSize: 12 }}>
                                  Страница пустая
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {/* ── Single viewport frame (или componentEditMode) ── */}
              {!isMultiViewport ? (
              <div
                style={{
                  position: 'absolute',
                  left: CANVAS_WORKSPACE_PAD,
                  top: CANVAS_WORKSPACE_PAD,
                  width: scaledFrameWidth,
                  height: scaledFrameHeight
                }}
              >
              <div
                ref={canvasFrameRef}
                style={{
                  transform: `scale(${frameScale})`,
                  transformOrigin: 'top left',
                  width: frameWidth
                }}
              >
              <div
                className="overflow-hidden shadow-2xl"
                style={{
                  background: t.pageFrame,
                  borderRadius: 8,
                  minHeight: frameMinHeight > 0 ? frameMinHeight : undefined
                }}
              >
                <div
                  className="flex items-center px-4 py-2"
                  style={{ borderBottom: `2px solid ${t.accent}`, background: t.pageFrame }}
                >
                  <span className="text-[11px] font-medium text-neutral-500">{viewportSize.label}</span>
                </div>
                <div>
                  {componentEditMode ? (
                    block && componentDesign ? (
                    <div className="flex flex-col items-center p-6" style={{ background: t.canvas }}>
                      {/* Artboard label */}
                      <div className="mb-2 flex items-center gap-1.5">
                        <Component className="h-3 w-3 shrink-0" style={{ color: '#A855F7' }} />
                        <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>
                          {(block.props as Record<string, string> | undefined)?.name ?? block.id}
                        </span>
                        <span
                          className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}
                        >
                          component
                        </span>
                      </div>
                      <div
                        data-randee-component-artboard
                        ref={(el) => {
                          if (block) blockRefs.current[block.id] = el
                        }}
                        style={{
                          ...componentArtboardStyle(componentDesign),
                          ...componentArtboardOutline()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          setComponentEditFocus('artboard')
                        }}
                      >
                        <div
                          data-randee-component-root
                          style={{
                            ...componentRootStyle(componentDesign),
                            outline:
                              componentEditFocus === 'component' ? `2px solid ${t.accent}` : '2px solid transparent',
                            outlineOffset: -2,
                            cursor: 'default'
                          }}
                          onClick={(event) => {
                            event.stopPropagation()
                            setComponentEditFocus('component')
                            store.getState().selectBlock(block.id)
                          }}
                        >
                          <BlockPreview
                            key={blockPreviewKey(block)}
                            block={block}
                            elementOptions={artboardElementOptions}
                          />
                        </div>
                      </div>
                      {/* Artboard bottom hint */}
                      <div className="mt-3 rounded-lg px-3 py-2 text-center" style={{ background: t.inputBg, border: `1px dashed ${t.divider}` }}>
                        <p className="text-[10px] leading-relaxed" style={{ color: t.textMuted }}>
                          <strong style={{ color: t.textSecondary }}>Клик</strong> — выбрать элемент → справа вкладка «Текст»
                          <br />
                          <strong style={{ color: t.textSecondary }}>Двойной клик</strong> — быстро изменить надпись
                          <br />
                          <strong style={{ color: t.textSecondary }}>Перетащить</strong> — поменять порядок ·{' '}
                          <strong style={{ color: t.textSecondary }}>+</strong> на hover — добавить
                        </p>
                      </div>
                    </div>
                    ) : (
                      <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-neutral-400">
                        Выберите компонент на канвасе для редактирования.
                      </div>
                    )
                  ) : (
                    <>
                      {isReady ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleCanvasDragEnd}
                      >
                        <SortableContext
                          items={canvasBlocks.map((b) => b.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {canvasBlocks.map((item) => (
                            <SortableCanvasBlock
                              key={item.id}
                              item={item}
                              selected={activeId === item.id}
                              hovered={hoveredBlockId === item.id && activeId !== item.id}
                              canvasTool={canvasTool}
                              t={t}
                              viewport={viewport}
                              blockPreviewKey={blockPreviewKey}
                              onRef={onBlockRef}
                              onSelect={onBlockSelect}
                              onEdit={onBlockEdit}
                              onDuplicate={onBlockDuplicate}
                              onDelete={onBlockDelete}
                              onHover={setHoveredBlockId}
                              onResizeStart={onBlockResizeStart}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                      ) : canvasBlocks.map((item) => (
                        <section
                          key={item.id}
                          ref={(el) => { blockRefs.current[item.id] = el }}
                          className="relative"
                          onClick={() => { if (canvasTool === 'select') store.getState().selectBlock(item.id) }}
                        >
                          {item.type === 'component' ? (
                            <div style={{ ...componentRootStyle(resolveComponentDesign(item.design)), cursor: 'default' }}>
                              <BlockPreview key={blockPreviewKey(item)} block={item} elementOptions={{ viewport }} />
                            </div>
                          ) : (
                            <BlockPreview key={blockPreviewKey(item)} block={item} elementOptions={{ viewport }} />
                          )}
                        </section>
                      ))}
                      {canvasBlocks.length === 0 ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 px-6">
                          <div
                            className="flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={{ background: `${t.accent}18`, border: `1px dashed ${t.accent}44` }}
                          >
                            <Layers className="h-7 w-7" style={{ color: t.accent, opacity: 0.7 }} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold" style={{ color: t.text }}>
                              Страница пустая
                            </p>
                            <p className="mt-1 text-xs" style={{ color: t.textMuted }}>
                              Добавьте первый блок из библиотеки или создайте компонент
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              className="rounded-lg px-4 py-2 text-xs font-medium"
                              style={{ background: t.accent, color: '#fff', border: 'none', cursor: 'pointer' }}
                              onClick={() => { setLeftOpen(true); setLeftTab('assets') }}
                            >
                              + Из Insert
                            </button>
                            <button
                              type="button"
                              className="rounded-lg px-4 py-2 text-xs font-medium"
                              style={{ background: t.inputBg, color: t.textSecondary, border: `1px solid ${t.divider}`, cursor: 'pointer' }}
                              onClick={() => setNewOpen(true)}
                            >
                              Создать компонент
                            </button>
                          </div>
                          <p className="text-[10px]" style={{ color: t.textMuted }}>
                            Подсказка: нажмите <kbd className="rounded px-1 py-0.5 font-mono text-[9px]" style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}>?</kbd> для горячих клавиш
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              </div>
            </div>
            ) : null}
              </div>
            </div>
          </div>
          </div>

          {/* ── Sprint D: Framer-style bottom toolbar ──────────────────── */}
          <footer className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
            <div
              className="pointer-events-auto flex items-center gap-0.5 rounded-xl px-1.5 py-1 shadow-xl"
              style={{
                background: t.toolbar,
                border: `1px solid ${t.toolbarBorder}`,
                backdropFilter: 'blur(12px)'
              }}
            >
              {/* ── Tools: Select / Pan ── */}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: canvasTool === 'select' ? t.active : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: canvasTool === 'select' ? t.text : t.textMuted
                }}
                onClick={() => setCanvasTool('select')}
                aria-label="Выбор"
                aria-pressed={canvasTool === 'select'}
                title="Выбор (V)"
              >
                <MousePointer2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: canvasTool === 'pan' ? t.active : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: canvasTool === 'pan' ? t.text : t.textMuted
                }}
                onClick={() => setCanvasTool('pan')}
                aria-label="Перемещение"
                aria-pressed={canvasTool === 'pan'}
                title="Перемещение (H)"
              >
                <Hand className="h-3.5 w-3.5" />
              </button>

              <span className="mx-1 h-4 w-px" style={{ background: t.divider }} />

              {/* ── Undo / Redo ── */}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: store.getState().canUndo() ? 'pointer' : 'default',
                  color: store.getState().canUndo() ? t.textSecondary : t.textMuted,
                  opacity: store.getState().canUndo() ? 1 : 0.35
                }}
                disabled={!store.getState().canUndo()}
                onClick={() => store.getState().undo()}
                title="Отменить (⌘Z)"
                aria-label="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: store.getState().canRedo() ? 'pointer' : 'default',
                  color: store.getState().canRedo() ? t.textSecondary : t.textMuted,
                  opacity: store.getState().canRedo() ? 1 : 0.35
                }}
                disabled={!store.getState().canRedo()}
                onClick={() => store.getState().redo()}
                title="Повторить (⌘⇧Z)"
                aria-label="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>

              <span className="mx-1 h-4 w-px" style={{ background: t.divider }} />

              {/* ── Zoom: − | % | + ── */}
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.color = t.text }}
                onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted }}
                onClick={() => zoomOut()}
                title="Уменьшить (⌘−)"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <div ref={zoomMenuRef} className="relative">
                <button
                  type="button"
                  className="flex h-7 min-w-[44px] items-center justify-center rounded-lg px-1 text-[11px] font-semibold tabular-nums"
                  style={{
                    color: t.text,
                    background: zoomOpen ? t.active : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em'
                  }}
                  onMouseEnter={(e) => { if (!zoomOpen) e.currentTarget.style.background = t.hover }}
                  onMouseLeave={(e) => { if (!zoomOpen) e.currentTarget.style.background = 'transparent' }}
                  onClick={() => setZoomOpen((v) => !v)}
                  title="Масштаб"
                >
                  {Math.round(zoom)}%
                </button>

                {zoomOpen ? (
                  <div
                    className="absolute bottom-full left-1/2 mb-2 min-w-[200px] -translate-x-1/2 rounded-xl py-1 shadow-2xl"
                    style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
                  >
                    {[
                      { label: 'Увеличить',    shortcut: '⌘+', action: zoomIn },
                      { label: 'Уменьшить',    shortcut: '⌘−', action: zoomOut },
                    ].map(({ label, shortcut, action }) => (
                      <button
                        key={label}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px]"
                        style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        onClick={() => { action(); setZoomOpen(false) }}
                      >
                        {label}
                        <span style={{ color: t.textMuted }}>{shortcut}</span>
                      </button>
                    ))}
                    <div className="my-1 h-px" style={{ background: t.divider }} />
                    {[
                      { label: 'Масштаб 100%', shortcut: '⌘0', action: zoomTo100 },
                      { label: 'По ширине',    shortcut: '⌘1', action: zoomToFit },
                      { label: 'К выделению',  shortcut: '⌘2', action: zoomToSelection },
                    ].map(({ label, shortcut, action }) => (
                      <button
                        key={label}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px]"
                        style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        onClick={() => { action(); setZoomOpen(false) }}
                      >
                        {label}
                        <span style={{ color: t.textMuted }}>{shortcut}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: t.textMuted }}
                onMouseEnter={(e) => { e.currentTarget.style.color = t.text }}
                onMouseLeave={(e) => { e.currentTarget.style.color = t.textMuted }}
                onClick={() => zoomIn()}
                title="Увеличить (⌘+)"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </footer>
            </>
          )}
        </section>

        {/* ── Right panel: slide transition ── */}
        <aside
          className="relative shrink-0 overflow-hidden"
          style={{
            width: rightOpen ? rightPanelWidth : 0,
            minWidth: 0,
            borderLeft: rightOpen ? `1px solid ${t.chromeBorder}` : 'none',
            background: t.panel,
            transition: resizingPanel === 'right' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Inner container keeps fixed width so content doesn't squash during animation */}
          <div
            className="flex h-full flex-col overflow-hidden"
            style={{ width: rightPanelWidth, minWidth: rightPanelWidth }}
          >
            <PanelResizeHandle
              side="right"
              accent={t.accent}
              hoverBg={t.hover}
              onResizeStart={(event) => startPanelResize('right', event)}
            />
            {componentEditMode ? (
              <BuilderComponentInspector
                block={block}
                store={store}
                templateLabel={block?.template}
                theme={inspectorTheme}
                compactTabs={rightPanelWidth < 360}
                selectedElementId={selectedElementId}
                onSelectElement={(elementId) => {
                  store.getState().selectElement(elementId || null)
                  if (elementId) setComponentEditFocus('component')
                }}
                onClose={() => setRightOpen(false)}
                onOpenCodeAsset={openCodeAssetFromInspector}
                onOpenInIde={openInIdeFromInspector}
                onSyncCodeLayout={syncCodeLayoutFromInspector}
                onOpenCmsTab={() => {
                  setLeftOpen(true)
                  setLeftTab('cms')
                }}
              />
            ) : (
              /* ── Sprint E: Page Inspector with tabs ─────────────────── */
              <>
                {/* Header */}
                <div
                  className="flex h-9 shrink-0 items-center gap-2 px-3"
                  style={{ borderBottom: `1px solid ${t.divider}` }}
                >
                  <span className="flex-1 truncate text-[11px] font-semibold" style={{ color: t.text }}>
                    {block ? (block.name ?? block.template) : page.page}
                  </span>
                  <button
                    type="button"
                    data-testid="hide-inspector-panel"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                    style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => setRightOpen(false)}
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                    <span className="sr-only">Скрыть панель</span>
                  </button>
                </div>

                {/* Tab bar */}
                <div className="flex shrink-0" style={{ borderBottom: `1px solid ${t.divider}` }}>
                  {([
                    { id: 'block' as const,  label: 'Блок',     icon: SlidersHorizontal },
                    { id: 'page'  as const,  label: 'Страница', icon: FileText },
                    { id: 'seo'   as const,  label: 'SEO',      icon: Globe },
                  ] as const).map(({ id, label, icon: Icon }) => {
                    const active = pageInspectorTab === id
                    return (
                      <button
                        key={id}
                        type="button"
                        className="flex h-8 flex-1 items-center justify-center gap-1.5 text-[11px] font-medium"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: active ? t.text : t.textMuted,
                          borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                          marginBottom: -1,
                        }}
                        onClick={() => setPageInspectorTab(id)}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Tab content */}
                <div className="min-h-0 flex-1 overflow-y-auto">

                  {/* ── Блок ── */}
                  {pageInspectorTab === 'block' ? (
                    <div className="p-3">
                      {block?.type === 'component' ? (
                        <div
                          className="mb-3 rounded-lg p-3"
                          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.35)' }}
                        >
                          <p className="text-[11px] font-semibold" style={{ color: t.text }}>
                            Это компонент
                          </p>
                          <p className="mt-1 text-[10px] leading-snug" style={{ color: t.textMuted }}>
                            Здесь только общие props. Чтобы менять кнопки, тексты и структуру внутри — откройте режим
                            редактирования.
                          </p>
                          <button
                            type="button"
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold text-white"
                            style={{ background: '#A855F7', border: 'none', cursor: 'pointer' }}
                            onClick={() => {
                              if (block) store.getState().selectBlock(block.id)
                              toggleComponentEditMode()
                              setLeftOpen(true)
                              setLeftTab('assets')
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Редактировать содержимое
                          </button>
                        </div>
                      ) : null}
                      {/* Viewport switcher */}
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: t.textMuted }}>
                        Брейкпоинт
                      </p>
                      <BuilderViewportToolbar
                        viewport={viewport}
                        tabletOrientation={tabletOrientation}
                        mobileOrientation={mobileOrientation}
                        onViewportChange={(mode) => store.getState().setViewport(mode)}
                        onRotate={rotateViewport}
                        t={t}
                        variant="inspector"
                      />

                      <div className="mt-3" style={{ borderTop: `1px solid ${t.divider}` }}>
                        <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: t.textMuted }}>
                          {block ? `Блок: ${block.type}` : 'Выделенный блок'}
                        </p>
                        {block ? (
                          <BlockPropsFields
                            block={block}
                            store={store}
                            inputStyle={inputStyle}
                            labelColor={t.textSecondary}
                          />
                        ) : (
                          <p className="text-[11px]" style={{ color: t.textMuted }}>
                            Выберите блок на канвасе.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* ── Страница ── */}
                  {pageInspectorTab === 'page' ? (
                    <div className="grid gap-2 p-3">
                      <label className="grid gap-1">
                        <span className="text-[10px] tracking-[0.03em]" style={{ color: t.textMuted }}>Название</span>
                        <input
                          style={inputStyle}
                          value={page.page}
                          onChange={(event) => store.getState().setPageMeta({ page: event.target.value, slug: page.slug })}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] tracking-[0.03em]" style={{ color: t.textMuted }}>Ссылка (slug)</span>
                        <input
                          style={inputStyle}
                          value={page.slug}
                          onChange={(event) => store.getState().setPageMeta({ page: page.page, slug: event.target.value })}
                        />
                      </label>
                    </div>
                  ) : null}

                  {/* ── SEO ── */}
                  {pageInspectorTab === 'seo' ? (
                    <div className="grid gap-2 p-3">
                      <label className="grid gap-1">
                        <span className="text-[10px] tracking-[0.03em]" style={{ color: t.textMuted }}>Заголовок</span>
                        <input
                          style={inputStyle}
                          value={page.seo.title}
                          onChange={(event) => store.getState().setSeoMeta({ title: event.target.value })}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] tracking-[0.03em]" style={{ color: t.textMuted }}>Описание</span>
                        <textarea
                          className="min-h-16 resize-none rounded py-2"
                          style={{ ...inputStyle, height: 'auto' }}
                          value={page.seo.description}
                          onChange={(event) => store.getState().setSeoMeta({ description: event.target.value })}
                        />
                      </label>
                      <details
                        className="rounded-md"
                        style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
                      >
                        <summary className="cursor-pointer px-2 py-2 text-[11px] font-medium" style={{ color: t.textSecondary }}>
                          JSON-LD / Debug
                        </summary>
                        <div className="grid gap-2 p-2" style={{ borderTop: `1px solid ${t.divider}` }}>
                          <textarea
                            className="min-h-24 w-full resize-none rounded p-2 font-mono text-[10px] outline-none"
                            style={{ background: t.inputBg, color: t.textSecondary, border: 'none' }}
                            value={JSON.stringify(seoJsonLd, null, 2)}
                            readOnly
                          />
                          <textarea
                            className="min-h-32 w-full resize-none rounded p-2 font-mono text-[10px] outline-none"
                            style={{ background: t.inputBg, color: t.textSecondary, border: 'none' }}
                            value={JSON.stringify(page, null, 2)}
                            readOnly
                          />
                        </div>
                      </details>
                    </div>
                  ) : null}

                </div>
              </>
            )}
          </div>
        </aside>
      </div>
      </TemplateRevisionProvider>
      </BlockVendorProvider>

      {!leftOpen ? (
        <button
          type="button"
          data-testid="open-blocks-fab"
          className="fixed bottom-24 left-6 z-30 flex h-11 w-11 items-center justify-center rounded-full shadow-lg"
          style={{
            background: t.fab,
            border: `1px solid ${t.toolbarBorder}`,
            color: t.text,
            cursor: 'pointer'
          }}
          onClick={() => setLeftOpen(true)}
          aria-label="Show Blocks"
        >
          <PanelLeftOpen className="h-5 w-5" />
          <span className="sr-only">Show Blocks</span>
        </button>
      ) : null}

      {!rightOpen ? (
        <button
          type="button"
          data-testid="open-inspector-fab"
          className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full shadow-lg"
          style={{
            background: t.fab,
            border: `1px solid ${t.toolbarBorder}`,
            color: t.text,
            cursor: 'pointer'
          }}
          onClick={() => setRightOpen(true)}
          aria-label="Open Inspector"
        >
          <Layers className="h-5 w-5" />
          <span className="sr-only">Open Inspector</span>
        </button>
      ) : null}

      {/* Hotkeys panel */}
      {showHotkeys ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowHotkeys(false)}
        >
          <div
            className="w-[480px] max-w-[95vw] rounded-2xl p-6 shadow-2xl"
            style={{ background: t.panel, border: `1px solid ${t.divider}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: t.text }}>Горячие клавиши</h2>
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-sm"
                style={{ color: t.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowHotkeys(false)}
              >
                ×
              </button>
            </div>
            {[
              { group: 'Страница' },
              { key: '⌘S', label: 'Сохранить страницу' },
              { key: '⌘Z', label: 'Отменить' },
              { key: '⌘⇧Z / ⌘Y', label: 'Повторить' },
              { key: '⌘D', label: 'Дублировать блок' },
              { key: 'Del', label: 'Удалить выбранный блок' },
              { group: 'Canvas' },
              { key: 'V', label: 'Инструмент выбор' },
              { key: 'H', label: 'Инструмент перемещение' },
              { key: '⌘+', label: 'Увеличить' },
              { key: '⌘−', label: 'Уменьшить' },
              { key: '⌘0', label: 'Масштаб 100%' },
              { key: '⌘1', label: 'По ширине' },
              { key: '⌘2', label: 'К выделению' },
              { group: 'Вид' },
              { key: 'R', label: 'Линейка' },
              { key: 'G', label: 'Сетка' },
              { key: '?', label: 'Показать эту панель' },
              { group: 'Элемент (в режиме компонента)' },
              { key: '⌘D', label: 'Дублировать элемент' },
              { key: 'Del', label: 'Удалить элемент' },
              { key: '↑ / ↓', label: 'Переместить вверх/вниз' },
            ].map((item, i) =>
              'group' in item ? (
                <p key={i} className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: t.textMuted }}>
                  {item.group}
                </p>
              ) : (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <span className="text-[12px]" style={{ color: t.textSecondary }}>{item.label}</span>
                  <kbd
                    className="rounded px-1.5 py-0.5 text-[11px] font-mono"
                    style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.divider}` }}
                  >
                    {item.key}
                  </kbd>
                </div>
              )
            )}
            <p className="mt-4 text-center text-[10px]" style={{ color: t.textMuted }}>
              Нажмите Esc или кликните за пределами для закрытия
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Preview mode overlay ─────────────────────────────────────── */}
      {previewMode ? (
        <div
          className="fixed inset-0 z-[9998] flex flex-col overflow-auto"
          style={{ background: '#ffffff' }}
        >
          {/* Preview toolbar */}
          <div
            className="fixed right-4 top-4 z-[9999] flex items-center gap-2"
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-1.5"
              style={{
                background: 'rgba(17,17,17,0.90)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              <Play className="h-3 w-3" style={{ color: '#22C55E', marginLeft: 1 }} />
              <span className="text-[11px] font-semibold" style={{ color: '#E8E8E8' }}>
                Предпросмотр
              </span>
              <span className="text-[10px]" style={{ color: '#555555' }}>
                — {page.page}
              </span>
              <button
                type="button"
                className="ml-1 flex h-5 w-5 items-center justify-center rounded"
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#999999', cursor: 'pointer' }}
                title="Выйти из предпросмотра (Esc)"
                onClick={() => setPreviewMode(false)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#999999' }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Page content */}
          <BlockVendorProvider page={page}>
            <TemplateRevisionProvider revisions={templateRevisions}>
              <div style={{ minHeight: '100vh' }}>
                {page.blocks.map((previewBlock) => (
                  <BlockPreview
                    key={previewBlock.id}
                    block={previewBlock}
                    elementOptions={{ viewport: 'desktop' }}
                  />
                ))}
              </div>
            </TemplateRevisionProvider>
          </BlockVendorProvider>
        </div>
      ) : null}
    </main>
  )
}

// ---------------------------------------------------------------------------
// SortableCanvasBlock — sortable wrapper around a single canvas block.
// Defined outside BuilderEditor so useSortable hook rules are satisfied.
// ---------------------------------------------------------------------------

type SortableCanvasBlockProps = {
  item: PageBlock
  selected: boolean
  hovered: boolean
  canvasTool: 'select' | 'pan'
  t: {
    accent: string
    text: string
    textMuted: string
    inputBg: string
    [key: string]: string
  }
  viewport: ViewportMode
  blockPreviewKey: (block: PageBlock) => string
  onRef: (id: string, el: HTMLElement | null) => void
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onHover: (id: string | null) => void
  onResizeStart: (blockId: string, edge: ResizeEdge, event: React.PointerEvent) => void
}

const SortableCanvasBlock = React.memo(function SortableCanvasBlock({
  item,
  selected,
  hovered,
  canvasTool,
  t,
  viewport,
  blockPreviewKey,
  onRef,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onHover,
  onResizeStart
}: SortableCanvasBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const mergedRef = React.useCallback(
    (el: HTMLElement | null) => {
      setNodeRef(el)
      onRef(item.id, el)
    },
    [setNodeRef, onRef, item.id]
  )

  const dragHandle: BlockOverlayDragHandle = {
    listeners: listeners as BlockOverlayDragHandle['listeners'],
    attributes: attributes as unknown as BlockOverlayDragHandle['attributes']
  }

  const overlayTheme = React.useMemo(
    () => ({ accent: t.accent, text: t.text, textMuted: t.textMuted, inputBg: t.inputBg }),
    [t.accent, t.text, t.textMuted, t.inputBg]
  )

  return (
    <section
      ref={mergedRef}
      className="relative"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 999 : undefined
      }}
      onClick={() => { if (canvasTool === 'select') onSelect(item.id) }}
      onPointerEnter={() => onHover(item.id)}
      onPointerLeave={() => onHover(null)}
    >
      <CanvasBlockOverlay
        blockName={item.name ?? item.template}
        selected={selected}
        hovered={hovered}
        canvasTool={canvasTool}
        theme={overlayTheme}
        isDragging={isDragging}
        dragHandle={dragHandle}
        isComponentType={item.type === 'component'}
        onEdit={() => onEdit(item.id)}
        onDuplicate={() => onDuplicate(item.id)}
        onDelete={() => onDelete(item.id)}
        onResizeStart={(edge, event) => onResizeStart(item.id, edge, event)}
      />
      {item.type === 'component' ? (
        <div
          style={{
            ...componentRootStyle(resolveComponentDesign(item.design)),
            cursor: 'default'
          }}
        >
          <BlockPreview
            key={blockPreviewKey(item)}
            block={item}
            elementOptions={{ viewport }}
          />
        </div>
      ) : (
        <BlockPreview
          key={blockPreviewKey(item)}
          block={item}
          elementOptions={{ viewport }}
        />
      )}
    </section>
  )
})
