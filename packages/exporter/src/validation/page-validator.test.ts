import { describe, expect, it } from 'vitest'
import { validatePageSchema } from './page-validator'

describe('validatePageSchema', () => {
  it('accepts valid schema', () => {
    expect(() =>
      validatePageSchema({
        page: 'Home',
        slug: '/',
        blocks: [
          {
            id: 'catalog_1',
            type: 'catalog.section',
            props: { title: 'Catalog', iblockId: '12', sectionId: '3' },
            bindings: { iblock: { iblockId: '12', sectionId: '3' } }
          }
        ]
      })
    ).not.toThrow()
  })

  it('rejects invalid numeric fields', () => {
    expect(() =>
      validatePageSchema({
        page: 'Home',
        slug: '/',
        blocks: [
          {
            id: 'catalog_1',
            type: 'catalog.section',
            props: { title: 'Catalog', iblockId: 'abc', sectionId: '3' }
          }
        ]
      })
    ).toThrow(/must be numeric/)
  })

  it('rejects invalid highload table', () => {
    expect(() =>
      validatePageSchema({
        page: 'Home',
        slug: '/',
        blocks: [
          {
            id: 'hl_1',
            type: 'highload.list',
            props: { title: 'HL', hlblockTable: 'invalid-table!' },
            bindings: { highload: { hlblockTable: 'invalid-table!' } }
          }
        ]
      })
    ).toThrow(/invalid format/)
  })
})
