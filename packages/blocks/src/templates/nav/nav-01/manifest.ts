import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'nav-01',
  type: 'nav',
  group: 'Navigation',
  name: 'Header Classic',
  description: 'Шапка: логотип, описание, кнопка, соцсети, телефон, кнопка-меню МЕНЮ',
  savedToAssets: true,
  defaultProps: {
    logoSrc:      '',
    logoAlt:      'Логотип',
    logoHref:     '/',
    description:  'Randee — digital-студия, создающая маркетинг и рост брендов по всему миру.',
    buttonText:   'Личный кабинет',
    buttonUrl:    '#',
    phone:        '+7 999 801‑02-77',
    phoneHref:    'tel:+79998010277',
    telegramUrl:  '#',
    whatsappUrl:  '#',
    containerWidth: '1464',
  },
  propsSchema: [
    { name: 'logoSrc',        label: 'URL логотипа (SVG/PNG)',          type: 'text' },
    { name: 'logoAlt',        label: 'Alt логотипа',                    type: 'text' },
    { name: 'logoHref',       label: 'Ссылка логотипа',                 type: 'text' },
    { name: 'description',    label: 'Описание (под логотипом)',        type: 'text' },
    { name: 'buttonText',     label: 'Текст кнопки',                    type: 'text' },
    { name: 'buttonUrl',      label: 'URL кнопки',                      type: 'text' },
    { name: 'phone',          label: 'Телефон (отображение)',           type: 'text' },
    { name: 'phoneHref',      label: 'Телефон (href)',                  type: 'text' },
    { name: 'telegramUrl',    label: 'Ссылка Telegram',                 type: 'text' },
    { name: 'whatsappUrl',    label: 'Ссылка WhatsApp',                 type: 'text' },
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
