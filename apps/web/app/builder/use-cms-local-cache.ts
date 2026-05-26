'use client'

import * as React from 'react'

export type CmsSchemaField = { kind: string; code: string; label: string }
export type CmsIblock = { id: string; name: string; code: string }
export type CmsElement = { id: string; name: string }

export function useCmsLocalCache() {
  const [iblockId, setIblockId] = React.useState('')
  const [siteUrl, setSiteUrl] = React.useState('')
  const [iblocks, setIblocks] = React.useState<CmsIblock[]>([])
  const [schemaByIblockId, setSchemaByIblockId] = React.useState<Record<string, CmsSchemaField[]>>({})
  const [elementsByIblockId, setElementsByIblockId] = React.useState<Record<string, CmsElement[]>>({})

  const reload = React.useCallback(() => {
    setIblockId(window.localStorage.getItem('randee-cms-selected-iblock-id') ?? '')
    setSiteUrl(window.localStorage.getItem('randee-cms-site-url') ?? '')
    try {
      const iblocksRaw = window.localStorage.getItem('randee-cms-iblocks')
      if (iblocksRaw) {
        const parsed = JSON.parse(iblocksRaw) as Array<{ id?: string; name?: string; code?: string }>
        setIblocks(
          parsed.map((item) => ({
            id: item.id ?? '',
            name: item.name ?? '',
            code: item.code ?? ''
          }))
        )
      }
      const schemaRaw = window.localStorage.getItem('randee-cms-schema-by-iblock-id')
      if (schemaRaw) {
        setSchemaByIblockId(JSON.parse(schemaRaw) as Record<string, CmsSchemaField[]>)
      }
      const elementsRaw = window.localStorage.getItem('randee-cms-elements-by-iblock-id')
      if (elementsRaw) {
        setElementsByIblockId(JSON.parse(elementsRaw) as Record<string, CmsElement[]>)
      }
    } catch {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    reload()
    const onCache = () => reload()
    window.addEventListener('storage', onCache)
    window.addEventListener('randee:cms-cache-updated', onCache)
    return () => {
      window.removeEventListener('storage', onCache)
      window.removeEventListener('randee:cms-cache-updated', onCache)
    }
  }, [reload])

  const schema = iblockId ? (schemaByIblockId[iblockId] ?? []) : []
  const elements = iblockId ? (elementsByIblockId[iblockId] ?? []) : []
  const selectedIblock = iblocks.find((item) => item.id === iblockId)

  return {
    iblockId,
    siteUrl,
    iblocks,
    selectedIblock,
    schema,
    elements,
    elementsByIblockId,
    schemaByIblockId,
    reload
  }
}

export function formatIblockLabel(iblock: CmsIblock | undefined, id: string): string {
  if (!id) return 'не выбран'
  if (!iblock) return `ID ${id}`
  const code = iblock.code ? ` · ${iblock.code}` : ''
  return `${iblock.name} (ID ${iblock.id}${code})`
}
