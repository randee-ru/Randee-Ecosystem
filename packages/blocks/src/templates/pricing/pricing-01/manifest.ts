import type { BlockTemplateManifest } from '../../../types'

export const manifest: BlockTemplateManifest = {
  id: 'pricing-01',
  type: 'pricing',
  group: 'Pricing',
  name: 'Pricing Classic',
  description: '3 тарифных плана — Free, Pro, Team',
  defaultProps: {
    title: 'Тарифные планы',
    subtitle: 'Выберите подходящий план для вашего бизнеса',
    plan1Name: 'Free',
    plan1Price: '0',
    plan1Period: '/мес',
    plan1Features: '["1 проект","5 GB хранилища","Email поддержка"]',
    plan1ButtonText: 'Начать бесплатно',
    plan1ButtonUrl: '#',
    plan2Name: 'Pro',
    plan2Price: '990',
    plan2Period: '/мес',
    plan2Features: '["10 проектов","50 GB хранилища","Приоритетная поддержка","Аналитика"]',
    plan2ButtonText: 'Попробовать Pro',
    plan2ButtonUrl: '#',
    plan3Name: 'Team',
    plan3Price: '2990',
    plan3Period: '/мес',
    plan3Features: '["Безлимит проектов","500 GB хранилища","Выделенная поддержка","Аналитика","SSO","API доступ"]',
    plan3ButtonText: 'Связаться с нами',
    plan3ButtonUrl: '#',
    variant: 'A'
  },
  propsSchema: [
    { name: 'title', label: 'Заголовок секции', type: 'text' },
    { name: 'subtitle', label: 'Подзаголовок', type: 'text' },
    { name: 'plan1Name', label: 'План 1: название', type: 'text' },
    { name: 'plan1Price', label: 'План 1: цена', type: 'text' },
    { name: 'plan1Features', label: 'План 1: фичи (JSON)', type: 'text' },
    { name: 'plan1ButtonText', label: 'План 1: кнопка', type: 'text' },
    { name: 'plan2Name', label: 'План 2: название (выделен)', type: 'text' },
    { name: 'plan2Price', label: 'План 2: цена', type: 'text' },
    { name: 'plan2Features', label: 'План 2: фичи (JSON)', type: 'text' },
    { name: 'plan2ButtonText', label: 'План 2: кнопка', type: 'text' },
    { name: 'plan3Name', label: 'План 3: название', type: 'text' },
    { name: 'plan3Price', label: 'План 3: цена', type: 'text' },
    { name: 'plan3Features', label: 'План 3: фичи (JSON)', type: 'text' },
    { name: 'plan3ButtonText', label: 'План 3: кнопка', type: 'text' },
    { name: 'variant', label: 'Вариант (A/B)', type: 'text' }
  ]
}

export const assets = {
  stylePath: 'style.css',
  scriptPath: 'script.js',
  images: []
} as const
