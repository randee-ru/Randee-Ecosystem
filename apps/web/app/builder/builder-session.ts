export type BuilderCanvasTool = 'select' | 'pan'
export type BuilderLeftTab = 'pages' | 'blocks' | 'assets'
export type BuilderViewportOrientation = 'portrait' | 'landscape'

export type BuilderSessionState = {
  canvasTool: BuilderCanvasTool
  leftTab: BuilderLeftTab
  tabletOrientation: BuilderViewportOrientation
  mobileOrientation: BuilderViewportOrientation
  showRuler: boolean
  showGrid: boolean
  gridSize: number
  gridMajorStep: number
  leftPanelWidth: number
  rightPanelWidth: number
  leftOpen: boolean
  rightOpen: boolean
}

const SESSION_KEY = 'randee-builder-session'

export function loadBuilderSession(): Partial<BuilderSessionState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Partial<BuilderSessionState>
  } catch {
    return {}
  }
}

export function saveBuilderSession(patch: Partial<BuilderSessionState>) {
  if (typeof window === 'undefined') return
  const next = { ...loadBuilderSession(), ...patch }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
}

export function isCanvasTool(value: unknown): value is BuilderCanvasTool {
  return value === 'select' || value === 'pan'
}

export function isViewportOrientation(value: unknown): value is BuilderViewportOrientation {
  return value === 'portrait' || value === 'landscape'
}
