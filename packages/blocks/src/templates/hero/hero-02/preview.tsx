'use client'

import * as React from 'react'
import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { getTemplateAssetUrl } from '../../../utils/asset-url'
import './style.css'

export function Hero02Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? block.type
  const description = block.props.description ?? block.template

  return (
    <TemplateFrame block={block} className="randee-hero-02" initScript={init}>
      <img
        className="randee-hero-02__thumb"
        src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
      />
      <p className="randee-hero-02__label">{block.template}</p>
      <h2 className="randee-hero-02__title">{title}</h2>
      <p className="randee-hero-02__body">{description}</p>
    </TemplateFrame>
  )
}
