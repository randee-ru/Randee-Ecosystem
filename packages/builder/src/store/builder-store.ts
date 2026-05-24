import { createStore } from 'zustand/vanilla'
import { createBlock, createBlockId } from '../registry/block-registry'
import { reorder } from '../utils/reorder'
import type { BlockType, BuilderPage, PageBlock, SeoMetadata, ViewportMode } from '../types/page'
import type { ComponentDesignSettings } from '../types/component-design'
import type { ComponentElement } from '../types/component-element'
import { mergeComponentDesign } from '../utils/component-design'
import { createElementId } from '../utils/element-id'

export interface BuilderState {
  page: BuilderPage
  selectedBlockId: string | null
  selectedElementId: string | null
  viewport: ViewportMode
}

export interface BuilderActions {
  setViewport: (viewport: ViewportMode) => void
  selectBlock: (blockId: string | null) => void
  selectElement: (elementId: string | null) => void
  insertElement: (blockId: string, catalogElementId: string, defaults: Record<string, string>, label: string) => void
  removeElement: (blockId: string, elementId: string) => void
  updateElementProps: (blockId: string, elementId: string, props: Record<string, string>) => void
  moveElement: (blockId: string, fromIndex: number, toIndex: number) => void
  renameElement: (blockId: string, elementId: string, name: string) => void
  addBlock: (type: BlockType) => void
  insertBlock: (block: PageBlock) => void
  removeBlock: (blockId: string) => void
  duplicateBlock: (blockId: string) => void
  moveBlock: (fromIndex: number, toIndex: number) => void
  updateBlockProps: (blockId: string, props: Record<string, string>) => void
  updateBlockDesign: (blockId: string, patch: Partial<ComponentDesignSettings>) => void
  renameBlock: (blockId: string, name: string) => void
  setPageMeta: (meta: Pick<BuilderPage, 'page' | 'slug'>) => void
  setSeoMeta: (seo: Partial<SeoMetadata>) => void
  loadPage: (nextPage: BuilderPage) => void
  togglePageVendor: (vendorId: string) => void
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

function cloneElement(element: ComponentElement): ComponentElement {
  return {
    ...element,
    id: createElementId(element.elementId),
    props: { ...element.props }
  }
}

function cloneBlock(block: PageBlock): PageBlock {
  return {
    ...block,
    id: createBlockId(block.type),
    name: block.name,
    props: { ...block.props },
    elements: block.elements?.map(cloneElement),
    design: block.design ? { ...block.design, position: { ...block.design.position }, size: { ...block.design.size }, layout: { ...block.design.layout }, typography: { ...block.design.typography } } : undefined,
    bindings: block.bindings ? { items: [...(block.bindings.items ?? [])] } : undefined
  }
}

export function createBuilderStore(initialPage: BuilderPage = DEFAULT_PAGE) {
  return createStore<BuilderStore>()((set) => ({
    page: initialPage,
    selectedBlockId: initialPage.blocks[0]?.id ?? null,
    selectedElementId: null,
    viewport: 'macbook',

    setViewport: (viewport) => set({ viewport }),
    selectBlock: (blockId) => set({ selectedBlockId: blockId, selectedElementId: null }),
    selectElement: (elementId) => set({ selectedElementId: elementId }),

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

    updateBlockDesign: (blockId, patch) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? { ...block, design: mergeComponentDesign(block.design, patch) }
              : block
          )
        }
      }))
    },

    renameBlock: (blockId, name) => {
      const trimmed = name.trim()
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? { ...block, name: trimmed.length > 0 ? trimmed : undefined }
              : block
          )
        }
      }))
    },

    insertElement: (blockId, catalogElementId, defaults, label) => {
      const element: ComponentElement = {
        id: createElementId(catalogElementId),
        elementId: catalogElementId,
        name: label,
        props: { ...defaults }
      }
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? { ...block, elements: [...(block.elements ?? []), element] }
              : block
          )
        },
        selectedBlockId: blockId,
        selectedElementId: element.id
      }))
    },

    removeElement: (blockId, elementId) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? { ...block, elements: (block.elements ?? []).filter((item) => item.id !== elementId) }
              : block
          )
        },
        selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId
      }))
    },

    updateElementProps: (blockId, elementId, props) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  elements: (block.elements ?? []).map((item) =>
                    item.id === elementId ? { ...item, props: { ...item.props, ...props } } : item
                  )
                }
              : block
          )
        }
      }))
    },

    moveElement: (blockId, fromIndex, toIndex) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) => {
            if (block.id !== blockId || !block.elements?.length) return block
            return { ...block, elements: reorder(block.elements, fromIndex, toIndex) }
          })
        }
      }))
    },

    renameElement: (blockId, elementId, name) => {
      const trimmed = name.trim()
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  elements: (block.elements ?? []).map((item) =>
                    item.id === elementId
                      ? { ...item, name: trimmed.length > 0 ? trimmed : undefined }
                      : item
                  )
                }
              : block
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
        selectedBlockId: nextPage.blocks[0]?.id ?? null,
        selectedElementId: null
      })
    },

    togglePageVendor: (vendorId) => {
      set((state) => {
        const current = state.page.vendors ?? []
        const enabled = current.includes(vendorId)
        const vendors = enabled ? current.filter((id) => id !== vendorId) : [...current, vendorId]
        return {
          page: {
            ...state.page,
            vendors: vendors.length > 0 ? vendors : undefined
          }
        }
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
