import type { BlockType, PageBlock } from '../types/page'

export interface BlockDefinition {
  type: BlockType
  label: string
  defaultTemplate: string
  defaultProps: Record<string, string>
}

const registry: Record<BlockType, BlockDefinition> = {
  hero: {
    type: 'hero',
    label: 'Hero',
    defaultTemplate: 'hero-01',
    defaultProps: {
      title: 'Новый Hero блок',
      description: 'Добавьте описание',
      buttonText: 'Подробнее'
    }
  },
  features: {
    type: 'features',
    label: 'Features',
    defaultTemplate: 'features-01',
    defaultProps: {
      title: 'Преимущества',
      item1: 'Пункт 1',
      item2: 'Пункт 2',
      item3: 'Пункт 3'
    }
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    defaultTemplate: 'faq-01',
    defaultProps: {
      title: 'Частые вопросы'
    }
  },
  cta: {
    type: 'cta',
    label: 'CTA',
    defaultTemplate: 'cta-01',
    defaultProps: {
      title: 'Готовы начать?',
      description: 'Оставьте заявку и мы свяжемся с вами',
      buttonText: 'Отправить'
    }
  },
  'catalog.section': {
    type: 'catalog.section',
    label: 'Catalog Section',
    defaultTemplate: 'catalog-01',
    defaultProps: {
      title: 'Каталог',
      iblockId: '12',
      sectionId: '3'
    }
  },
  'news.list': {
    type: 'news.list',
    label: 'News List',
    defaultTemplate: 'news-01',
    defaultProps: {
      title: 'Новости'
    }
  },
  component: {
    type: 'component',
    label: 'Component',
    defaultTemplate: 'component-01',
    defaultProps: {
      title: 'New Component'
    }
  },
  nav: {
    type: 'nav',
    label: 'Navigation',
    defaultTemplate: 'nav-01',
    defaultProps: {
      logo: 'Логотип',
      buttonText: 'Начать'
    }
  },
  footer: {
    type: 'footer',
    label: 'Footer',
    defaultTemplate: 'footer-01',
    defaultProps: {
      logo: 'Компания',
      copyright: `© ${new Date().getFullYear()} Компания`
    }
  },
  pricing: {
    type: 'pricing',
    label: 'Pricing',
    defaultTemplate: 'pricing-01',
    defaultProps: {
      title: 'Тарифные планы'
    }
  },
  logos: {
    type: 'logos',
    label: 'Logos',
    defaultTemplate: 'logos-01',
    defaultProps: {
      title: 'Нам доверяют'
    }
  },
  testimonial: {
    type: 'testimonial',
    label: 'Testimonial',
    defaultTemplate: 'testimonial-01',
    defaultProps: {
      quote: 'Отличный продукт!',
      authorName: 'Иван Иванов'
    }
  }
}

let blockIdCounter = 1

function uniqueSuffix(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}${random}`
}

export function createBlockId(type: BlockType): string {
  const base = type.replace('.', '_')
  const id = `${base}_${String(blockIdCounter).padStart(4, '0')}_${uniqueSuffix()}`
  blockIdCounter += 1
  return id
}

export function resetBlockIdCounter(nextValue = 1): void {
  blockIdCounter = nextValue
}

export function listBlockDefinitions(): BlockDefinition[] {
  return Object.values(registry)
}

export function createBlock(type: BlockType): PageBlock {
  const def = registry[type]
  if (!def) throw new Error(`Unknown block type: ${type}`)

  return {
    id: createBlockId(type),
    type: def.type,
    template: def.defaultTemplate,
    props: { ...def.defaultProps }
  }
}
