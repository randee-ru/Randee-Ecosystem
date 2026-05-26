'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { init } from './init'
import './style.css'

export function Component03Preview({ block }: BlockTemplatePreviewProps) {
  const title = block.props.title ?? 'Анонсы'
  const cmsIblockId = block.props.cmsIblockId ?? ''
  const cmsLimit = block.props.cmsLimit ?? '8'
  const cmsAutoplayMs = block.props.cmsAutoplayMs ?? '3500'
  const cmsShowText = block.props.cmsShowText ?? 'true'
  const cmsImageField = block.props.cmsImageField ?? 'previewPicture'
  const cmsReloadKey = block.props.cmsReloadKey ?? '0'

  return (
    <TemplateFrame
      key={cmsReloadKey}
      block={block}
      className="randee-component-03"
      initScript={init}
    >
      <div
        className="randee-component-03__root"
        data-cms-iblock-id={cmsIblockId}
        data-cms-limit={cmsLimit}
        data-cms-autoplay-ms={cmsAutoplayMs}
        data-cms-show-text={cmsShowText}
        data-cms-image-field={cmsImageField}
      >
        <div className="randee-component-03__head">
          <h2 className="randee-component-03__title">{title}</h2>
          <p className="randee-component-03__status" data-role="status">
            Загрузка данных инфоблока...
          </p>
        </div>
        <div className="swiper randee-component-03__swiper" data-role="swiper">
          <div className="swiper-wrapper" data-role="slides" />
          <div className="swiper-pagination" />
          <div className="swiper-button-prev" />
          <div className="swiper-button-next" />
        </div>
      </div>
    </TemplateFrame>
  )
}
