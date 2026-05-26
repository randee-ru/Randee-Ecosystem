'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import { getBlockTemplate } from './registry'
import { ElementCanvas } from './components/element-canvas'
import type { CanvasElementOptions } from './components/element-canvas'

type BlockPreviewProps = {
  block: PageBlock
  elementOptions?: CanvasElementOptions
}

export function BlockPreview({ block, elementOptions }: BlockPreviewProps) {
  const entry = getBlockTemplate(block.template)

  if (!entry) {
    return (
      <section className="border-b border-neutral-100 px-10 py-10 text-neutral-900">
        <p className="font-semibold capitalize">{block.type}</p>
        <p className="mt-1 text-sm text-neutral-500">{block.template}</p>
      </section>
    )
  }

  const Preview = entry.Preview

  // В режиме редактирования компонента — рендерим новый ElementCanvas
  // с pointer events drag-and-drop, рабочим контекстным меню и горячими клавишами.
  // Если forceVisual=true — пропускаем ElementCanvas и показываем визуальный preview.
  if (block.type === 'component' && elementOptions?.onDropElement && !elementOptions?.forceVisual) {
    const cls = `randee-${block.template.replace(/\./g, '-')}`
    return (
      <div
        className={cls}
        data-randee-template={block.template}
        data-randee-type={block.type}
        style={{ width: '100%', alignSelf: 'stretch', minHeight: 120 }}
      >
        <ElementCanvas
          elements={block.elements ?? []}
          options={elementOptions}
        />
      </div>
    )
  }

  if (block.type === 'component' && (block.elements?.length || elementOptions?.forceVisual)) {
    return <Preview block={block} elementOptions={{
      selectedElementId: elementOptions?.selectedElementId,
      onSelectElement: elementOptions?.onSelectElement,
      onDropElement: elementOptions?.onDropElement,
      onPatchElementProps: elementOptions?.onPatchElementProps,
      viewport: elementOptions?.viewport
    }} />
  }
  return <Preview block={block} />
}
