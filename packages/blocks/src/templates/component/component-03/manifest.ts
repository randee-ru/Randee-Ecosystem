import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'component-03',
  type: 'component',
  group: 'Custom',
  name: 'CMS Slider (Swiper)',
  description: 'Slider from Bitrix infoblock (preview picture + title + preview text)',
  savedToAssets: true,
  dependencies: ['swiper'],
  defaultProps: {
    title: 'Анонсы',
    cmsIblockId: '',
    cmsLimit: '8',
    cmsAutoplayMs: '3500',
    cmsShowText: 'true',
    cmsImageField: 'previewPicture',
    cmsReloadKey: '0'
  },
  propsSchema: [
    { name: 'title', label: 'Заголовок блока', type: 'text' },
    { name: 'cmsIblockId', label: 'Iblock ID (источник слайдов)', type: 'text' },
    { name: 'cmsLimit', label: 'Количество слайдов', type: 'number' },
    { name: 'cmsAutoplayMs', label: 'Autoplay (мс)', type: 'number' },
    { name: 'cmsShowText', label: 'Показывать анонс', type: 'boolean' },
    {
      name: 'cmsImageField',
      label: 'Поле картинки',
      type: 'select',
      options: ['previewPicture', 'detailPicture']
    }
  ]
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: ['images/thumb.svg']
} as const
