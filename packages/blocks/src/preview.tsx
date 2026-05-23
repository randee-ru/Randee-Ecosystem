'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import { getBlockTemplate } from './registry'

type BlockPreviewProps = {
  block: PageBlock
}

export function BlockPreview({ block }: BlockPreviewProps) {
  const entry = getBlockTemplate(block.template)

  if (!entry) {
    return (
      <section className="border-b border-neutral-100 px-10 py-10 text-neutral-900">
        <p className="font-semibold capitalize">{block.type}</p>
        <p className="mt-1 text-sm text-neutral-500">{block.template}</p>
      </section>
    )
  }

  const Preview = entry.Preview
  return <Preview block={block} />
}
