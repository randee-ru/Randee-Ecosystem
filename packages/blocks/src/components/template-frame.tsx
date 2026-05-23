'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'

type TemplateFrameProps = {
  block: PageBlock
  className: string
  initScript: (root: HTMLElement | null) => void | Promise<void>
  children: React.ReactNode
}

export function TemplateFrame({ block, className, initScript, children }: TemplateFrameProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    void initScript(rootRef.current)
  }, [block.id, block.template, initScript])

  return (
    <div ref={rootRef} className={className} data-randee-template={block.template} data-randee-type={block.type}>
      {children}
    </div>
  )
}
