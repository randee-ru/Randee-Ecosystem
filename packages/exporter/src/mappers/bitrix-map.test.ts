import { describe, expect, it } from 'vitest'
import { mapBlockToBitrixComponent } from './bitrix-map'

describe('bitrix map', () => {
  it('maps hero', () => {
    const component = mapBlockToBitrixComponent({
      id: 'hero_1',
      type: 'hero',
      props: { title: 'Hero title' }
    })

    expect(component.name).toBe('hero')
    expect(component.templateData?.TITLE).toBe('Hero title')
  })

  it('maps catalog with iblock bindings', () => {
    const component = mapBlockToBitrixComponent({
      id: 'catalog_1',
      type: 'catalog.section',
      props: { title: 'Catalog', iblockId: '12', sectionId: '3' },
      bindings: { iblock: { iblockId: '77', sectionId: '11' } }
    })

    expect(component.templateData?.IBLOCK_ID).toBe('77')
    expect(component.templateData?.SECTION_ID).toBe('11')
  })

  it('maps highload list', () => {
    const component = mapBlockToBitrixComponent({
      id: 'hl_1',
      type: 'highload.list',
      props: { title: 'Reviews', hlblockTable: 'b_reviews' }
    })

    expect(component.name).toBe('highload.list')
    expect(component.templateData?.HLBLOCK_TABLE).toBe('b_reviews')
  })
})
