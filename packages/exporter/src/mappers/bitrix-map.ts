import type { BitrixComponentDescriptor } from '@randee/bitrix-adapter'
import type { RandeeBlock } from '../types/page-schema'

export type BlockToBitrixMapper = (block: RandeeBlock) => BitrixComponentDescriptor

function heroMapper(block: RandeeBlock): BitrixComponentDescriptor {
  return {
    namespace: 'randee',
    name: 'hero',
    title: block.props.title ?? 'Hero section',
    description: block.props.description,
    params: {
      TITLE: 'Hero title',
      DESCRIPTION: 'Hero description',
      BUTTON_TEXT: 'CTA button text'
    },
    templateData: {
      TITLE: block.props.title ?? 'Hero',
      DESCRIPTION: block.props.description ?? '',
      BUTTON_TEXT: block.props.buttonText ?? 'Подробнее'
    }
  }
}

function faqMapper(block: RandeeBlock): BitrixComponentDescriptor {
  return {
    namespace: 'randee',
    name: 'faq',
    title: block.props.title ?? 'FAQ section',
    description: 'FAQ block exported from Randee',
    params: {
      TITLE: 'FAQ title'
    },
    templateData: {
      TITLE: block.props.title ?? 'Частые вопросы'
    }
  }
}

function catalogSectionMapper(block: RandeeBlock): BitrixComponentDescriptor {
  return {
    namespace: 'randee',
    name: 'catalog.section',
    title: block.props.title ?? 'Catalog section',
    description: 'Catalog block exported from Randee',
    params: {
      TITLE: 'Catalog title',
      IBLOCK_ID: 'Infoblock ID',
      SECTION_ID: 'Section ID'
    },
    templateData: {
      TITLE: block.props.title ?? 'Каталог'
    }
  }
}

const mapperRegistry: Record<string, BlockToBitrixMapper> = {
  hero: heroMapper,
  faq: faqMapper,
  'catalog.section': catalogSectionMapper
}

export function mapBlockToBitrixComponent(block: RandeeBlock): BitrixComponentDescriptor {
  const mapper = mapperRegistry[block.type]
  if (!mapper) {
    throw new Error(`Unsupported block type for Bitrix export: ${block.type}`)
  }

  return mapper(block)
}
