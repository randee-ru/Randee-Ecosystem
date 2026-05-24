'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import { collectTemplateVendors } from '../vendors/collect'
import { useBlockVendors } from './block-vendor-provider'

type TemplateFrameProps = {
  block: PageBlock
  className: string
  initScript: (root: HTMLElement | null) => void | Promise<void>
  children: React.ReactNode
}

export function TemplateFrame({ block, className, initScript, children }: TemplateFrameProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const { waitForVendors } = useBlockVendors()
  const dependencies = React.useMemo(() => collectTemplateVendors(block.template), [block.template])

  const dependencyKey = dependencies.join(',')

  React.useEffect(() => {
    let cancelled = false

    void waitForVendors(dependencies).then(() => {
      if (!cancelled) void initScript(rootRef.current)
    })

    return () => {
      cancelled = true
    }
  }, [block.id, block.template, initScript, dependencyKey, waitForVendors])

  return (
    <div ref={rootRef} className={className} data-randee-template={block.template} data-randee-type={block.type}>
      {children}
    </div>
  )
}
