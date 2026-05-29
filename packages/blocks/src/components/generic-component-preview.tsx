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
    onDeleteElement?: (elementId: string) => void
    onDropElement?: (
      catalogElementId: string,
      placement?: { parentId?: string | null; afterElementId?: string | null; beforeElementId?: string | null }
    ) => void
    onPatchElementProps?: (elementId: string, props: Record<string, string>) => void
  }
}

export function GenericComponentPreview({ block, elementOptions }: GenericComponentPreviewProps) {
  const cls = `randee-${block.template.replace(/\./g, '-')}`
  const title = block.props.title ?? block.name ?? 'Component'
  const revision = useTemplateRevision(block.template)

  useTemplateStylesheet(block.template, revision)

  const isEmpty = (block.elements?.length ?? 0) === 0
  const isEditMode = !!elementOptions?.onDropElement

  return (
    <TemplateFrame block={block} className={cls} initScript={genericInit}>
      <ElementTreePreview elements={block.elements ?? []} options={elementOptions} />
      {isEmpty && !isEditMode ? (
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
      ) : null}
      {isEmpty && isEditMode ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '48px 24px',
          minHeight: '200px',
          border: '2px dashed rgba(255,255,255,0.2)',
          borderRadius: '12px',
          margin: '24px',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'system-ui, sans-serif',
          pointerEvents: 'none',
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="38" height="38" rx="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
            <line x1="20" y1="12" x2="20" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="12" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>
              Компонент пустой
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
              Откройте панель <strong style={{ color: 'rgba(255,255,255,0.75)' }}>Вставка</strong> слева<br/>
              и перетащите сюда заголовок, текст, кнопку или картинку
            </div>
          </div>
        </div>
      ) : null}
    </TemplateFrame>
  )
}
