'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { GeneratedLayout } from './layout.generated'
import './style.css'

export function Nav02Preview({ block }: BlockTemplatePreviewProps) {
  const p = block.props as Record<string, string>

  return (
    <TemplateFrame block={block} className="randee-nav-02" initScript={init}>
      <GeneratedLayout
        phone={p.phone}
        phoneHref={p.phoneHref}
        email={p.email}
        emailHref={p.emailHref}
        description={p.description}
        briefUrl={p.briefUrl}
        containerWidth={p.containerWidth}
      />
    </TemplateFrame>
  )
}
