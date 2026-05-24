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
  }
}

let blockIdCounter = 1

export function createBlockId(type: BlockType): string {
  const id = `${type.replace('.', '_')}_${String(blockIdCounter).padStart(4, '0')}`
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
