import { describe, expect, it } from 'vitest'
import { createBuilderStore } from '../store/builder-store'

describe('builder store', () => {
  it('adds, duplicates and removes blocks', () => {
    const store = createBuilderStore({
      page: 'Home',
      slug: '/',
      seo: { title: 'Home', description: 'Desc' },
      blocks: []
    })
    store.getState().addBlock('hero')

    const first = store.getState().page.blocks[0]
    expect(first.type).toBe('hero')

    store.getState().duplicateBlock(first.id)
    expect(store.getState().page.blocks).toHaveLength(2)

    store.getState().removeBlock(first.id)
    expect(store.getState().page.blocks).toHaveLength(1)
  })

  it('moves blocks', () => {
    const store = createBuilderStore({
      page: 'Home',
      slug: '/',
      seo: { title: 'Home', description: 'Desc' },
      blocks: [
        { id: 'a', type: 'hero', template: 'hero-01', props: { title: 'A' } },
        { id: 'b', type: 'faq', template: 'faq-01', props: { title: 'B' } }
      ]
    })

    store.getState().moveBlock(1, 0)
    expect(store.getState().page.blocks[0].id).toBe('b')
  })

  it('renames blocks and preserves name on duplicate', () => {
    const store = createBuilderStore({
      page: 'Home',
      slug: '/',
      seo: { title: 'Home', description: 'Desc' },
      blocks: [{ id: 'a', type: 'hero', template: 'hero-01', props: { title: 'A' } }]
    })

    expect(typeof store.getState().renameBlock).toBe('function')
    store.getState().renameBlock('a', '  My Hero  ')
    expect(store.getState().page.blocks[0].name).toBe('My Hero')

    store.getState().duplicateBlock('a')
    expect(store.getState().page.blocks[1].name).toBe('My Hero')
  })
})
