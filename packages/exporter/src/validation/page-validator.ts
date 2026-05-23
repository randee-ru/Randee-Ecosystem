import type { RandeeBlock, RandeePageSchema } from '../types/page-schema'

const requiredPropsByType: Record<string, string[]> = {
  hero: ['title'],
  faq: ['title'],
  'catalog.section': ['title', 'iblockId', 'sectionId'],
  'highload.list': ['title', 'hlblockTable']
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function assertNumeric(value: string, field: string, blockId: string): void {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Block ${blockId}: ${field} must be numeric string`)
  }
}

function validateBindings(block: RandeeBlock): void {
  const iblock = block.bindings?.iblock
  if (iblock) {
    if (iblock.iblockId) assertNumeric(iblock.iblockId, 'bindings.iblock.iblockId', block.id)
    if (iblock.sectionId) assertNumeric(iblock.sectionId, 'bindings.iblock.sectionId', block.id)
    if (iblock.elementId) assertNumeric(iblock.elementId, 'bindings.iblock.elementId', block.id)
  }

  const highload = block.bindings?.highload
  if (highload?.hlblockTable && !/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(highload.hlblockTable)) {
    throw new Error(`Block ${block.id}: bindings.highload.hlblockTable has invalid format`)
  }
}

function validateBlock(block: RandeeBlock): void {
  if (!isNonEmptyString(block.id)) throw new Error('Block id is required')
  if (!isNonEmptyString(block.type)) throw new Error(`Block ${block.id}: type is required`)

  const required = requiredPropsByType[block.type]
  if (!required) {
    throw new Error(`Block ${block.id}: unsupported type ${block.type}`)
  }

  for (const key of required) {
    if (!isNonEmptyString(block.props[key])) {
      throw new Error(`Block ${block.id}: missing required prop '${key}'`)
    }
  }

  if (block.type === 'catalog.section') {
    assertNumeric(block.props.iblockId, 'props.iblockId', block.id)
    assertNumeric(block.props.sectionId, 'props.sectionId', block.id)
  }

  validateBindings(block)
}

export function validatePageSchema(page: RandeePageSchema): void {
  if (!isNonEmptyString(page.page)) throw new Error('Page name is required')
  if (!isNonEmptyString(page.slug)) throw new Error('Page slug is required')
  if (!Array.isArray(page.blocks) || page.blocks.length === 0) {
    throw new Error('Page must contain at least one block')
  }

  page.blocks.forEach(validateBlock)
}
