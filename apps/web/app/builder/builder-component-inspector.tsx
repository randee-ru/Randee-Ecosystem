'use client'

import * as React from 'react'
import type { PageBlock } from '@randee/builder'
import type { BuilderStore } from '@randee/builder'
import { getBlockDisplayName, resolveComponentDesign } from '@randee/builder'
import type { StoreApi } from 'zustand'
import {
  AlignCenterHorizontal,
  AlignStartHorizontal,
  AlignEndHorizontal,
  ArrowDown,
  ArrowRight,
  PanelRightClose
} from 'lucide-react'
import {
  InspectorAlignToolbar,
  InspectorColorField,
  InspectorGapField,
  InspectorIconToggle,
  InspectorLabel,
  InspectorNumberField,
  InspectorSection,
  InspectorSegmented,
  InspectorSelectField,
  InspectorSizeRow,
  InspectorStepper,
  InspectorThemeProvider,
  type InspectorTheme
} from './builder-inspector-ui'
import { BlockPropsFields } from './builder-block-props-fields'
import { ComponentRootPropsFields, ElementPropsFields } from './builder-element-props-fields'
import { getElementVariant } from '@randee/blocks'

type BuilderComponentInspectorProps = {
  block: PageBlock | undefined
  store: StoreApi<BuilderStore>
  templateLabel?: string
  theme: InspectorTheme
  selectedElementId?: string | null
  onClose: () => void
}

export function BuilderComponentInspector({
  block,
  store,
  templateLabel,
  theme,
  selectedElementId,
  onClose
}: BuilderComponentInspectorProps) {
  const design = resolveComponentDesign(block?.design)
  const displayName = block ? getBlockDisplayName(block, templateLabel) : 'Component'

  const patch = (next: Parameters<BuilderStore['updateBlockDesign']>[1]) => {
    if (!block) return
    store.getState().updateBlockDesign(block.id, next)
  }

  return (
    <InspectorThemeProvider theme={theme}>
      <aside
        className="flex h-full flex-col overflow-hidden"
        style={{ background: theme.panel, color: theme.text }}
      >
        <InspectorAlignToolbar />

        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: `1px solid ${theme.divider}` }}
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold" style={{ color: theme.text }}>
              Edit Component
            </p>
            <p className="truncate text-[10px]" style={{ color: theme.textMuted }}>
              {displayName}
            </p>
          </div>
          <button
            type="button"
            data-testid="hide-component-inspector"
            className="flex h-7 w-7 items-center justify-center rounded"
            style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = theme.hover
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = 'transparent'
            }}
            onClick={onClose}
            aria-label="Close inspector"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!block ? (
            <p className="px-3 py-4 text-xs" style={{ color: theme.textMuted }}>
              Select a component block on the canvas.
            </p>
          ) : (
            <>
              <InspectorSection title="Template" onAdd={() => undefined} />

              {selectedElementId && block ? (
                <InspectorSection
                  title={`Element · ${getElementVariant(block.elements?.find((item) => item.id === selectedElementId)?.elementId ?? '')?.name ?? 'Selected'}`}
                >
                  <ElementPropsFields
                    block={block}
                    elementId={selectedElementId}
                    store={store}
                    inputStyle={{
                      border: `1px solid ${theme.divider}`,
                      background: theme.inputBg,
                      color: theme.text,
                      borderRadius: 6,
                      height: 28,
                      padding: '0 8px',
                      fontSize: 11,
                      outline: 'none'
                    }}
                    labelColor={theme.textSecondary}
                  />
                  <button
                    type="button"
                    className="mt-2 text-[10px] underline"
                    style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      store.getState().removeElement(block.id, selectedElementId)
                    }}
                  >
                    Remove element
                  </button>
                </InspectorSection>
              ) : null}

              <InspectorSection title="Component">
                <div className="grid gap-2">
                  <ComponentRootPropsFields
                    block={block}
                    store={store}
                    inputStyle={{
                      border: `1px solid ${theme.divider}`,
                      background: theme.inputBg,
                      color: theme.text,
                      borderRadius: 6,
                      height: 28,
                      padding: '0 8px',
                      fontSize: 11,
                      outline: 'none'
                    }}
                    labelColor={theme.textSecondary}
                  />
                  <p className="text-[10px] leading-relaxed" style={{ color: theme.textMuted }}>
                    Код компонента: preview, style.css, script.js — в панели Blocks слева.
                  </p>
                </div>
              </InspectorSection>

              <InspectorSection title="Artboard">
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <InspectorNumberField
                      label="Position"
                      value={design.position.x}
                      onChange={(x) => patch({ position: { x } })}
                    />
                    <InspectorNumberField
                      label="Y"
                      value={design.position.y}
                      onChange={(y) => patch({ position: { y } })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]" style={{ color: theme.textMuted }}>
                    <span>X</span>
                    <span>Y</span>
                  </div>

                  <InspectorSizeRow
                    width={design.size.width}
                    height={design.size.height}
                    widthMode={design.size.widthMode}
                    heightMode={design.size.heightMode}
                    lockAspect={design.size.lockAspect}
                    onWidthChange={(width) => patch({ size: { width } })}
                    onHeightChange={(height) => patch({ size: { height } })}
                    onWidthModeChange={(widthMode) =>
                      patch({ size: { widthMode: widthMode as typeof design.size.widthMode } })
                    }
                    onHeightModeChange={(heightMode) =>
                      patch({ size: { heightMode: heightMode as typeof design.size.heightMode } })
                    }
                    onLockAspectChange={(lockAspect) => patch({ size: { lockAspect } })}
                  />
                </div>
              </InspectorSection>

              <InspectorSection title="Layout">
                <div className="grid gap-3">
                  <InspectorSegmented
                    value={design.layout.type}
                    options={[
                      { value: 'stack', label: 'Stack' },
                      { value: 'grid', label: 'Grid' }
                    ]}
                    onChange={(type) => patch({ layout: { type: type as typeof design.layout.type } })}
                  />

                  <div className="grid gap-1">
                    <InspectorLabel>Direction</InspectorLabel>
                    <div className="flex gap-1">
                      <InspectorIconToggle
                        label="Vertical"
                        active={design.layout.direction === 'vertical'}
                        onClick={() => patch({ layout: { direction: 'vertical' } })}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </InspectorIconToggle>
                      <InspectorIconToggle
                        label="Horizontal"
                        active={design.layout.direction === 'horizontal'}
                        onClick={() => patch({ layout: { direction: 'horizontal' } })}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </InspectorIconToggle>
                    </div>
                  </div>

                  <InspectorSelectField
                    label="Distribute"
                    value={design.layout.distribute}
                    options={[
                      { value: 'start', label: 'Start' },
                      { value: 'center', label: 'Center' },
                      { value: 'end', label: 'End' },
                      { value: 'space-between', label: 'Space Between' }
                    ]}
                    onChange={(distribute) =>
                      patch({ layout: { distribute: distribute as typeof design.layout.distribute } })
                    }
                  />

                  <div className="grid gap-1">
                    <InspectorLabel>Align</InspectorLabel>
                    <div className="flex gap-1">
                      <InspectorIconToggle
                        label="Align start"
                        active={design.layout.align === 'start'}
                        onClick={() => patch({ layout: { align: 'start' } })}
                      >
                        <AlignStartHorizontal className="h-3.5 w-3.5" />
                      </InspectorIconToggle>
                      <InspectorIconToggle
                        label="Align center"
                        active={design.layout.align === 'center'}
                        onClick={() => patch({ layout: { align: 'center' } })}
                      >
                        <AlignCenterHorizontal className="h-3.5 w-3.5" />
                      </InspectorIconToggle>
                      <InspectorIconToggle
                        label="Align end"
                        active={design.layout.align === 'end'}
                        onClick={() => patch({ layout: { align: 'end' } })}
                      >
                        <AlignEndHorizontal className="h-3.5 w-3.5" />
                      </InspectorIconToggle>
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <InspectorLabel>Wrap</InspectorLabel>
                    <InspectorSegmented
                      value={design.layout.wrap ? 'yes' : 'no'}
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' }
                      ]}
                      onChange={(wrap) => patch({ layout: { wrap: wrap === 'yes' } })}
                    />
                  </div>

                  <InspectorGapField
                    value={design.layout.gap}
                    onChange={(gap) => patch({ layout: { gap } })}
                  />

                  <InspectorNumberField
                    label="Padding"
                    value={design.layout.padding}
                    onChange={(padding) => patch({ layout: { padding } })}
                  />
                </div>
              </InspectorSection>

              <InspectorSection title="Typography" info>
                <InspectorStepper
                  label="Base"
                  value={design.typography.baseSize}
                  suffix="PX"
                  min={8}
                  onChange={(baseSize) => patch({ typography: { baseSize } })}
                />
              </InspectorSection>

              <InspectorSection title="Overlays" onAdd={() => undefined} />
              <InspectorSection title="Cursor" onAdd={() => undefined} />
              <InspectorSection title="Effects" onAdd={() => undefined} />

              <InspectorSection title="Styles" onAdd={() => undefined}>
                <div className="grid gap-1">
                  <InspectorLabel>Fill</InspectorLabel>
                  <InspectorColorField value={design.fill} onChange={(fill) => patch({ fill })} />
                </div>
              </InspectorSection>
            </>
          )}
        </div>
      </aside>
    </InspectorThemeProvider>
  )
}
