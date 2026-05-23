'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import { getTemplateAssetUrl } from '../../../utils/asset-url'
import './style.css'

export function News01Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? 'Новости'

  return (
    <TemplateFrame block={block} className="randee-news-01" initScript={init}>
      <img
        className="randee-news-01__thumb"
        src={getTemplateAssetUrl(block.template, 'images/thumb.svg')}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
      />
      <p className="randee-news-01__label">{block.template}</p>
      <h2 className="randee-news-01__title">{title}</h2>
      <p className="randee-news-01__meta">Bitrix component · news.list</p>
    </TemplateFrame>
  )
}
