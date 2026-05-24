'use client'

import * as React from 'react'
import type { BlockTemplatePreviewProps } from '../types'
import { getTemplateAssetUrl } from '../utils/asset-url'
import { useTemplateRevision } from '../template-revision-context'
import { TemplateFrame } from './template-frame'
import { ElementTreePreview } from './element-preview'

function genericInit(root: HTMLElement | null): void {
  if (!root) return
  root.classList.add('is-mounted')
}

function useTemplateStylesheet(templateId: string, revision: number) {
  React.useEffect(() => {
    const href = `${getTemplateAssetUrl(templateId, 'style.css')}?v=${revision}`
    const selector = `link[data-randee-template-styles="${templateId}"]`
    document.querySelector(selector)?.remove()

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-randee-template-styles', templateId)
    document.head.appendChild(link)

    return () => {
      link.remove()
    }
  }, [templateId, revision])
}

export type GenericComponentPreviewProps = BlockTemplatePreviewProps & {
  elementOptions?: {
    selectedElementId?: string | null
    onSelectElement?: (elementId: string) => void
  }
}

export function GenericComponentPreview({ block, elementOptions }: GenericComponentPreviewProps) {
  const cls = `randee-${block.template.replace(/\./g, '-')}`
  const title = block.props.title ?? block.name ?? 'Component'
  const revision = useTemplateRevision(block.template)
  const hasElements = (block.elements?.length ?? 0) > 0

  useTemplateStylesheet(block.template, revision)

  return (
    <TemplateFrame block={block} className={cls} initScript={genericInit}>
      {hasElements ? (
        <ElementTreePreview elements={block.elements ?? []} options={elementOptions} />
      ) : (
        <>
          <img
            src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
            alt=""
            aria-hidden="true"
            width={80}
            height={80}
          />
          <h2 className={`${cls}__title`}>{title}</h2>
          <p className={`${cls}__hint`}>Insert UI elements via Insert, or edit preview.tsx in Blocks</p>
        </>
      )}
    </TemplateFrame>
  )
}
