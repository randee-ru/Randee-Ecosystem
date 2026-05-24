export interface ComponentElement {
  id: string
  /** Catalog id, e.g. `button`, `modal` */
  elementId: string
  name?: string
  props: Record<string, string>
}

export type ElementVariant = {
  id: string
  name: string
  group: string
  description: string
  defaultProps: Record<string, string>
  /** When true, preview uses @randee/ui implementation */
  ready: boolean
}
