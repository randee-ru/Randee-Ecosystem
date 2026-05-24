import type { BuilderPage } from '@randee/builder'
import { getBlockTemplate } from '../registry'
import { isVendorId, VENDOR_LOAD_ORDER, type VendorId } from './registry'

function uniqueOrdered(ids: VendorId[]): VendorId[] {
  const seen = new Set<VendorId>()
  const result: VendorId[] = []

  for (const id of VENDOR_LOAD_ORDER) {
    if (ids.includes(id) && !seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }

  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }

  return result
}

export function collectTemplateVendors(templateId: string): VendorId[] {
  const entry = getBlockTemplate(templateId)
  return entry?.manifest.dependencies ?? []
}

export function collectPageVendors(page: BuilderPage): VendorId[] {
  const fromPage = (page.vendors ?? []).filter(isVendorId)
  const fromBlocks = page.blocks.flatMap((block) => collectTemplateVendors(block.template))
  return uniqueOrdered([...fromPage, ...fromBlocks])
}
