import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'footer-01',
  type: 'footer',
  group: 'Footer',
  name: 'Footer Classic',
  description: '3 колонки ссылок + логотип + копирайт',
  defaultProps: {
    logo: 'Компания',
    col1Title: 'Продукт',
    col1Links: '[{"label":"Возможности","url":"#"},{"label":"Тарифы","url":"#"},{"label":"Обновления","url":"#"}]',
    col2Title: 'Компания',
    col2Links: '[{"label":"О нас","url":"#"},{"label":"Блог","url":"#"},{"label":"Карьера","url":"#"}]',
    col3Title: 'Поддержка',
    col3Links: '[{"label":"Документация","url":"#"},{"label":"Контакты","url":"#"},{"label":"Статус","url":"#"}]',
    copyright: '© 2025 Компания. Все права защищены.',
    variant: 'A'
  },
  propsSchema: [
    { name: 'logo', label: 'Логотип', type: 'text' },
    { name: 'col1Title', label: 'Колонка 1: заголовок', type: 'text' },
    { name: 'col1Links', label: 'Колонка 1: ссылки (JSON)', type: 'text' },
    { name: 'col2Title', label: 'Колонка 2: заголовок', type: 'text' },
    { name: 'col2Links', label: 'Колонка 2: ссылки (JSON)', type: 'text' },
    { name: 'col3Title', label: 'Колонка 3: заголовок', type: 'text' },
    { name: 'col3Links', label: 'Колонка 3: ссылки (JSON)', type: 'text' },
    { name: 'copyright', label: 'Копирайт', type: 'text' },
    { name: 'variant', label: 'Вариант (A/B)', type: 'text' }
  ]
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: []
} as const
