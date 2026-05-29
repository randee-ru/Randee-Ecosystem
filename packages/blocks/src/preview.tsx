'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import { getBlockTemplate } from './registry'
import { ElementCanvas } from './components/element-canvas'
import type { CanvasElementOptions } from './components/element-canvas'
import { useTemplateRevision } from './template-revision-context'

type BlockPreviewProps = {
  block: PageBlock
  elementOptions?: CanvasElementOptions
}

// ── Экспортное имя из preview.tsx по templateId ─────────────────────────────
// component-05 → Component05Preview
function previewExportName(templateId: string): string {
  return (
    templateId
      .split(/[-.]/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('') + 'Preview'
  )
}

// ── Динамическая загрузка реального preview.tsx пользовательского компонента ─
// При смене revision (сохранение файла / автосинк) — перезагружает модуль.
function UserComponentViewPreview({
  block,
  revision,
  fallback
}: {
  block: PageBlock
  revision: number
  fallback: React.ReactNode
}) {
  type State =
    | { status: 'loading' }
    | { status: 'ready'; Comp: React.ComponentType<{ block: PageBlock }> }
    | { status: 'fallback' }

  const [state, setState] = React.useState<State>({ status: 'loading' })
  const revisionRef = React.useRef(revision)

  React.useEffect(() => {
    let cancelled = false
    revisionRef.current = revision
    setState({ status: 'loading' })

    // Динамический импорт — Turbopack компилирует на лету в dev-режиме.
    // В production компоненты не существуют статически → падаем на fallback.
    import(`./templates/component/${block.template}/preview`)
      .then((mod: Record<string, unknown>) => {
        if (cancelled) return
        const name = previewExportName(block.template)
        const Comp = (mod[name] ?? mod['default']) as React.ComponentType<{ block: PageBlock }> | undefined
        if (typeof Comp === 'function') {
          setState({ status: 'ready', Comp })
        } else {
          setState({ status: 'fallback' })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'fallback' })
      })

    return () => {
      cancelled = true
    }
  // revision меняется → сохранение файла → перезагружаем модуль
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.template, revision])

  if (state.status === 'loading') {
    // Тонкая заглушка пока грузится
    return (
      <div
        style={{
          width: '100%',
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.4,
          fontSize: 12,
          color: '#94a3b8'
        }}
      >
        …
      </div>
    )
  }

  if (state.status === 'fallback') {
    return <>{fallback}</>
  }

  const { Comp } = state
  return <Comp block={block} />
}

export function BlockPreview({ block, elementOptions }: BlockPreviewProps) {
  const entry = getBlockTemplate(block.template)
  const revision = useTemplateRevision(block.template)

  if (!entry) {
    return (
      <section className="border-b border-neutral-100 px-10 py-10 text-neutral-900">
        <p className="font-semibold capitalize">{block.type}</p>
        <p className="mt-1 text-sm text-neutral-500">{block.template}</p>
      </section>
    )
  }

  const Preview = entry.Preview

  // ── Режим редактирования artboard: ElementCanvas с drag-and-drop ─────────
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

  // ── View-режим пользовательских компонентов ───────────────────────────────
  // Загружаем реальный preview.tsx через динамический import.
  // Перезагружается при каждом сохранении файла (bumpTemplateRevision → revision).
  if (block.type === 'component' && !elementOptions?.onDropElement) {
    const fallback = block.elements?.length ? (
      <Preview
        block={block}
        elementOptions={{
          selectedElementId: elementOptions?.selectedElementId,
          onSelectElement: elementOptions?.onSelectElement,
          viewport: elementOptions?.viewport,
          cmsPreviewValues: elementOptions?.cmsPreviewValues
        }}
      />
    ) : (
      <Preview block={block} />
    )

    return (
      <UserComponentViewPreview
        key={block.template}
        block={block}
        revision={revision}
        fallback={fallback}
      />
    )
  }

  // ── forceVisual / элементы без режима редактирования ─────────────────────
  if (block.type === 'component' && (block.elements?.length || elementOptions?.forceVisual)) {
    return (
      <Preview
        block={block}
        elementOptions={{
          selectedElementId: elementOptions?.selectedElementId,
          onSelectElement: elementOptions?.onSelectElement,
          onDeleteElement: elementOptions?.onDeleteElement,
          onDropElement: elementOptions?.onDropElement,
          onPatchElementProps: elementOptions?.onPatchElementProps,
          viewport: elementOptions?.viewport,
          cmsPreviewValues: elementOptions?.cmsPreviewValues
        }}
      />
    )
  }

  return <Preview block={block} />
}
