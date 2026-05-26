export type CmsProvider = 'bitrix'

export type CmsEntityMode = 'element' | 'list' | 'section'

export type CmsFieldKind = 'field' | 'property'

export interface CmsSortRule {
  by: string
  order: 'asc' | 'desc'
}

export interface CmsListQuery {
  limit?: number
  offset?: number
  sort?: CmsSortRule
  filter?: Record<string, string | number | boolean>
}

export interface CmsFieldRef {
  kind: CmsFieldKind
  code: string
}

export interface CmsBindingSource {
  provider: CmsProvider
  siteUrl: string
  iblockId: string
  mode: CmsEntityMode
  elementId?: string
  sectionId?: string
  query?: CmsListQuery
}

export interface CmsPropBinding {
  source: CmsBindingSource
  field: CmsFieldRef
  fallback?: string
}

export interface CmsPropBindingState {
  mode: 'static' | 'binding'
  staticValue?: string
  binding?: CmsPropBinding
}

export interface CmsBlockBindings {
  version: 1
  props: Record<string, CmsPropBindingState>
}

export interface BuilderCmsConnection {
  provider: CmsProvider
  siteUrl: string
  connectorPath: string
  apiKey: string
  enabled: boolean
  allowInsecureTls?: boolean
  updatedAt?: string
}
