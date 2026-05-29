'use client'

import type { BlockTemplatePreviewProps } from '../../../types'
import { TemplateFrame } from '../../../components/template-frame'
import { useBitrixElements } from '../../../hooks/use-bitrix-elements'
import { init } from './init'
import { GeneratedLayout, type SlideItem } from './layout.generated'
import 'swiper/css/bundle'
import './style.css'

// Вытащить URL из значения свойства Bitrix
// Форматы: строка, { src }, { path } (тип «Видео» в Bitrix), массив
function toUrl(v: unknown): string {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return toUrl(v[0])
  const o = v as Record<string, unknown>
  return typeof o.src  === 'string' ? o.src  :
         typeof o.path === 'string' ? o.path : ''
}

export function Component08Preview({ block, elementOptions }: BlockTemplatePreviewProps) {
  const p = block.props as Record<string, string>

  const elements = useBitrixElements(p.iblockId, elementOptions?.cmsConnection)

  // Ручные элементы из builder (приоритет)
  const manual: SlideItem[] = (block.elements ?? []).map(el => {
    const r = elementOptions?.cmsPreviewValues?.[el.id] ?? {}
    return { videoSrc: r.videoSrc ?? el.props.videoSrc ?? '', imageSrc: r.imageSrc ?? el.props.imageSrc ?? '', title: r.title ?? el.props.title ?? '', span: Number(el.props.span || 1) || 1 }
  })

  // CMS элементы → SlideItem
  const cmsItems: SlideItem[] | undefined = elements?.map(el => {
    const prop = (code: string) => toUrl(el.properties[code]?.value)
    const autoProp = Object.entries(el.properties).find(([c]) => /video|mp4/i.test(c))
    const videoSrc = prop(p.videoField) || (autoProp ? toUrl(autoProp[1].value) : '')
    const imageSrc = prop(p.imageField) || toUrl(el.previewPicture) || toUrl(el.detailPicture) || ''

    // Ширина слайда из свойства SIZE (1–4). 4 = на всю ширину.
    const sizeCode = p.sizeField || 'SIZE'
    const sizeRaw = el.properties[sizeCode]?.value ?? el.properties[sizeCode.toLowerCase()]?.value
    const span = Math.min(4, Math.max(1, Number(sizeRaw) || 1))

    return { videoSrc, imageSrc, title: el.name, span }
  })

  const items = manual.length > 0 ? manual : (cmsItems?.length ? cmsItems : undefined)
  return (
    <TemplateFrame block={block} className="randee-component-08" initScript={init}>
      <GeneratedLayout items={items} containerWidth={p.containerWidth} />
    </TemplateFrame>
  )
}
