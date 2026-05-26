import type { BuilderCmsConnection } from '@randee/builder'

export function buildConnectorUrl(connection: BuilderCmsConnection, action: string): URL {
  const baseUrl = connection.siteUrl.trim().replace(/\/+$/, '')
  const path = connection.connectorPath.trim()
  const key = connection.apiKey.trim()
  const url = new URL(path, `${baseUrl}/`)
  url.searchParams.set('action', action)
  url.searchParams.set('api_key', key)
  url.searchParams.set('format', 'json')
  return url
}

export function isCmsConnectionConfigured(connection: BuilderCmsConnection): boolean {
  return Boolean(
    connection.siteUrl.trim() &&
      connection.connectorPath.trim() &&
      connection.apiKey.trim()
  )
}
