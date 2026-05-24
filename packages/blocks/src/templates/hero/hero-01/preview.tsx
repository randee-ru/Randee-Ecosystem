'use client'

import * as React from 'react'
import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { getTemplateAssetUrl } from '../../../utils/asset-url'
import { init } from './init'
import './style.css'

export function Hero01Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? 'Новый Hero блок'
  const description = block.props.description ?? 'Добавьте описание'
  const buttonText = block.props.buttonText ?? 'Подробнее'

  return (
    <TemplateFrame block={block} className="randee-hero-01" initScript={init}>
      <img
        className="randee-hero-01__accent"
        src={getTemplateAssetUrl(block.template, 'images/accent.svg')}
        alt=""
        aria-hidden="true"
      />
      <p className="randee-hero-01__label">{block.template}</p>
      <p>test</p>
      <h1 className="randee-hero-01__title">{title}</h1>
      <p className="randee-hero-01__description">{description}</p>
      <button type="button" className="randee-hero-01__button">
        {buttonText}
      </button>
    </TemplateFrame>
  )
}
