'use client'

import * as React from 'react'
import type { BlockTemplatePreviewProps } from '../types'
import { getTemplateAssetUrl } from '../utils/asset-url'
import { TemplateFrame } from './template-frame'

function genericInit(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')
}

function useTemplateStylesheet(templateId: string) {
  React.useEffect(() => {
    const href = getTemplateAssetUrl(templateId, 'style.css')
    const selector = `link[data-randee-template-styles="${templateId}"]`
    if (document.querySelector(selector)) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-randee-template-styles', templateId)
    document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [templateId])
}

export function GenericComponentPreview({ block }: BlockTemplatePreviewProps) {
  const cls = `randee-${block.template.replace(/\./g, '-')}`
  const title = block.props.title ?? block.name ?? 'Component'

  useTemplateStylesheet(block.template)

  return (
    <TemplateFrame block={block} className={cls} initScript={genericInit}>
      <img
        src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
      />
      <h2 className={`${cls}__title`}>{title}</h2>
      <p className={`${cls}__hint`}>Edit preview.tsx, style.css and script.js in Layers</p>
    </TemplateFrame>
  )
}
