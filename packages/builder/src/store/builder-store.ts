import { createStore } from 'zustand/vanilla'
import { createBlock, createBlockId } from '../registry/block-registry'
import { reorder } from '../utils/reorder'
import type { BlockType, BuilderPage, PageBlock, SeoMetadata, ViewportMode } from '../types/page'
import type { ComponentDesignSettings } from '../types/component-design'
import type { ComponentElement } from '../types/component-element'
import type { CmsPropBindingState } from '../types/cms-binding'
import type { BuilderCmsConnection } from '../types/cms-binding'
import { mergeComponentDesign, type ComponentDesignPatch } from '../utils/component-design'
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
  insertElement: (
    blockId: string,
    catalogElementId: string,
    defaults: Record<string, string>,
    label: string,
    options?: {
      parentId?: string | null
      afterElementId?: string | null
      beforeElementId?: string | null
      columnIndex?: number | null
    }
  ) => void
  removeElement: (blockId: string, elementId: string) => void
  updateElementProps: (blockId: string, elementId: string, props: Record<string, string>) => void
  updateElementCmsBinding: (
    blockId: string,
    elementId: string,
    propKey: string,
    bindingState: CmsPropBindingState
  ) => void
  updateElementDesign: (blockId: string, elementId: string, patch: Partial<import('../types/component-element').ElementDesignSettings>) => void
  moveElement: (blockId: string, fromIndex: number, toIndex: number) => void
  moveElementWithPlacement: (
    blockId: string,
    elementId: string,
    options?: { parentId?: string | null; afterElementId?: string | null; beforeElementId?: string | null }
  ) => void
  renameElement: (blockId: string, elementId: string, name: string) => void
  duplicateElement: (blockId: string, elementId: string) => void
  moveElementDirection: (blockId: string, elementId: string, direction: 'up' | 'down') => void
  replaceElements: (blockId: string, elements: ComponentElement[]) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  addBlock: (type: BlockType) => void
  insertBlock: (block: PageBlock) => void
  removeBlock: (blockId: string) => void
  duplicateBlock: (blockId: string) => void
  moveBlock: (fromIndex: number, toIndex: number) => void
  updateBlockProps: (blockId: string, props: Record<string, string>) => void
  updateBlockCmsBinding: (blockId: string, propName: string, binding: CmsPropBindingState) => void
  updateBlockDesign: (blockId: string, patch: ComponentDesignPatch) => void
  renameBlock: (blockId: string, name: string) => void
  setPageMeta: (meta: Pick<BuilderPage, 'page' | 'slug'>) => void
  setCmsConnection: (connection: BuilderCmsConnection) => void
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
    parentId: element.parentId ?? null,
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
    bindings: block.bindings ? { items: [...(block.bindings.items ?? [])] } : undefined,
    cmsBindings: block.cmsBindings
      ? {
          version: block.cmsBindings.version,
          props: Object.fromEntries(Object.entries(block.cmsBindings.props).map(([key, value]) => [key, { ...value }]))
        }
      : undefined
  }
}

function ensureUniqueBlocks(page: BuilderPage): BuilderPage {
  const usedBlockIds = new Set<string>()
  const usedElementIds = new Set<string>()

  const blocks = page.blocks.map((block) => {
    let blockChanged = false
    let nextBlockId = block.id
    while (!nextBlockId || usedBlockIds.has(nextBlockId)) {
      nextBlockId = createBlockId(block.type)
    }
    if (nextBlockId !== block.id) blockChanged = true
    usedBlockIds.add(nextBlockId)

    const elements = (block.elements ?? []).map((element) => {
      let nextElementId = element.id
      while (!nextElementId || usedElementIds.has(nextElementId)) {
        nextElementId = createElementId(element.elementId)
      }
      usedElementIds.add(nextElementId)
      if (nextElementId !== element.id) blockChanged = true
      return nextElementId === element.id ? element : { ...element, id: nextElementId }
    })

    if (!blockChanged) return block
    return {
      ...block,
      id: nextBlockId,
      elements
    }
  })

  return blocks === page.blocks ? page : { ...page, blocks }
}

export function createBuilderStore(initialPage: BuilderPage = DEFAULT_PAGE) {
  // ─── History (undo/redo) ──────────────────────────────────────────────────
  const MAX_HISTORY = 50
  const hist: BuilderPage[] = [JSON.parse(JSON.stringify(initialPage)) as BuilderPage]
  let histIdx = 0

  const snap = (page: BuilderPage) => {
    hist.splice(histIdx + 1) // discard redo future
    hist.push(JSON.parse(JSON.stringify(page)) as BuilderPage)
    if (hist.length > MAX_HISTORY) hist.shift()
    histIdx = hist.length - 1
  }

  return createStore<BuilderStore>()((set, get) => ({
    page: initialPage,
    selectedBlockId: initialPage.blocks[0]?.id ?? null,
    selectedElementId: null,
    viewport: 'macbook',

    undo: () => {
      if (histIdx <= 0) return
      histIdx--
      set({ page: JSON.parse(JSON.stringify(hist[histIdx])) as BuilderPage })
    },

    redo: () => {
      if (histIdx >= hist.length - 1) return
      histIdx++
      set({ page: JSON.parse(JSON.stringify(hist[histIdx])) as BuilderPage })
    },

    canUndo: () => histIdx > 0,
    canRedo: () => histIdx < hist.length - 1,

    setViewport: (viewport) => set({ viewport }),
    selectBlock: (blockId) => set({ selectedBlockId: blockId, selectedElementId: null }),
    selectElement: (elementId) => set({ selectedElementId: elementId }),

    addBlock: (type) => {
      snap(get().page)
      const block = createBlock(type)
      set((state) => ({
        page: { ...state.page, blocks: [...state.page.blocks, block] },
        selectedBlockId: block.id
      }))
    },

    insertBlock: (block) => {
      snap(get().page)
      set((state) => {
        const normalized = ensureUniqueBlocks({ ...state.page, blocks: [...state.page.blocks, block] })
        const inserted = normalized.blocks[normalized.blocks.length - 1]
        return {
          page: normalized,
          selectedBlockId: inserted?.id ?? null
        }
      })
    },

    removeBlock: (blockId) => {
      snap(get().page)
      set((state) => {
        const nextBlocks = state.page.blocks.filter((block) => block.id !== blockId)
        return {
          page: { ...state.page, blocks: nextBlocks },
          selectedBlockId: nextBlocks[0]?.id ?? null
        }
      })
    },

    duplicateBlock: (blockId) => {
      snap(get().page)
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
      snap(get().page)
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

    updateBlockCmsBinding: (blockId, propName, binding) => {
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) => {
            if (block.id !== blockId) return block
            const current = block.cmsBindings ?? { version: 1 as const, props: {} }
            return {
              ...block,
              cmsBindings: {
                version: 1,
                props: {
                  ...current.props,
                  [propName]: binding
                }
              }
            }
          })
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
      snap(get().page)
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

    insertElement: (blockId, catalogElementId, defaults, label, options) => {
      snap(get().page)
      const element: ComponentElement = {
        id: createElementId(catalogElementId),
        elementId: catalogElementId,
        name: label,
        parentId: options?.parentId ?? null,
        props: { ...defaults }
      }

      const insertAtFlatList = (list: ComponentElement[]): ComponentElement[] => {
        const beforeElementId = options?.beforeElementId ?? null
        if (beforeElementId) {
          const targetIndex = list.findIndex((item) => item.id === beforeElementId)
          if (targetIndex !== -1) {
            const next = [...list]
            next.splice(targetIndex, 0, element)
            return next
          }
        }
        const afterElementId = options?.afterElementId ?? null
        if (afterElementId) {
          const targetIndex = list.findIndex((item) => item.id === afterElementId)
          if (targetIndex !== -1) {
            const next = [...list]
            next.splice(targetIndex + 1, 0, element)
            return next
          }
        }
        return [...list, element]
      }

      const insertIntoColumnsSlot = (list: ComponentElement[]): ComponentElement[] | null => {
        const columnIndex = options?.columnIndex
        const parentId = options?.parentId ?? null
        if (columnIndex == null || parentId == null) return null
        const parent = list.find((item) => item.id === parentId)
        if (parent?.elementId !== 'columns') return null

        const columnsCount = Math.max(1, Math.min(16, Number(parent.props.columns ?? '2') || 2))
        const siblingIds = new Set(
          list.filter((item) => (item.parentId ?? null) === parentId).map((item) => item.id)
        )
        const siblings = list.filter((item) => siblingIds.has(item.id))
        let targetIdx = siblings.length
        for (let i = 0; i <= siblings.length; i++) {
          if (i % columnsCount === columnIndex) {
            targetIdx = i
            break
          }
        }
        const reorderedSiblings = [...siblings]
        reorderedSiblings.splice(targetIdx, 0, element)

        const nextList: ComponentElement[] = []
        let insertedSiblings = false
        for (const item of list) {
          if (siblingIds.has(item.id)) {
            if (!insertedSiblings) {
              nextList.push(...reorderedSiblings)
              insertedSiblings = true
            }
            continue
          }
          nextList.push(item)
        }
        if (!insertedSiblings) nextList.push(...reorderedSiblings)
        return nextList
      }

      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) => {
            if (block.id !== blockId) return block
            const list = [...(block.elements ?? [])]
            const columnsResult = insertIntoColumnsSlot(list)
            return {
              ...block,
              elements: columnsResult ?? insertAtFlatList(list)
            }
          })
        },
        selectedBlockId: blockId,
        selectedElementId: element.id
      }))
    },

    removeElement: (blockId, elementId) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? (() => {
                  const source = block.elements ?? []
                  const idsToRemove = new Set<string>([elementId])
                  let changed = true
                  while (changed) {
                    changed = false
                    for (const item of source) {
                      const parentId = item.parentId ?? null
                      if (parentId && idsToRemove.has(parentId) && !idsToRemove.has(item.id)) {
                        idsToRemove.add(item.id)
                        changed = true
                      }
                    }
                  }
                  return { ...block, elements: source.filter((item) => !idsToRemove.has(item.id)) }
                })()
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

    updateElementCmsBinding: (blockId, elementId, propKey, bindingState) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  elements: (block.elements ?? []).map((item) => {
                    if (item.id !== elementId) return item
                    const cmsBindings = { ...(item.cmsBindings ?? {}) }
                    cmsBindings[propKey] = bindingState
                    return { ...item, cmsBindings }
                  })
                }
              : block
          )
        }
      }))
    },

    updateElementDesign: (blockId, elementId, patch) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  elements: (block.elements ?? []).map((item) => {
                    if (item.id !== elementId) return item
                    const prev = item.design ?? {}
                    const merged: typeof prev = {}
                    for (const key of Object.keys({ ...prev, ...patch }) as Array<keyof typeof patch>) {
                      const prevVal = (prev as Record<string, unknown>)[key]
                      const nextVal = (patch as Record<string, unknown>)[key]
                      if (nextVal !== null && typeof nextVal === 'object' && !Array.isArray(nextVal) && typeof prevVal === 'object' && prevVal !== null) {
                        ;(merged as Record<string, unknown>)[key] = { ...prevVal, ...nextVal }
                      } else {
                        ;(merged as Record<string, unknown>)[key] = nextVal ?? prevVal
                      }
                    }
                    return { ...item, design: merged }
                  })
                }
              : block
          )
        }
      }))
    },

    moveElement: (blockId, fromIndex, toIndex) => {
      snap(get().page)
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

    moveElementWithPlacement: (blockId, elementId, options) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) => {
            if (block.id !== blockId || !block.elements?.length) return block
            const source = block.elements
            const moving = source.find((item) => item.id === elementId)
            if (!moving) return block

            const descendantIds = new Set<string>()
            let changed = true
            while (changed) {
              changed = false
              for (const item of source) {
                const parentId = item.parentId ?? null
                if (
                  (parentId === elementId || (parentId !== null && descendantIds.has(parentId))) &&
                  !descendantIds.has(item.id)
                ) {
                  descendantIds.add(item.id)
                  changed = true
                }
              }
            }

            const explicitParentId =
              options?.parentId === undefined ? undefined : options.parentId ?? null
            if (
              explicitParentId === elementId ||
              (explicitParentId !== undefined && explicitParentId !== null && descendantIds.has(explicitParentId))
            ) {
              return block
            }

            const rest = source.filter((item) => item.id !== elementId)
            const beforeId = options?.beforeElementId ?? null
            const afterId = options?.afterElementId ?? null

            let nextParentId = explicitParentId ?? moving.parentId ?? null
            if (beforeId) {
              const target = rest.find((item) => item.id === beforeId)
              if (!target) return block
              if (explicitParentId === undefined) nextParentId = target.parentId ?? null
              const insertIndex = rest.findIndex((item) => item.id === beforeId)
              const next = { ...moving, parentId: nextParentId }
              rest.splice(insertIndex, 0, next)
              return { ...block, elements: rest }
            }

            if (afterId) {
              const target = rest.find((item) => item.id === afterId)
              if (!target) return block
              if (explicitParentId === undefined) nextParentId = target.parentId ?? null
              const insertIndex = rest.findIndex((item) => item.id === afterId)
              const next = { ...moving, parentId: nextParentId }
              rest.splice(insertIndex + 1, 0, next)
              return { ...block, elements: rest }
            }

            const next = { ...moving, parentId: nextParentId }
            rest.push(next)
            return { ...block, elements: rest }
          })
        },
        selectedElementId: elementId
      }))
    },

    renameElement: (blockId, elementId, name) => {
      snap(get().page)
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

    duplicateElement: (blockId, elementId) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) => {
            if (block.id !== blockId || !block.elements?.length) return block
            const elements = block.elements
            const source = elements.find((item) => item.id === elementId)
            if (!source) return block

            // Collect source + all descendants
            const toClone = new Set<string>([elementId])
            let changed = true
            while (changed) {
              changed = false
              for (const item of elements) {
                const pid = item.parentId ?? null
                if (pid !== null && toClone.has(pid) && !toClone.has(item.id)) {
                  toClone.add(item.id)
                  changed = true
                }
              }
            }

            // Build id map old → new
            const idMap = new Map<string, string>()
            for (const id of toClone) {
              idMap.set(id, createElementId(elements.find((el) => el.id === id)?.elementId ?? 'el'))
            }

            const clones: ComponentElement[] = []
            for (const item of elements) {
              if (!toClone.has(item.id)) continue
              clones.push({
                ...item,
                id: idMap.get(item.id) ?? createElementId(item.elementId),
                parentId: item.parentId ? (idMap.get(item.parentId) ?? item.parentId) : null
              })
            }

            // Insert clones right after original element
            const insertIndex = elements.findIndex((item) => item.id === elementId)
            const next = [...elements]
            next.splice(insertIndex + 1, 0, ...clones)
            const newSelectedId = idMap.get(elementId) ?? elementId
            return { ...block, elements: next, _selectedElementId: newSelectedId }
          })
        },
        selectedElementId: (() => {
          const block = state.page.blocks.find((b) => b.id === blockId)
          const source = block?.elements?.find((item) => item.id === elementId)
          return source ? createElementId(source.elementId) : state.selectedElementId
        })()
      }))
    },

    moveElementDirection: (blockId, elementId, direction) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) => {
            if (block.id !== blockId || !block.elements?.length) return block
            const elements = block.elements
            const current = elements.find((item) => item.id === elementId)
            if (!current) return block

            const parentId = current.parentId ?? null
            const siblings = elements.filter((item) => (item.parentId ?? null) === parentId)
            const siblingIndex = siblings.findIndex((item) => item.id === elementId)

            if (direction === 'up' && siblingIndex > 0) {
              const prevSibling = siblings[siblingIndex - 1]
              const newElements = [...elements]
              const a = newElements.findIndex((item) => item.id === elementId)
              const b = newElements.findIndex((item) => item.id === prevSibling.id)
              ;[newElements[a], newElements[b]] = [newElements[b], newElements[a]]
              return { ...block, elements: newElements }
            }
            if (direction === 'down' && siblingIndex < siblings.length - 1) {
              const nextSibling = siblings[siblingIndex + 1]
              const newElements = [...elements]
              const a = newElements.findIndex((item) => item.id === elementId)
              const b = newElements.findIndex((item) => item.id === nextSibling.id)
              ;[newElements[a], newElements[b]] = [newElements[b], newElements[a]]
              return { ...block, elements: newElements }
            }
            return block
          })
        }
      }))
    },

    replaceElements: (blockId, elements) => {
      snap(get().page)
      set((state) => ({
        page: {
          ...state.page,
          blocks: state.page.blocks.map((block) =>
            block.id === blockId ? { ...block, elements } : block
          )
        },
        selectedElementId: null
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

    setCmsConnection: (connection) => {
      set((state) => ({
        page: {
          ...state.page,
          cmsConnection: connection
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
      const normalizedPage = ensureUniqueBlocks(nextPage)
      // Reset undo/redo history for the new page
      hist.length = 0
      hist.push(JSON.parse(JSON.stringify(normalizedPage)) as BuilderPage)
      histIdx = 0
      set({
        page: normalizedPage,
        selectedBlockId: normalizedPage.blocks[0]?.id ?? null,
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
