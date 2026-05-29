'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { GeneratedLayout } from './layout.generated'
import './style.css'

export function Component10Preview({ block }: BlockTemplatePreviewProps) {
  return (
    <TemplateFrame block={block} className="randee-component-10" initScript={init}>
      <GeneratedLayout />
    </TemplateFrame>
  )
}
