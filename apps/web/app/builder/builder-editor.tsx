'use client'

import * as React from 'react'
import {
  buildBuilderWebPageJsonLd,
  createBuilderStore,
  exportPageToJson,
  resolveComponentDesign,
  selectedBlock,
  type BuilderPage,
  type ElementVariant,
  type PageBlock
} from '@randee/builder'
import { BlockPreview, BlockVendorProvider, collectTemplateVendors, createBlockFromTemplate, invalidateTemplateStyles, isUserComponentTemplateId, listLibraryVariants, listVendors, registerUserTemplate, TemplateRevisionProvider, type LibraryVariant } from '@randee/blocks'
import { BuilderElementPicker } from './builder-element-picker'
import { useSearchParams } from 'next/navigation'
import { useStore } from 'zustand'
import {
  BookOpen,
  Boxes,
  ChevronDown,
  Component,
  Copy,
  Download,
  GripVertical,
  Hand,
  Layers,
  LayoutGrid,
  MousePointer2,
  PanelLeftOpen,
  PanelRightClose,
  Pencil,
  Plus,
  Ruler,
  SquarePlus,
  Trash2
} from 'lucide-react'
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
import type { BuilderAssetTarget } from './builder-asset-types'
import { BuilderComponentInspector } from './builder-component-inspector'
import { BlockPropsFields } from './builder-block-props-fields'
import { componentArtboardStyle, componentRootStyle } from './builder-component-canvas'
import { BuilderThemeToggle } from './builder-theme-toggle'
import type { InspectorTheme } from './builder-inspector-ui'
import { BuilderViewportToolbar } from './builder-viewport-toolbar'
import { BuilderInstructions } from './builder-instructions'
import { resolveViewportSize, type ViewportOrientation } from './builder-viewport'
import {
  attachCanvasPinchZoom,
  CANVAS_PAN_TOUCH_STYLES,
  CANVAS_TOUCH_STYLES
} from './builder-canvas-gestures'

const CANVAS_WORKSPACE_PAD = 520

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
    bg: '#111111',
    panel: '#171717',
    panelElevated: '#1c1c1c',
    canvas: '#2b2b2b',
    chromeBorder: 'rgba(255,255,255,0.07)',
    divider: 'rgba(255,255,255,0.06)',
    text: '#f5f5f5',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    hover: 'rgba(255,255,255,0.06)',
    active: 'rgba(255,255,255,0.1)',
    inputBg: 'rgba(255,255,255,0.04)',
    inputFocus: 'rgba(0,153,255,0.45)',
    toolbar: 'rgba(28,28,28,0.96)',
    toolbarBorder: 'rgba(255,255,255,0.08)',
    menu: '#222222',
    menuBorder: 'rgba(255,255,255,0.08)',
    accent: '#0099ff',
    accentHover: '#33adff',
    pageFrame: '#ffffff',
    fab: '#1c1c1c',
    segmentTrack: '#252525',
    segmentActive: '#333333',
    segmentShadow: '0 1px 2px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)'
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
  const [creatingComponent, setCreatingComponent] = React.useState(false)
  const [variantTick, setVariantTick] = React.useState(0)
  const [templateRevisions, setTemplateRevisions] = React.useState<Record<string, number>>({})
  const [pageSaveStatus, setPageSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const pageLoadedFromDiskRef = React.useRef(false)
  const [savedAssetComponents, setSavedAssetComponents] = React.useState<SavedAssetComponent[]>([])
  const [savingToAssets, setSavingToAssets] = React.useState(false)
  const [pendingSaveTemplateId, setPendingSaveTemplateId] = React.useState<string | null>(null)
  const [componentEditMode, setComponentEditMode] = React.useState(false)
  const [componentEditFocus, setComponentEditFocus] = React.useState<'artboard' | 'component'>('component')
  const [zoomOpen, setZoomOpen] = React.useState(false)
  const [librarySearch, setLibrarySearch] = React.useState('')
  const [isReady, setIsReady] = React.useState(false)
  const [zoom, setZoom] = React.useState(50)
  const [canvasTool, setCanvasTool] = React.useState<CanvasTool>('select')
  const [theme, setTheme] = React.useState<UiTheme>('dark')
  const [tabletOrientation, setTabletOrientation] = React.useState<ViewportOrientation>('portrait')
  const [mobileOrientation, setMobileOrientation] = React.useState<ViewportOrientation>('portrait')
  const [isPanning, setIsPanning] = React.useState(false)
  const [showRuler, setShowRuler] = React.useState(false)
  const [showGrid, setShowGrid] = React.useState(true)
  const [gridSize, setGridSize] = React.useState(20)
  const [gridMajorStep, setGridMajorStep] = React.useState(5)
  const [gridSettingsOpen, setGridSettingsOpen] = React.useState(false)
  const [canvasScroll, setCanvasScroll] = React.useState({ left: 0, top: 0 })
  const [openAsset, setOpenAsset] = React.useState<BuilderAssetTarget | null>(null)
  const [rulerOrigin, setRulerOrigin] = React.useState({ x: CANVAS_WORKSPACE_PAD, y: CANVAS_WORKSPACE_PAD })
  const [frameNaturalHeight, setFrameNaturalHeight] = React.useState(900)
  const [leftPanelWidth, setLeftPanelWidth] = React.useState(PANEL_LEFT_DEFAULT)
  const [rightPanelWidth, setRightPanelWidth] = React.useState(PANEL_RIGHT_DEFAULT)
  const [resizingPanel, setResizingPanel] = React.useState<'left' | 'right' | null>(null)
  const panStart = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const resizeStart = React.useRef({ x: 0, width: 0 })

  const insertRef = React.useRef<HTMLDivElement>(null)
  const newRef = React.useRef<HTMLDivElement>(null)
  const zoomMenuRef = React.useRef<HTMLDivElement>(null)
  const gridSettingsRef = React.useRef<HTMLDivElement>(null)
  const canvasScrollRef = React.useRef<HTMLDivElement>(null)
  const canvasPanRef = React.useRef<HTMLDivElement>(null)
  const canvasHostRef = React.useRef<HTMLElement>(null)
  const canvasFrameRef = React.useRef<HTMLDivElement>(null)
  const blockRefs = React.useRef<Record<string, HTMLElement | null>>({})
  const zoomLevelRef = React.useRef(zoom)
  const pinchStartRef = React.useRef({ distance: 0, zoom: zoom })

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

    return () => {
      cancelled = true
    }
  }, [])

  const libraryVariants = React.useMemo(() => listLibraryVariants(), [variantTick])

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
    if (!insertOpen && !newOpen && !zoomOpen && !gridSettingsOpen) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (insertOpen && insertRef.current && !insertRef.current.contains(target)) setInsertOpen(false)
      if (newOpen && newRef.current && !newRef.current.contains(target)) setNewOpen(false)
      if (zoomOpen && zoomMenuRef.current && !zoomMenuRef.current.contains(target)) setZoomOpen(false)
      if (gridSettingsOpen && gridSettingsRef.current && !gridSettingsRef.current.contains(target)) {
        setGridSettingsOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [insertOpen, newOpen, zoomOpen, gridSettingsOpen])

  const page = useStore(store, (state) => state.page)
  const activeId = useStore(store, (state) => state.selectedBlockId)
  const selectedElementId = useStore(store, (state) => state.selectedElementId)

  React.useEffect(() => {
    if (!initialSlug) return
    let cancelled = false

    void fetch(`/api/builder/pages/${encodeURIComponent(initialSlug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded) => {
        if (cancelled || !loaded) return
        store.getState().loadPage(loaded as BuilderPage)
        pageLoadedFromDiskRef.current = true
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [initialSlug, store])

  const pageJson = exportPageToJson(page)
  React.useEffect(() => {
    const slug = page.slug.trim()
    if (slug === '/' && !pageLoadedFromDiskRef.current) return

    const slugKey = slug.replace(/^\//, '') || 'home'
    const timer = window.setTimeout(() => {
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
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [pageJson, page.slug])

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

    const blockEl = firstBlockId ? blockRefs.current[firstBlockId] : null
    const measureEl =
      (blockEl?.querySelector('[data-randee-template]') as HTMLElement | null) ??
      blockEl ??
      canvasFrameRef.current

    if (!measureEl) return

    setRulerOrigin(measureElementContentOrigin(measureEl, scrollEl))
  }, [firstBlockId])

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

  const filteredVariants = libraryVariants.filter((item) => {
    const query = librarySearch.trim().toLowerCase()
    if (!query) return true
    return [item.group, item.name, item.template, item.description, item.type].join(' ').toLowerCase().includes(query)
  })

  const groupedVariants = filteredVariants.reduce<Record<string, LibraryVariant[]>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item]
    return acc
  }, {})

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
    if (openAsset || guideOpen) return

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
  }, [applyZoom, guideOpen, openAsset])

  React.useEffect(() => {
    const scrollEl = canvasScrollRef.current
    if (!scrollEl || !isReady) return

    const scale = zoom / 100
    const frameMinHeight = viewportSize.minHeight ?? 0
    const contentHeight = Math.max(frameNaturalHeight, frameMinHeight)
    const w = viewportSize.width * scale + CANVAS_WORKSPACE_PAD * 2
    const h = contentHeight * scale + CANVAS_WORKSPACE_PAD * 2

    requestAnimationFrame(() => {
      scrollEl.scrollLeft = Math.max(0, (w - scrollEl.clientWidth) / 2)
      scrollEl.scrollTop = Math.max(0, (h - scrollEl.clientHeight) / 2)
      setCanvasScroll({ left: scrollEl.scrollLeft, top: scrollEl.scrollTop })
    })
  }, [isReady, frameNaturalHeight, viewportSize.width, viewportSize.minHeight, zoom])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      if (!event.metaKey && !event.ctrlKey) {
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
      }

      if (!(event.metaKey || event.ctrlKey)) return
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
  }, [zoomIn, zoomOut, zoomTo100, zoomToFit, zoomToSelection])

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
    store.getState().selectBlock(targetBlock.id)
    store.getState().insertElement(targetBlock.id, variant.id, variant.defaultProps, variant.name)
    setInsertOpen(false)
    setComponentEditFocus('component')
  }

  const componentTargetBlock =
    block?.type === 'component' ? block : page.blocks.find((item) => item.type === 'component')
  const insertShowsElements = componentEditMode && Boolean(componentTargetBlock)
  const elementPreviewOptions = React.useMemo(
    () =>
      componentEditMode
        ? {
            selectedElementId,
            onSelectElement: (elementId: string) => {
              store.getState().selectElement(elementId)
              setComponentEditFocus('component')
            }
          }
        : undefined,
    [componentEditMode, selectedElementId, store]
  )

  function toggleComponentEditMode() {
    setComponentEditMode((value) => {
      const next = !value
      if (next) {
        setRightOpen(true)
        setComponentEditFocus('component')
        setInsertOpen(false)
        setNewOpen(false)
        setOpenAsset(null)
        const current = store.getState().selectedBlockId
        const selected = current ? page.blocks.find((item) => item.id === current) : undefined
        if (!selected) {
          const firstComponent = page.blocks.find((item) => item.type === 'component') ?? page.blocks[0]
          if (firstComponent) store.getState().selectBlock(firstComponent.id)
        }
      }
      return next
    })
  }

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

  const chromeBtnStyle = (active?: boolean): React.CSSProperties => ({
    display: 'flex',
    height: 32,
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    padding: '0 10px',
    fontSize: 12,
    fontWeight: 500,
    color: active ? t.text : t.textSecondary,
    background: active ? t.active : 'transparent',
    border: 'none',
    cursor: 'pointer'
  })

  const frameWidth = viewportSize.width
  const frameMinHeight = viewportSize.minHeight ?? 0
  const frameContentHeight = Math.max(frameNaturalHeight, frameMinHeight)
  const frameScale = zoom / 100
  const scaledFrameWidth = frameWidth * frameScale
  const scaledFrameHeight = frameContentHeight * frameScale
  const workspaceWidth = scaledFrameWidth + CANVAS_WORKSPACE_PAD * 2
  const workspaceHeight = scaledFrameHeight + CANVAS_WORKSPACE_PAD * 2

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
      <header
        className="relative z-20 flex h-11 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: `1px solid ${t.chromeBorder}`, background: t.bg }}
      >
        <div ref={insertRef} className="relative flex items-center gap-1">
          <button
            type="button"
            style={chromeBtnStyle(insertOpen)}
            onClick={() => {
              setInsertOpen((value) => !value)
              setNewOpen(false)
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Insert
          </button>
          <div ref={newRef} className="relative">
            <button
              type="button"
              style={chromeBtnStyle(newOpen)}
              onClick={() => {
                setNewOpen((value) => !value)
                setInsertOpen(false)
              }}
            >
              <SquarePlus className="h-3.5 w-3.5" />
              New
            </button>

            {newOpen ? (
              <div
                className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg p-1 shadow-xl"
                style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
              >
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  Create
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
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = t.hover
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = 'transparent'
                  }}
                  onClick={() => void createNewComponent()}
                >
                  <Component className="h-3.5 w-3.5 shrink-0" style={{ color: t.accent }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium" style={{ color: t.text }}>
                      Component
                    </span>
                    <span className="block text-[10px]" style={{ color: t.textMuted }}>
                      Empty block with style, script and preview
                    </span>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            style={chromeBtnStyle(componentEditMode)}
            onClick={toggleComponentEditMode}
            aria-pressed={componentEditMode}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Component
          </button>
          <button
            type="button"
            style={chromeBtnStyle(guideOpen)}
            onClick={() => {
              setGuideOpen((value) => {
                const next = !value
                if (next) {
                  setInsertOpen(false)
                  setNewOpen(false)
                  setOpenAsset(null)
                }
                return next
              })
            }}
            aria-pressed={guideOpen}
            title="Инструкция по Builder"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Инструкция
          </button>
          <button type="button" style={chromeBtnStyle()}>
            <Boxes className="h-3.5 w-3.5" />
            CMS
          </button>

          {insertOpen ? (
            <div
              className="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg p-2 shadow-xl"
              style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                {insertShowsElements ? 'UI Elements' : 'Page blocks'}
              </p>
              {insertShowsElements ? (
                <>
                  <p className="px-2 pb-1 text-[10px]" style={{ color: t.textSecondary }}>
                    В компонент: {componentTargetBlock?.name ?? componentTargetBlock?.template}
                  </p>
                  <BuilderElementPicker
                    searchQuery={librarySearch}
                    t={t}
                    onSelect={addElement}
                    maxHeightClassName="max-h-80"
                  />
                </>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                {filteredVariants.map((item) => (
                  <button
                    key={`${item.group}-${item.template}`}
                    type="button"
                    className="flex w-full flex-col rounded-md px-2 py-2 text-left"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = t.hover
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'transparent'
                    }}
                    onClick={() => addVariant(item)}
                  >
                    <span className="text-xs font-medium" style={{ color: t.text }}>
                      {item.name}
                    </span>
                    <span className="text-[10px]" style={{ color: t.textMuted }}>
                      {item.description}
                    </span>
                  </button>
                ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <span className="mx-2 h-4 w-px" style={{ background: t.divider }} />

        <span className="truncate text-xs font-medium">{page.page}</span>
        {pageSaveStatus !== 'idle' ? (
          <span className="text-[10px]" style={{ color: pageSaveStatus === 'error' ? '#ef4444' : t.textMuted }}>
            {pageSaveStatus === 'saving' ? 'Saving…' : pageSaveStatus === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5">
          <BuilderThemeToggle theme={theme} onThemeChange={setTheme} t={t} />
          <button type="button" style={chromeBtnStyle()} onClick={exportJson}>
            JSON
          </button>
          <button type="button" style={chromeBtnStyle()} onClick={exportHtml}>
            <Download className="h-3.5 w-3.5" />
            HTML
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white"
            style={{ background: t.accent, border: 'none', cursor: 'pointer' }}
            onClick={exportBitrix}
          >
            <Boxes className="h-3.5 w-3.5" />
            Export Bitrix
          </button>
        </div>
      </header>

      <BlockVendorProvider page={page}>
      <TemplateRevisionProvider revisions={templateRevisions}>
      <div className="flex min-h-0 flex-1">
        {leftOpen ? (
          <aside
            className="relative flex shrink-0 flex-col"
            style={{
              width: leftPanelWidth,
              borderRight: `1px solid ${t.chromeBorder}`,
              background: t.panel
            }}
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
            />
          </aside>
        ) : null}

        <section
          ref={canvasHostRef}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col"
          style={{ background: t.canvas, touchAction: guideOpen || openAsset ? 'auto' : 'manipulation' }}
        >
          {guideOpen ? (
            <div className="absolute inset-0 z-20 flex min-h-0 flex-col overflow-hidden">
              <BuilderInstructions t={t} onClose={() => setGuideOpen(false)} />
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
                New component <strong style={{ color: t.text }}>{pendingSaveTemplateId}</strong> is on the canvas.
                Save it to Assets to reuse and export to Bitrix.
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
                Save to Assets
              </button>
            </div>
          ) : null}
          <div
            className="flex h-9 shrink-0 items-center justify-between gap-2 px-3"
            style={{ borderBottom: `1px solid ${t.divider}`, background: t.panelElevated }}
          >
            <span className="shrink-0 text-[11px] font-medium" style={{ color: t.textSecondary }}>
              {viewportSize.label}
            </span>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
              <button
                type="button"
                className="flex h-6 items-center gap-1 rounded px-2 text-[10px] font-medium"
                style={{
                  background: showRuler ? `${t.accent}22` : t.inputBg,
                  color: showRuler ? t.accent : t.textMuted,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowRuler((value) => !value)}
                title="Ruler (R)"
              >
                <Ruler className="h-3 w-3" />
                Ruler
              </button>
              <button
                type="button"
                className="flex h-6 items-center gap-1 rounded px-2 text-[10px] font-medium"
                style={{
                  background: showGrid ? `${t.accent}22` : t.inputBg,
                  color: showGrid ? t.accent : t.textMuted,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowGrid((value) => !value)}
                title="Grid (G)"
              >
                <LayoutGrid className="h-3 w-3" />
                Grid
              </button>
              <div ref={gridSettingsRef} className="relative">
                <button
                  type="button"
                  className="flex h-6 items-center gap-1 rounded px-2 text-[10px]"
                  style={{
                    background: gridSettingsOpen ? t.active : t.inputBg,
                    color: t.textMuted,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setGridSettingsOpen((value) => !value)}
                  title="Grid settings"
                >
                  {gridSize}px
                  <ChevronDown className="h-3 w-3" />
                </button>
                {gridSettingsOpen ? (
                  <div
                    className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg p-2 shadow-xl"
                    style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                      Grid settings
                    </p>
                    <label className="mb-1 block text-[10px]" style={{ color: t.textSecondary }}>
                      Cell (px)
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
                      Major every
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
              <span className="mx-0.5 h-4 w-px shrink-0" style={{ background: t.divider }} />
              <BuilderViewportToolbar
                viewport={viewport}
                tabletOrientation={tabletOrientation}
                mobileOrientation={mobileOrientation}
                onViewportChange={(mode) => store.getState().setViewport(mode)}
                onRotate={rotateViewport}
                t={t}
                variant="canvas"
              />
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
                width: workspaceWidth,
                height: workspaceHeight,
                minWidth: '100%',
                minHeight: '100%'
              }}
            >
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
                            elementOptions={elementPreviewOptions}
                          />
                        </div>
                      </div>
                      <p className="mt-3 max-w-md text-center text-[10px]" style={{ color: t.textMuted }}>
                        Внутри — сам компонент (контент, layout, fill). По краю рамки — размер artboard.
                      </p>
                    </div>
                    ) : (
                      <div className="flex min-h-[320px] items-center justify-center px-6 text-center text-sm text-neutral-400">
                        Select a component block to edit its layout and styles.
                      </div>
                    )
                  ) : (
                    <>
                      {canvasBlocks.map((item) => (
                    <section
                      key={item.id}
                      ref={(el) => {
                        blockRefs.current[item.id] = el
                      }}
                      className="group relative"
                      style={{
                        outline: activeId === item.id ? `2px solid ${t.accent}` : 'none',
                        outlineOffset: -2,
                        boxShadow: activeId === item.id ? `inset 0 0 0 1px ${t.accent}55` : 'none'
                      }}
                      onClick={() => {
                        if (canvasTool === 'select') store.getState().selectBlock(item.id)
                      }}
                    >
                      {canvasTool === 'select' ? (
                        <div
                          className={`builder-block-toolbar absolute right-2 top-2 z-10 flex gap-1 transition ${activeId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        >
                          <button
                            type="button"
                            className="builder-touch-target flex h-11 w-11 items-center justify-center rounded bg-white text-neutral-700 shadow sm:h-7 sm:w-7"
                            aria-label="Edit block"
                            title="Edit"
                            onClick={(event) => {
                              event.stopPropagation()
                              store.getState().selectBlock(item.id)
                              setComponentEditMode(true)
                              setComponentEditFocus('component')
                              setRightOpen(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="builder-touch-target flex h-11 w-11 items-center justify-center rounded bg-white text-neutral-700 shadow sm:h-7 sm:w-7"
                            onClick={(event) => {
                              event.stopPropagation()
                              store.getState().duplicateBlock(item.id)
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="builder-touch-target flex h-11 w-11 items-center justify-center rounded bg-white text-red-600 shadow sm:h-7 sm:w-7"
                            onClick={(event) => {
                              event.stopPropagation()
                              store.getState().removeBlock(item.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                      <BlockPreview key={blockPreviewKey(item)} block={item} />
                    </section>
                  ))}
                      {canvasBlocks.length === 0 ? (
                        <div className="flex min-h-[320px] items-center justify-center text-sm text-neutral-400">
                          Add blocks from Assets
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
              </div>
            </div>
              </div>
            </div>
          </div>
          </div>

          <footer className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
            <div
              className="pointer-events-auto flex items-center gap-1 rounded-full px-2 py-1 shadow-lg"
              style={{
                background: t.toolbar,
                border: `1px solid ${t.toolbarBorder}`
              }}
            >
              <div
                className="flex items-center gap-0.5 rounded-lg p-0.5"
                style={{ background: t.inputBg }}
                role="toolbar"
                aria-label="Canvas tools"
              >
                <button
                  type="button"
                  className="builder-touch-target"
                  style={toolbarBtnStyle(canvasTool === 'select')}
                  onClick={() => setCanvasTool('select')}
                  aria-label="Select"
                  aria-pressed={canvasTool === 'select'}
                  title="Select (V)"
                >
                  <MousePointer2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="builder-touch-target"
                  style={toolbarBtnStyle(canvasTool === 'pan')}
                  onClick={() => setCanvasTool('pan')}
                  aria-label="Pan"
                  aria-pressed={canvasTool === 'pan'}
                  title="Pan (H)"
                >
                  <Hand className="h-4 w-4" />
                </button>
              </div>

              <span className="mx-1 h-5 w-px" style={{ background: t.divider }} />

              <div ref={zoomMenuRef} className="relative">
                <button
                  type="button"
                  className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium"
                  style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onClick={() => setZoomOpen((value) => !value)}
                >
                  {Math.round(zoom)}%
                  <ChevronDown className="h-3.5 w-3.5" style={{ color: t.textMuted }} />
                </button>

                {zoomOpen ? (
                  <div
                    className="absolute bottom-full left-1/2 mb-2 min-w-[200px] -translate-x-1/2 rounded-lg py-1 shadow-xl"
                    style={{ background: t.menu, border: `1px solid ${t.menuBorder}` }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
                      style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        zoomIn()
                        setZoomOpen(false)
                      }}
                    >
                      Zoom In
                      <span style={{ color: t.textMuted }}>⌘ +</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
                      style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        zoomOut()
                        setZoomOpen(false)
                      }}
                    >
                      Zoom Out
                      <span style={{ color: t.textMuted }}>⌘ −</span>
                    </button>
                    <div className="my-1 h-px" style={{ background: t.divider }} />
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
                      style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        zoomTo100()
                        setZoomOpen(false)
                      }}
                    >
                      Zoom to 100%
                      <span style={{ color: t.textMuted }}>⌘ 0</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
                      style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        zoomToFit()
                        setZoomOpen(false)
                      }}
                    >
                      Zoom to Fit
                      <span style={{ color: t.textMuted }}>⌘ 1</span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs"
                      style={{ color: t.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        zoomToSelection()
                        setZoomOpen(false)
                      }}
                    >
                      Zoom to Selection
                      <span style={{ color: t.textMuted }}>⌘ 2</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </footer>
            </>
          )}
        </section>

        {rightOpen ? (
          <aside
            className="relative flex shrink-0 flex-col overflow-hidden"
            style={{
              width: rightPanelWidth,
              borderLeft: `1px solid ${t.chromeBorder}`,
              background: t.panel
            }}
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
                selectedElementId={selectedElementId}
                onClose={() => setRightOpen(false)}
              />
            ) : (
              <>
            <p className="flex items-center justify-between px-3 py-2 text-xs font-semibold" style={{ borderBottom: `1px solid ${t.divider}` }}>
              Properties
              <button
                type="button"
                data-testid="hide-inspector-panel"
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{ color: t.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => setRightOpen(false)}
              >
                <PanelRightClose className="h-3.5 w-3.5" />
                <span className="sr-only">Hide Inspector</span>
              </button>
            </p>

            <div className="grid gap-3 p-3">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  Page
                </p>
                <label className="mb-1 block text-[10px]" style={{ color: t.textSecondary }}>
                  Name
                </label>
                <input
                  style={inputStyle}
                  value={page.page}
                  onChange={(event) => store.getState().setPageMeta({ page: event.target.value, slug: page.slug })}
                />
                <label className="mb-1 mt-2 block text-[10px]" style={{ color: t.textSecondary }}>
                  Slug
                </label>
                <input
                  style={inputStyle}
                  value={page.slug}
                  onChange={(event) => store.getState().setPageMeta({ page: page.page, slug: event.target.value })}
                />
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  Breakpoint
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
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  {block ? `${block.type} block` : 'Block'}
                </p>
                {block ? (
                  <BlockPropsFields
                    block={block}
                    store={store}
                    inputStyle={inputStyle}
                    labelColor={t.textSecondary}
                  />
                ) : (
                  <p className="text-xs" style={{ color: t.textMuted }}>
                    Select a block on the canvas.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                  SEO
                </p>
                <label className="mb-1 block text-[10px]" style={{ color: t.textSecondary }}>
                  Title
                </label>
                <input
                  style={inputStyle}
                  value={page.seo.title}
                  onChange={(event) => store.getState().setSeoMeta({ title: event.target.value })}
                />
                <label className="mb-1 mt-2 block text-[10px]" style={{ color: t.textSecondary }}>
                  Description
                </label>
                <textarea
                  className="min-h-16 resize-none py-2"
                  style={{ ...inputStyle, height: 'auto' }}
                  value={page.seo.description}
                  onChange={(event) => store.getState().setSeoMeta({ description: event.target.value })}
                />
              </div>

              <details
                className="rounded-md"
                style={{ background: t.inputBg, border: `1px solid ${t.divider}` }}
              >
                <summary className="cursor-pointer px-2 py-2 text-xs font-medium" style={{ color: t.textSecondary }}>
                  Advanced JSON
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
              </>
            )}
          </aside>
        ) : null}
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
    </main>
  )
}
