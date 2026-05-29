'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { GeneratedLayout } from './layout.generated'
import './style.css'

export function Component09Preview({ block }: BlockTemplatePreviewProps) {
  const p = block.props as Record<string, string>

  return (
    <TemplateFrame block={block} className="randee-component-09" initScript={init}>
      <GeneratedLayout
        logoSrc={p.logoSrc}
        logoAlt={p.logoAlt}
        logoHref={p.logoHref}
        description={p.description}
        buttonText={p.buttonText}
        buttonUrl={p.buttonUrl}
        phone={p.phone}
        phoneHref={p.phoneHref}
        telegramUrl={p.telegramUrl}
        whatsappUrl={p.whatsappUrl}
        containerWidth={p.containerWidth}
        theme={p.theme as 'dark' | 'light' | undefined}
      />
    </TemplateFrame>
  )
}
