import type { BitrixComponentDescriptor } from '@randee/bitrix-adapter'
import type { RandeeBlock } from '../types/page-schema'

export type BlockToBitrixMapper = (block: RandeeBlock) => BitrixComponentDescriptor

function heroMapper(block: RandeeBlock): BitrixComponentDescriptor {
  return {
    namespace: 'randee',
    name: 'hero',
    title: block.props.title,
    description: block.props.description,
    params: {
      TITLE: 'Hero title',
      DESCRIPTION: 'Hero description',
      BUTTON_TEXT: 'CTA button text'
    },
    templateData: {
      TITLE: block.props.title,
      DESCRIPTION: block.props.description ?? '',
      BUTTON_TEXT: block.props.buttonText ?? 'Подробнее'
    }
  }
}

function faqMapper(block: RandeeBlock): BitrixComponentDescriptor {
  return {
    namespace: 'randee',
    name: 'faq',
    title: block.props.title,
    description: 'FAQ block exported from Randee',
    params: {
      TITLE: 'FAQ title'
    },
    templateData: {
      TITLE: block.props.title
    }
  }
}

function catalogSectionMapper(block: RandeeBlock): BitrixComponentDescriptor {
  const iblockId = block.bindings?.iblock?.iblockId ?? block.props.iblockId
  const sectionId = block.bindings?.iblock?.sectionId ?? block.props.sectionId

  return {
    namespace: 'randee',
    name: 'catalog.section',
    title: block.props.title,
    description: 'Catalog block exported from Randee',
    params: {
      TITLE: 'Catalog title',
      IBLOCK_ID: 'Infoblock ID',
      SECTION_ID: 'Section ID'
    },
    templateData: {
      TITLE: block.props.title,
      IBLOCK_ID: iblockId,
      SECTION_ID: sectionId
    }
  }
}

function highloadListMapper(block: RandeeBlock): BitrixComponentDescriptor {
  const hlblockTable = block.bindings?.highload?.hlblockTable ?? block.props.hlblockTable

  return {
    namespace: 'randee',
    name: 'highload.list',
    title: block.props.title,
    description: 'Highload list block exported from Randee',
    params: {
      TITLE: 'Highload block title',
      HLBLOCK_TABLE: 'Highload block table name'
    },
    templateData: {
      TITLE: block.props.title,
      HLBLOCK_TABLE: hlblockTable
    }
  }
}

const mapperRegistry: Record<string, BlockToBitrixMapper> = {
  hero: heroMapper,
  faq: faqMapper,
  'catalog.section': catalogSectionMapper,
  'highload.list': highloadListMapper
}

export function mapBlockToBitrixComponent(block: RandeeBlock): BitrixComponentDescriptor {
  const mapper = mapperRegistry[block.type]
  if (!mapper) {
    throw new Error(`Unsupported block type for Bitrix export: ${block.type}`)
  }

  return mapper(block)
}
