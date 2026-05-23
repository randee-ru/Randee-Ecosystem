import { createStore } from 'zustand/vanilla'
import { createBlock, createBlockId } from '../registry/block-registry'
import { reorder } from '../utils/reorder'
import type { BlockType, BuilderPage, PageBlock, SeoMetadata, ViewportMode } from '../types/page'

export interface BuilderState {
  page: BuilderPage
  selectedBlockId: string | null
  viewport: ViewportMode
}

export interface BuilderActions {
  setViewport: (viewport: ViewportMode) => void
  selectBlock: (blockId: string | null) => void
  addBlock: (type: BlockType) => void
  insertBlock: (block: PageBlock) => void
  removeBlock: (blockId: string) => void
  duplicateBlock: (blockId: string) => void
  moveBlock: (fromIndex: number, toIndex: number) => void
  updateBlockProps: (blockId: string, props: Record<string, string>) => void
  setPageMeta: (meta: Pick<BuilderPage, 'page' | 'slug'>) => void
  setSeoMeta: (seo: Partial<SeoMetadata>) => void
  loadPage: (nextPage: BuilderPage) => void
}

export type BuilderStore = BuilderState & BuilderActions

export const DEFAULT_PAGE: BuilderPage = {
  page: 'Новая страница',
  slug: '/',
  seo: {
    title: 'Новая страница',
    description: 'Описание страницы'
  },
  blocks: [createBlock('hero')]
}

function cloneBlock(block: PageBlock): PageBlock {
  return {
    ...block,
    id: createBlockId(block.type),
    props: { ...block.props },
    bindings: block.bindings ? { items: [...(block.bindings.items ?? [])] } : undefined
  }
}

export function createBuilderStore(initialPage: BuilderPage = DEFAULT_PAGE) {
  return createStore<BuilderStore>()((set) => ({
    page: initialPage,
    selectedBlockId: initialPage.blocks[0]?.id ?? null,
    viewport: 'macbook',

    setViewport: (viewport) => set({ viewport }),
    selectBlock: (blockId) => set({ selectedBlockId: blockId }),

    addBlock: (type) => {
      const block = createBlock(type)
      set((state) => ({
        page: { ...state.page, blocks: [...state.page.blocks, block] },
        selectedBlockId: block.id
      }))
    },

    insertBlock: (block) => {
      set((state) => ({
        page: { ...state.page, blocks: [...state.page.blocks, block] },
        selectedBlockId: block.id
      }))
    },

    removeBlock: (blockId) => {
      set((state) => {
        const nextBlocks = state.page.blocks.filter((block) => block.id !== blockId)
        return {
          page: { ...state.page, blocks: nextBlocks },
          selectedBlockId: nextBlocks[0]?.id ?? null
        }
      })
    },

    duplicateBlock: (blockId) => {
      set((state) => {
        const index = state.page.blocks.findIndex((item) => item.id === blockId)
        if (index < 0) return state

        const copy = cloneBlock(state.page.blocks[index])
        const nextBlocks = [...state.page.blocks]
        nextBlocks.splice(index + 1, 0, copy)

        return {
          page: { ...state.page, blocks: nextBlocks },
          selectedBlockId: copy.id
        }
      })
    },

    moveBlock: (fromIndex, toIndex) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: reorder(state.page.blocks, fromIndex, toIndex)
        }
      }))
    },

    updateBlockProps: (blockId, props) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId ? { ...block, props: { ...block.props, ...props } } : block
          )
        }
      }))
    },

    setPageMeta: (meta) => {
      set((state) => ({
        page: {
          ...state.page,
          page: meta.page,
          slug: meta.slug
        }
      }))
    },

    setSeoMeta: (seo) => {
      set((state) => ({
        page: {
          ...state.page,
          seo: { ...state.page.seo, ...seo }
        }
      }))
    },

    loadPage: (nextPage) => {
      set({
        page: nextPage,
        selectedBlockId: nextPage.blocks[0]?.id ?? null
      })
    }
  }))
}

export function selectedBlock(state: BuilderState): PageBlock | undefined {
  return state.page.blocks.find((block) => block.id === state.selectedBlockId)
}

export function getBlockIndex(state: BuilderState, blockId: string): number {
  return state.page.blocks.findIndex((block) => block.id === blockId)
}

export function snapshotPage(): BuilderPage {
  return getBuilderStore().getState().page
}

let singletonStore = createBuilderStore()

export function getBuilderStore() {
  return singletonStore
}

export function resetBuilderStore(page?: BuilderPage) {
  singletonStore = createBuilderStore(page ?? DEFAULT_PAGE)
  return singletonStore
}
