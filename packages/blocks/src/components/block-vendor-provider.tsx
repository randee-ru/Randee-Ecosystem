'use client'

import * as React from 'react'
import { collectPageVendors } from '../vendors/collect'
import { loadVendors } from '../vendors/load-client'
import type { VendorId } from '../vendors/registry'
import type { BuilderPage } from '@randee/builder'

type VendorContextValue = {
  ready: boolean
  vendorIds: VendorId[]
  waitForVendors: (ids: VendorId[]) => Promise<void>
}

const VendorContext = React.createContext<VendorContextValue>({
  ready: true,
  vendorIds: [],
  waitForVendors: async () => undefined
})

export function useBlockVendors() {
  return React.useContext(VendorContext)
}

type BlockVendorProviderProps = {
  page: BuilderPage
  children: React.ReactNode
}

export function BlockVendorProvider({ page, children }: BlockVendorProviderProps) {
  const vendorIds = React.useMemo(() => collectPageVendors(page), [page])
  const vendorKey = vendorIds.join(',')
  const [ready, setReady] = React.useState(vendorIds.length === 0)

  React.useEffect(() => {
    if (vendorIds.length === 0) {
      setReady(true)
      return
    }

    let cancelled = false
    setReady(false)

    loadVendors(vendorIds)
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((error) => {
        console.error('[randee] Failed to load block vendors', error)
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [vendorKey])

  const waitForVendors = React.useCallback(async (ids: VendorId[]) => {
    const missing = ids.filter((id) => vendorIds.includes(id))
    if (missing.length === 0) return
    await loadVendors(missing)
  }, [vendorIds])

  const value = React.useMemo(
    () => ({ ready, vendorIds, waitForVendors }),
    [ready, vendorIds, waitForVendors]
  )

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
}
