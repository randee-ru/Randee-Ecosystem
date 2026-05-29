import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'nav-02',
  type: 'nav',
  group: 'Popups',
  name: 'Мега-меню',
  description: 'Полноэкранное overlay-меню. Открывается кнопкой МЕНЮ из шапки (data-menu-overlay-trigger).',
  savedToAssets: true,
  defaultProps: {
    phone:        '+7 999 801‑02-77',
    phoneHref:    'tel:+79998010277',
    email:        'info@randee.ru',
    emailHref:    'mailto:info@randee.ru',
    description:  'Randee — digital-студия: стратегии превращаем в измеримый результат для брендов.',
    briefUrl:     '#',
    containerWidth: '1464',
  },
  propsSchema: [
    { name: 'phone',          label: 'Телефон (отображение)',  type: 'text' },
    { name: 'phoneHref',      label: 'Телефон (href)',         type: 'text' },
    { name: 'email',          label: 'Email (отображение)',    type: 'text' },
    { name: 'emailHref',      label: 'Email (href)',           type: 'text' },
    { name: 'description',    label: 'Описание компании',      type: 'text' },
    { name: 'briefUrl',       label: 'Ссылка «Скачать бриф»', type: 'text' },
    {
      name: 'containerWidth',
      label: 'Ширина контейнера',
      type: 'select',
      options: ['1296', '1464', '1696', 'full'],
    },
  ],
}

export const assets = {
  stylePath:  'style.css',
  scriptPath: 'script.js',
  images:     ['images/thumb.svg'],
} as const
