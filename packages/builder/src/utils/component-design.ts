import type { ComponentDesignSettings } from '../types/component-design'
import { DEFAULT_COMPONENT_DESIGN } from '../types/component-design'

export type ComponentDesignPatch = Omit<
  Partial<ComponentDesignSettings>,
  'position' | 'size' | 'layout' | 'typography'
> & {
  position?: Partial<ComponentDesignSettings['position']>
  size?: Partial<ComponentDesignSettings['size']>
  layout?: Partial<ComponentDesignSettings['layout']>
  typography?: Partial<ComponentDesignSettings['typography']>
}

export function resolveComponentDesign(design?: ComponentDesignSettings): ComponentDesignSettings {
  if (!design) return { ...DEFAULT_COMPONENT_DESIGN }

  return {
    position: { ...DEFAULT_COMPONENT_DESIGN.position, ...design.position },
    size: { ...DEFAULT_COMPONENT_DESIGN.size, ...design.size },
    layout: { ...DEFAULT_COMPONENT_DESIGN.layout, ...design.layout },
    typography: { ...DEFAULT_COMPONENT_DESIGN.typography, ...design.typography },
    fill: design.fill ?? DEFAULT_COMPONENT_DESIGN.fill
  }
}

export function mergeComponentDesign(
  current: ComponentDesignSettings | undefined,
  patch: ComponentDesignPatch
): ComponentDesignSettings {
  const base = resolveComponentDesign(current)
  return {
    position: { ...base.position, ...patch.position },
    size: { ...base.size, ...patch.size },
    layout: { ...base.layout, ...patch.layout },
    typography: { ...base.typography, ...patch.typography },
    fill: patch.fill ?? base.fill
  }
}
