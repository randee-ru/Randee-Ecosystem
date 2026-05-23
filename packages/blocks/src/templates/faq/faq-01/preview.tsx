'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { getTemplateAssetUrl } from '../../../utils/asset-url'
import './style.css'

export function Faq01Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? block.type
  const description = block.props.description ?? block.template

  return (
    <TemplateFrame block={block} className="randee-faq-01" initScript={init}>
      <img
        className="randee-faq-01__thumb"
        src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
      />
      <p className="randee-faq-01__label">{block.template}</p>
      <h2 className="randee-faq-01__title">{title}</h2>
      <p className="randee-faq-01__body">{description}</p>
      <ul className="randee-faq-01__list">
        {['Как блок попадет в Bitrix?', 'Где редактировать props?'].map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
    </TemplateFrame>
  )
}
