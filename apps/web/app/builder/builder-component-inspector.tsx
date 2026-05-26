'use client'

import * as React from 'react'
import type { PageBlock, BuilderStore, ComponentElement } from '@randee/builder'
import type { StoreApi } from 'zustand'
import { getBlockDisplayName, resolveComponentDesign, createElementId } from '@randee/builder'
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  LayoutGrid,
  PanelRightClose,
  Palette,
  RefreshCw,
  Settings2,
} from 'lucide-react'
import {
  InspectorLabel,
  InspectorNumberField,
  InspectorSection,
  InspectorSelectField,
  InspectorSpacingBox,
  InspectorTabs,
  InspectorThemeProvider,
  type InspectorTheme,
} from './builder-inspector-ui'
import { ComponentRootPropsFields, ElementPropsFields } from './builder-element-props-fields'
import { SliderInspector } from './builder-slider-inspector'
import { BuilderElementInspector } from './builder-element-inspector'

// ─── Types ───────────────────────────────────────────────────────────────────
type Props = {
  block: PageBlock | undefined
  store: StoreApi<BuilderStore>
  templateLabel?: string
  theme: InspectorTheme
  selectedElementId?: string | null
  onSelectElement?: (elementId: string | null) => void
  onClose: () => void
  onOpenCodeAsset?: (path: string, label: string) => void
  onSyncCodeLayout?: () => Promise<void> | void
  compactTabs?: boolean
}

// ─── Preset definitions ──────────────────────────────────────────────────────
const PRESETS: Array<{ label: string; icon: string; build: () => ComponentElement[] }> = [
  {
    label: 'Герой',
    icon: '⬜',
    build: (): ComponentElement[] => {
      const cId = createElementId('container')
      const hId = createElementId('heading')
      const tId = createElementId('text')
      const bId = createElementId('button')
      return [
        { id: cId, elementId: 'container', name: 'Container', parentId: null, props: {} },
        { id: hId, elementId: 'heading', name: 'Заголовок', parentId: cId, props: { label: 'Заголовок героя' } },
        { id: tId, elementId: 'text', name: 'Текст', parentId: cId, props: { label: 'Описание или подзаголовок' } },
        { id: bId, elementId: 'button', name: 'Кнопка', parentId: cId, props: { label: 'Подробнее' } },
      ]
    },
  },
  {
    label: '2 Колонки',
    icon: '⣿',
    build: (): ComponentElement[] => {
      const colsId = createElementId('columns')
      const col1 = createElementId('container')
      const col2 = createElementId('container')
      const hId = createElementId('heading')
      const imgId = createElementId('image')
      return [
        { id: colsId, elementId: 'columns', name: 'Колонки', parentId: null, props: { columns: '2', gap: '24' } },
        { id: col1, elementId: 'container', name: 'Левая', parentId: colsId, props: {} },
        { id: col2, elementId: 'container', name: 'Правая', parentId: colsId, props: {} },
        { id: hId, elementId: 'heading', name: 'Заголовок', parentId: col1, props: { label: 'Заголовок' } },
        { id: imgId, elementId: 'image', name: 'Картинка', parentId: col2, props: { src: '', alt: 'Изображение' } },
      ]
    },
  },
  {
    label: 'Карточка',
    icon: '▬',
    build: (): ComponentElement[] => {
      const cId = createElementId('container')
      const imgId = createElementId('image')
      const hId = createElementId('heading')
      const tId = createElementId('text')
      const bId = createElementId('button')
      return [
        { id: cId, elementId: 'container', name: 'Карточка', parentId: null, props: {} },
        { id: imgId, elementId: 'image', name: 'Изображение', parentId: cId, props: { src: '', alt: 'Фото' } },
        { id: hId, elementId: 'heading', name: 'Заголовок', parentId: cId, props: { label: 'Заголовок карточки' } },
        { id: tId, elementId: 'text', name: 'Текст', parentId: cId, props: { label: 'Описание карточки' } },
        { id: bId, elementId: 'button', name: 'Кнопка', parentId: cId, props: { label: 'Читать далее' } },
      ]
    },
  },
  {
    label: 'Форма',
    icon: '▤',
    build: (): ComponentElement[] => {
      const cId = createElementId('container')
      const hId = createElementId('heading')
      const fId = createElementId('text-field')
      const bId = createElementId('button')
      return [
        { id: cId, elementId: 'container', name: 'Форма', parentId: null, props: {} },
        { id: hId, elementId: 'heading', name: 'Заголовок', parentId: cId, props: { label: 'Заголовок формы' } },
        { id: fId, elementId: 'text-field', name: 'Поле', parentId: cId, props: { placeholder: 'Введите…', label: 'Поле ввода' } },
        { id: bId, elementId: 'button', name: 'Отправить', parentId: cId, props: { label: 'Отправить' } },
      ]
    },
  },
]

// ─── Small helpers ───────────────────────────────────────────────────────────
function inputCss(theme: InspectorTheme): React.CSSProperties {
  return {
    border: `1px solid ${theme.divider}`,
    background: theme.inputBg,
    color: theme.text,
    borderRadius: 6,
    height: 28,
    padding: '0 8px',
    fontSize: 11,
    outline: 'none',
    width: '100%',
  }
}

// ─── Breadcrumb helpers ──────────────────────────────────────────────────────

/** Строит цепочку предков от корня до элемента */
function buildElementPath(elements: ComponentElement[], elementId: string): ComponentElement[] {
  const map = new Map(elements.map((el) => [el.id, el]))
  const path: ComponentElement[] = []
  let current: ComponentElement | undefined = map.get(elementId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? map.get(current.parentId) : undefined
  }
  return path
}

/** Breadcrumb-строка: Компонент › Container › Button */
function ElementBreadcrumb({
  elements,
  selectedElementId,
  componentName,
  theme,
  onSelect,
}: {
  elements: ComponentElement[]
  selectedElementId: string
  componentName: string
  theme: InspectorTheme
  onSelect: (id: string | null) => void
}) {
  const path = React.useMemo(
    () => buildElementPath(elements, selectedElementId),
    [elements, selectedElementId]
  )

  return (
    <div
      className="flex min-w-0 items-center gap-0.5 overflow-x-auto px-3 py-1"
      style={{
        borderBottom: `1px solid ${theme.divider}`,
        background: theme.panel,
        scrollbarWidth: 'none',
      }}
    >
      {/* Корень — имя компонента */}
      <button
        type="button"
        className="shrink-0 rounded px-1 text-[10px] font-medium"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.accent }}
        onClick={() => onSelect(null)}
        title="К компоненту"
      >
        {componentName}
      </button>

      {path.map((el, i) => {
        const isLast = i === path.length - 1
        return (
          <React.Fragment key={el.id}>
            <ChevronRight className="h-2.5 w-2.5 shrink-0" style={{ color: theme.textMuted }} />
            <button
              type="button"
              className="shrink-0 truncate rounded px-1 text-[10px]"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: isLast ? 'default' : 'pointer',
                color: isLast ? theme.text : theme.textMuted,
                fontWeight: isLast ? 700 : 400,
                maxWidth: 80,
              }}
              onClick={() => { if (!isLast) onSelect(el.id) }}
              title={el.name ?? el.elementId}
            >
              {el.name ?? el.elementId}
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export function BuilderComponentInspector({
  block,
  store,
  templateLabel,
  theme,
  selectedElementId,
  onSelectElement,
  onClose,
  onOpenCodeAsset,
  onSyncCodeLayout,
  compactTabs = false,
}: Props) {
  const displayName = block ? getBlockDisplayName(block, templateLabel) : 'Компонент'
  const isCmsSlider = block?.template === 'component-03'
  const design = React.useMemo(() => resolveComponentDesign(block?.design), [block?.design])
  const fillHex = React.useMemo(() => {
    const n = String(design.fill ?? 'FFFFFF').replace(/[^a-fA-F0-9]/g, '').slice(0, 6).toUpperCase()
    return n || 'FFFFFF'
  }, [design.fill])
  const [componentTab, setComponentTab] = React.useState<'layout' | 'style' | 'advanced'>('layout')
  const [syncingCode, setSyncingCode] = React.useState(false)
  const [syncStatus, setSyncStatus] = React.useState<string | null>(null)

  const selectedElement = React.useMemo(
    () => block?.elements?.find((el) => el.id === selectedElementId),
    [block?.elements, selectedElementId],
  )
  const isColumnsEl = selectedElement?.elementId === 'columns'
  const [elementTab, setElementTab] = React.useState<'layout' | 'style' | 'advanced'>('layout')

  const patchDesign = React.useCallback(
    (patch: Parameters<BuilderStore['updateBlockDesign']>[1]) => {
      if (!block) return
      store.getState().updateBlockDesign(block.id, patch)
    },
    [block, store],
  )
  const patchProps = React.useCallback(
    (props: Record<string, string>) => {
      if (!block) return
      store.getState().updateBlockProps(block.id, props)
    },
    [block, store],
  )

  // ── Element selected → columns special case ─────────────────────────────
  if (block && selectedElement && isColumnsEl) {
    const sid = selectedElement.id
    return (
      <InspectorThemeProvider theme={theme}>
        <aside className="flex h-full flex-col overflow-hidden" style={{ background: theme.panel, color: theme.text }}>
          {/* Header */}
          <div className="flex h-9 shrink-0 items-center gap-2 px-3" style={{ borderBottom: `1px solid ${theme.divider}` }}>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{ background: theme.inputBg, border: `1px solid ${theme.divider}`, cursor: 'pointer', color: theme.textMuted }}
              onClick={() => onSelectElement?.('')}
              title="Назад к компоненту"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold" style={{ color: theme.text }}>
                {selectedElement.name ?? 'Колонки'}
              </p>
            </div>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
              style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={onClose}
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Breadcrumb */}
          {block?.elements && (
            <ElementBreadcrumb
              elements={block.elements}
              selectedElementId={selectedElement.id}
              componentName={displayName}
              theme={theme}
              onSelect={(id) => onSelectElement?.(id ?? '')}
            />
          )}

          <InspectorTabs
            value={elementTab}
            compact={compactTabs}
            onChange={(value) => setElementTab(value as 'layout' | 'style' | 'advanced')}
            tabs={[
              { value: 'layout', label: 'Макет', icon: LayoutGrid },
              { value: 'style', label: 'Стиль', icon: Palette },
              { value: 'advanced', label: 'Дополнительно', icon: Settings2 },
            ]}
          />

          <div className="min-h-0 flex-1 overflow-y-auto">
            {elementTab === 'layout' ? (
              <InspectorSection title="Настройка колонок">
                <div className="grid gap-2">
                  <label className="grid gap-1">
                    <InspectorLabel>Колонки</InspectorLabel>
                    <input
                      type="number" min={1} max={16}
                      style={inputCss(theme)}
                      value={selectedElement.props.columns ?? '2'}
                      onChange={(e) =>
                        store.getState().updateElementProps(block.id, sid, {
                          columns: String(Math.max(1, Math.min(16, Number(e.target.value) || 1)))
                        })
                      }
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1">
                      <InspectorLabel>Планшет</InspectorLabel>
                      <input
                        type="number" min={1} max={16}
                        style={inputCss(theme)}
                        value={selectedElement.props.columnsTablet ?? selectedElement.props.columns ?? '2'}
                        onChange={(e) =>
                          store.getState().updateElementProps(block.id, sid, {
                            columnsTablet: String(Math.max(1, Math.min(16, Number(e.target.value) || 1)))
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1">
                      <InspectorLabel>Мобильный</InspectorLabel>
                      <input
                        type="number" min={1} max={16}
                        style={inputCss(theme)}
                        value={selectedElement.props.columnsMobile ?? '1'}
                        onChange={(e) =>
                          store.getState().updateElementProps(block.id, sid, {
                            columnsMobile: String(Math.max(1, Math.min(16, Number(e.target.value) || 1)))
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="grid gap-1">
                    <InspectorLabel>Промежуток, px</InspectorLabel>
                    <input
                      type="number" min={0} max={64}
                      style={inputCss(theme)}
                      value={selectedElement.props.gap ?? '16'}
                      onChange={(e) =>
                        store.getState().updateElementProps(block.id, sid, {
                          gap: String(Math.max(0, Math.min(64, Number(e.target.value) || 0)))
                        })
                      }
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1">
                      <InspectorLabel>Промеж. планшет</InspectorLabel>
                      <input
                        type="number" min={0} max={64}
                        style={inputCss(theme)}
                        value={selectedElement.props.gapTablet ?? selectedElement.props.gap ?? '16'}
                        onChange={(e) =>
                          store.getState().updateElementProps(block.id, sid, {
                            gapTablet: String(Math.max(0, Math.min(64, Number(e.target.value) || 0)))
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1">
                      <InspectorLabel>Промеж. мобильный</InspectorLabel>
                      <input
                        type="number" min={0} max={64}
                        style={inputCss(theme)}
                        value={selectedElement.props.gapMobile ?? '12'}
                        onChange={(e) =>
                          store.getState().updateElementProps(block.id, sid, {
                            gapMobile: String(Math.max(0, Math.min(64, Number(e.target.value) || 0)))
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="grid gap-1">
                    <InspectorLabel>Мин. высота, px</InspectorLabel>
                    <input
                      type="number" min={0} max={2000}
                      style={inputCss(theme)}
                      value={selectedElement.props.minHeight ?? '120'}
                      onChange={(e) =>
                        store.getState().updateElementProps(block.id, sid, {
                          minHeight: String(Math.max(0, Math.min(2000, Number(e.target.value) || 0)))
                        })
                      }
                    />
                  </label>
                  <label className="grid gap-1">
                    <InspectorLabel>Выравнивание</InspectorLabel>
                    <select
                      style={inputCss(theme)}
                      value={selectedElement.props.align ?? 'stretch'}
                      onChange={(e) =>
                        store.getState().updateElementProps(block.id, sid, { align: e.target.value })
                      }
                    >
                      <option value="stretch">По растяжению</option>
                      <option value="start">Начало</option>
                      <option value="center">По центру</option>
                      <option value="end">Конец</option>
                    </select>
                  </label>
                </div>
              </InspectorSection>
            ) : null}

            {elementTab === 'style' ? (
              <InspectorSection title="Стиль колонок">
                <p className="text-[10px]" style={{ color: theme.textMuted }}>
                  Отдельные стилевые свойства для колонок будут доступны здесь.
                </p>
              </InspectorSection>
            ) : null}

            {elementTab === 'advanced' ? (
              <div className="px-3 py-3">
                <button
                  type="button"
                  className="h-7 w-full rounded-md text-[11px] font-medium"
                  style={{ background: '#2a1010', color: '#ef4444', border: '1px solid #3a1010', cursor: 'pointer' }}
                  onClick={() => {
                    store.getState().removeElement(block.id, sid)
                    onSelectElement?.('')
                  }}
                >
                  Удалить колонки
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </InspectorThemeProvider>
    )
  }

  // ── Element selected → regular element ───────────────────────────────────
  if (block && selectedElement) {
    const sid = selectedElement.id
    return (
      <InspectorThemeProvider theme={theme}>
        <aside className="flex h-full flex-col overflow-hidden" style={{ background: theme.panel, color: theme.text }}>
          {/* Header */}
          <div className="flex h-9 shrink-0 items-center gap-2 px-3" style={{ borderBottom: `1px solid ${theme.divider}` }}>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{ background: theme.inputBg, border: `1px solid ${theme.divider}`, cursor: 'pointer', color: theme.textMuted }}
              onClick={() => onSelectElement?.('')}
              title="Назад к компоненту"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold" style={{ color: theme.text }}>
                {selectedElement.name ?? selectedElement.elementId}
              </p>
            </div>
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
              style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={onClose}
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Breadcrumb: Компонент › Container › Button */}
          {block?.elements && (
            <ElementBreadcrumb
              elements={block.elements}
              selectedElementId={selectedElement.id}
              componentName={displayName}
              theme={theme}
              onSelect={(id) => onSelectElement?.(id ?? '')}
            />
          )}

          {/* Element inspector — handles all design sections + delete button */}
              <BuilderElementInspector
            element={selectedElement}
            theme={theme}
            onPatch={(patch) => store.getState().updateElementDesign(block.id, sid, patch)}
            onRemove={() => {
              store.getState().removeElement(block.id, sid)
              onSelectElement?.('')
            }}
            compactTabs={compactTabs}
            contentFields={
              <ElementPropsFields
                block={block}
                elementId={sid}
                store={store}
                inputStyle={inputCss(theme)}
                labelColor={theme.textSecondary}
              />
            }
          />
        </aside>
      </InspectorThemeProvider>
    )
  }

  // ── No element selected → Component root inspector ────────────────────────
  return (
    <InspectorThemeProvider theme={theme}>
      <aside className="flex h-full flex-col overflow-hidden" style={{ background: theme.panel, color: theme.text }}>

        {/* Header */}
        <div className="flex h-9 shrink-0 items-center gap-2 px-3" style={{ borderBottom: `1px solid ${theme.divider}` }}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold" style={{ color: theme.text }}>
              {displayName}
            </p>
            <p className="text-[10px]" style={{ color: theme.textMuted }}>Настройки компонента</p>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
            style={{ color: theme.textMuted, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={onClose}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <InspectorTabs
          value={componentTab}
          compact={compactTabs}
          onChange={(value) => setComponentTab(value as 'layout' | 'style' | 'advanced')}
          tabs={[
            { value: 'layout', label: 'Макет', icon: LayoutGrid },
            { value: 'style', label: 'Стиль', icon: Palette },
            { value: 'advanced', label: 'Дополнительно', icon: Settings2 },
          ]}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!block ? (
            <p className="px-3 py-4 text-xs" style={{ color: theme.textMuted }}>
              Выберите компонентный блок на canvas.
            </p>
          ) : (
            <>
              {componentTab === 'layout' ? (
                <>
                  {/* ── Presets ───────────────────────────────── */}
                  <InspectorSection title="Пресеты макета">
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium"
                          style={{
                            border: `1px solid ${theme.divider}`,
                            background: theme.inputBg,
                            color: theme.textSecondary,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            const hasExisting = (block.elements?.length ?? 0) > 0
                            if (
                              hasExisting &&
                              !window.confirm(`Заменить ${block.elements!.length} элемент(ов) пресетом «${preset.label}»?`)
                            )
                              return
                            store.getState().replaceElements(block.id, preset.build())
                          }}
                        >
                          <span aria-hidden>{preset.icon}</span>
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </InspectorSection>

                  {/* ── Component props (CMS slider vs generic) ── */}
                  <InspectorSection title={isCmsSlider ? 'Управление слайдером' : 'Свойства компонента'}>
                    {isCmsSlider ? (
                      <SliderInspector
                        block={block}
                        store={store}
                        inputStyle={inputCss(theme)}
                        labelColor={theme.textSecondary}
                      />
                    ) : (
                      <ComponentRootPropsFields
                        block={block}
                        store={store}
                        inputStyle={inputCss(theme)}
                        labelColor={theme.textSecondary}
                      />
                    )}
                  </InspectorSection>

                  {/* ── Size ─────────────────────────────────────── */}
                  <InspectorSection title="Размер">
                    <div className="grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="grid gap-1">
                          <InspectorLabel>Высота, px</InspectorLabel>
                          <input
                            type="number"
                            min={0}
                            style={inputCss(theme)}
                            value={design.size.height === 0 ? '' : String(design.size.height)}
                            placeholder="авто"
                            onChange={(e) => {
                              if (e.target.value === '') { patchDesign({ size: { height: 0 } }); return }
                              const n = Number(e.target.value)
                              if (Number.isFinite(n))
                                patchDesign({ size: { height: Math.max(0, n), ...(design.size.heightMode === 'hug' ? { heightMode: 'fixed' } : {}) } })
                            }}
                          />
                        </label>
                        <InspectorSelectField
                          label="Режим высоты"
                          value={design.size.heightMode}
                          options={[
                            { value: 'fixed', label: 'Фиксированная' },
                            { value: 'fill', label: '% окна' },
                            { value: 'hug', label: 'По содержимому' },
                          ]}
                          onChange={(v) => patchDesign({ size: { heightMode: v as 'fixed' | 'fill' | 'hug' } })}
                        />
                      </div>
                      <InspectorSelectField
                        label="Ширина контейнера"
                        value={design.size.widthMode}
                        options={[
                          { value: 'fixed', label: 'Фиксированная' },
                          { value: 'fill', label: 'По ширине окна' },
                          { value: 'hug', label: 'По содержимому' },
                        ]}
                        onChange={(v) => patchDesign({ size: { widthMode: v as 'fixed' | 'fill' | 'hug' } })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <InspectorSelectField
                          label="Выравнивание в окне"
                          value={design.layout.distribute}
                          options={[
                            { value: 'start', label: 'Сверху' },
                            { value: 'center', label: 'По центру' },
                            { value: 'end', label: 'Снизу' },
                            { value: 'space-between', label: 'Равномерно' },
                          ]}
                          onChange={(v) => patchDesign({ layout: { distribute: v as 'start' | 'center' | 'end' | 'space-between' } })}
                        />
                        <InspectorSelectField
                          label="Выравнивание контента"
                          value={design.layout.align}
                          options={[
                            { value: 'start', label: 'Начало' },
                            { value: 'center', label: 'По центру' },
                            { value: 'end', label: 'Конец' },
                          ]}
                          onChange={(v) => patchDesign({ layout: { align: v as 'start' | 'center' | 'end' } })}
                        />
                      </div>
                    </div>
                  </InspectorSection>

                  {/* ── Padding & gap ─────────────────────────── */}
                  <InspectorSection title="Отступы">
                    <div className="grid gap-2">
                      <InspectorSpacingBox
                        paddingIndividual={design.layout.paddingIndividual}
                        paddingTop={design.layout.paddingTop}
                        paddingRight={design.layout.paddingRight}
                        paddingBottom={design.layout.paddingBottom}
                        paddingLeft={design.layout.paddingLeft}
                        padding={design.layout.padding}
                        onPaddingChange={(side, value) => {
                          if (side === 'all') {
                            patchDesign({ layout: { padding: value } })
                          } else {
                            const key = `padding${side.charAt(0).toUpperCase()}${side.slice(1)}` as
                              | 'paddingTop'
                              | 'paddingRight'
                              | 'paddingBottom'
                              | 'paddingLeft'
                            patchDesign({ layout: { [key]: value } })
                          }
                        }}
                        onPaddingIndividualChange={(individual) =>
                          patchDesign({ layout: { paddingIndividual: individual } })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <InspectorNumberField
                          label="Промежуток"
                          value={design.layout.gap}
                          min={0}
                          onChange={(gap) => patchDesign({ layout: { gap } })}
                        />
                        <InspectorSelectField
                          label="Переполнение"
                          value={String(block.props?.overflow ?? 'visible')}
                          options={[
                            { value: 'visible', label: 'Видимое' },
                            { value: 'hidden', label: 'Скрыть' },
                            { value: 'auto', label: 'Авто' },
                          ]}
                          onChange={(overflow) => patchProps({ overflow })}
                        />
                      </div>
                    </div>
                  </InspectorSection>
                </>
              ) : null}

              {componentTab === 'style' ? (
                <>
                  {/* ── Background ────────────────────────────── */}
                  <InspectorSection title="Фон">
                    <div className="grid gap-2">
                      <label className="grid gap-1">
                        <InspectorLabel>Цвет фона</InspectorLabel>
                        <div className="flex items-center gap-2">
                          <label
                            className="relative inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full"
                            style={{ border: `1px solid ${theme.divider}` }}
                            title="Выбрать цвет"
                          >
                            <span aria-hidden className="h-full w-full" style={{ background: `#${fillHex}` }} />
                            <input
                              type="color"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              value={`#${fillHex}`}
                              onChange={(e) => patchDesign({ fill: e.target.value.replace('#', '').toUpperCase() })}
                            />
                          </label>
                          <input
                            type="text"
                            className="h-7 min-w-0 flex-1 rounded-md px-2 text-[11px] uppercase outline-none"
                            style={{ border: `1px solid ${theme.divider}`, background: theme.inputBg, color: theme.text }}
                            value={fillHex}
                            maxLength={6}
                            onChange={(e) => {
                              const next = e.target.value.replace(/[^a-fA-F0-9]/gi, '').slice(0, 6).toUpperCase()
                              patchDesign({ fill: next || 'FFFFFF' })
                            }}
                            placeholder="141518"
                          />
                        </div>
                      </label>

                      <label className="grid gap-1">
                        <InspectorLabel>URL фонового изображения</InspectorLabel>
                        <input
                          type="text"
                          style={inputCss(theme)}
                          value={String(block.props?.bgImage ?? '')}
                          onChange={(e) => patchProps({ bgImage: e.target.value })}
                          placeholder="https://..."
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <InspectorSelectField
                          label="Parallax"
                          value={String(block.props?.bgAttachment ?? 'scroll')}
                          options={[
                            { value: 'scroll', label: 'Прокручивается' },
                            { value: 'fixed', label: 'Фиксированный' },
                          ]}
                          onChange={(bgAttachment) => patchProps({ bgAttachment })}
                        />
                        <InspectorSelectField
                          label="Позиция"
                          value={String(block.props?.bgPosition ?? 'center')}
                          options={[
                            { value: 'left', label: 'Слева' },
                            { value: 'center', label: 'По центру' },
                            { value: 'right', label: 'Справа' },
                          ]}
                          onChange={(bgPosition) => patchProps({ bgPosition })}
                        />
                      </div>
                    </div>
                  </InspectorSection>

                  {/* ── Скругление и прозрачность ─────────────── */}
                  <InspectorSection title="Внешний вид">
                    <div className="grid gap-2">
                      <InspectorNumberField
                        label="Скругление углов, px"
                        value={design.borderRadius ?? 0}
                        min={0}
                        max={256}
                        onChange={(borderRadius) => patchDesign({ borderRadius })}
                      />
                      <label className="grid gap-1">
                        <InspectorLabel>Прозрачность, %</InspectorLabel>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={design.opacity ?? 100}
                            className="min-w-0 flex-1"
                            style={{ accentColor: theme.accent }}
                            onChange={(e) => patchDesign({ opacity: Number(e.target.value) })}
                          />
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="h-7 w-14 rounded-md px-2 text-[11px] outline-none"
                            style={{ border: `1px solid ${theme.divider}`, background: theme.inputBg, color: theme.text }}
                            value={design.opacity ?? 100}
                            onChange={(e) =>
                              patchDesign({ opacity: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                            }
                          />
                        </div>
                      </label>
                    </div>
                  </InspectorSection>
                </>
              ) : null}

              {componentTab === 'advanced' ? (
                <>
                  {/* ── Code files ────────────────────────────── */}
                  {onOpenCodeAsset ? (
                    <InspectorSection title="Код компонента">
                      <div className="grid gap-1.5">
                        {onSyncCodeLayout ? (
                          <button
                            type="button"
                            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md text-[11px] font-medium"
                            style={{
                              background: theme.inputBg,
                              color: theme.textSecondary,
                              border: `1px solid ${theme.divider}`,
                              cursor: syncingCode ? 'wait' : 'pointer',
                            }}
                            disabled={syncingCode}
                            onClick={async () => {
                              try {
                                setSyncingCode(true)
                                setSyncStatus(null)
                                await onSyncCodeLayout()
                                setSyncStatus('Код обновлён ✓')
                              } catch {
                                setSyncStatus('Ошибка синхронизации')
                              } finally {
                                setSyncingCode(false)
                              }
                            }}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${syncingCode ? 'animate-spin' : ''}`} />
                            {syncingCode ? 'Синхронизация…' : 'Синхронизировать в код'}
                          </button>
                        ) : null}

                        <div className="grid grid-cols-3 gap-1">
                          {(['preview.tsx', 'style.css', 'script.js'] as const).map((file) => (
                            <button
                              key={file}
                              type="button"
                              className="flex h-8 items-center justify-center gap-1 rounded-md text-[10px] font-medium"
                              style={{
                                background: theme.inputBg,
                                color: theme.textSecondary,
                                border: `1px solid ${theme.divider}`,
                                cursor: 'pointer',
                              }}
                              onClick={() => onOpenCodeAsset(file, file)}
                            >
                              <Code2 className="h-3 w-3" />
                              {file}
                            </button>
                          ))}
                        </div>

                        {syncStatus ? (
                          <p
                            className="text-[10px]"
                            style={{ color: syncStatus.includes('Ошибка') ? '#ef4444' : '#22c55e' }}
                          >
                            {syncStatus}
                          </p>
                        ) : null}

                        <p className="text-[10px] leading-relaxed" style={{ color: theme.textMuted }}>
                          Редактируйте preview.tsx, style.css или script.js напрямую. Синхронизация обновляет layout.generated.tsx из слоёв.
                        </p>
                      </div>
                    </InspectorSection>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </InspectorThemeProvider>
  )
}
