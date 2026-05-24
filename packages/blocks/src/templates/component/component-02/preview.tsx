'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { getTemplateAssetUrl } from '../../../utils/asset-url'
import './style.css'

export function Component02Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? 'Component 02'

  return (
    <TemplateFrame block={block} className="randee-component-02" initScript={init}>
      <img
        src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
      />
      <h2 className="randee-component-02__title">{title}</h2>
      <p className="randee-component-02__hint">Edit preview.tsx, style.css and script.js in Blocks</p>
    </TemplateFrame>
  )
}
