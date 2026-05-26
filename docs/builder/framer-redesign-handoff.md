# Randee Builder — Framer Redesign Handoff

> **Назначение:** автономный документ для работы с любым AI-ассистентом.  
> Содержит: архитектуру проекта, выполненные спринты, оставшиеся задачи, ключевые файлы и токены.  
> Обновлён: **2026-05-26** — Framer Redesign A–H завершён ✅, актуальны Sprint 8.x задачи

---

## 1. Контекст проекта

**Монорепо:** `/Users/pinomax/Desktop/randee/ Randee Ecosystem`  
(в пути есть пробел — всегда использовать кавычки при работе с путями)

**Стек:**
- Next.js 15 (App Router) + TypeScript strict
- Zustand v5 (vanilla store, без hooks вне компонентов)
- TailwindCSS v4 (через `@import "tailwindcss"`)
- Turbopack (dev-сервер)
- dnd-kit (drag-and-drop в layer tree)

**Пакеты монорепо:**
- `apps/web` — Next.js приложение, builder UI
- `packages/builder` — store, types, logic
- `packages/blocks` — реестр блоков, preview-компоненты

**Запуск dev-сервера:**
```bash
cd "/Users/pinomax/Desktop/randee/ Randee Ecosystem"
pnpm dev
# открывается на http://localhost:3000/builder?slug=/
```

**Проверка TypeScript:**
```bash
npx tsc --noEmit --project apps/web/tsconfig.json --ignoreDeprecations 5.0
```

---

## 2. Ключевые файлы Builder

```
apps/web/app/builder/
├── builder-editor.tsx              # Главный компонент (3000+ строк)
├── builder-left-panel.tsx          # Левая панель (иконная навигация + контент)
├── builder-component-inspector.tsx # Правая панель в Edit Component режиме
├── builder-inspector-ui.tsx        # Примитивы инспектора (Section, Tabs, Label…)
├── builder-canvas-block-overlay.tsx# Рамки/кнопки выделенного блока на канвасе
├── builder-viewport-toolbar.tsx    # Переключатель viewport (desktop/tablet/mobile)
├── builder-component-editor-left.tsx # Layer tree в Edit Component режиме
├── builder-layer-tree.tsx          # Дерево блоков в обычном режиме
├── builder-insert-panel.tsx        # Панель добавления блоков
├── builder-element-inspector.tsx   # Инспектор элемента (в Edit Component)
├── builder-element-props-fields.tsx# Поля props по типу элемента
├── builder-session.ts              # Сохранение состояния в sessionStorage
├── builder-canvas-chrome.tsx       # Линейки, resize handles, константы
└── builder-viewport.tsx            # Логика viewport-размеров

apps/web/app/
├── globals.css                     # CSS токены, dot-grid, scrollbar, glass-классы
└── layout.tsx                      # Inter шрифт (--font-inter), html.dark класс

packages/builder/src/store/
└── builder-store.ts                # Zustand store, undo/redo история

packages/blocks/src/
├── element-canvas.tsx              # Canvas drag-and-drop для элементов
├── element-registry.ts             # Реестр UI-элементов (71 элемент)
└── preview.tsx                     # Preview-рендеринг компонентов
```

---

## 3. Дизайн-токены (Framer dark palette)

Определены в `builder-editor.tsx` в объекте `themeTokens.dark`:

```typescript
// Framer-exact dark palette — не менять без причины
bg:            '#111111'   // фон всего приложения
panel:         '#1C1C1C'   // фон левой/правой панели
panelElevated: '#222222'   // подзаголовок над канвасом
canvas:        '#111111'   // фон рабочей области
chromeBorder:  '#252525'   // граница между секциями
divider:       '#2C2C2C'   // разделители внутри панелей
text:          '#E8E8E8'   // основной текст
textSecondary: '#999999'   // вторичный текст
textMuted:     '#555555'   // неактивный/hint текст
hover:         '#242424'   // hover-фон кнопок
active:        '#2E2E2E'   // active/selected фон
inputBg:       '#252525'   // фон input-полей
accent:        '#0099FF'   // акцентный синий (как Framer)
accentHover:   '#33AAFF'   // hover акцента
toolbar:       'rgba(20,20,20,0.97)'  // floating toolbar
toolbarBorder: '#282828'
menu:          '#1E1E1E'   // выпадающие меню
menuBorder:    '#303030'
segmentTrack:  '#222222'   // фон segment control
segmentActive: '#333333'   // активный сегмент
```

Передаётся как `t` в дочерние компоненты через `inspectorTheme` и напрямую как props.

**Тип `InspectorTheme`** (в `builder-inspector-ui.tsx`):
```typescript
type InspectorTheme = {
  panel, divider, text, textSecondary, textMuted,
  hover, inputBg, accent, segmentTrack, segmentActive, segmentShadow
}
```

---

## 4. Архитектура состояния

```typescript
// Zustand store (packages/builder/src/store/builder-store.ts)
interface BuilderStore {
  page: BuilderPage           // { page, slug, blocks[], vendors[], seo, … }
  selectedBlockId: string | null
  selectedElementId: string | null
  viewport: ViewportMode      // 'desktop' | 'macbook' | 'tablet' | 'mobile'
  
  // Undo/redo (closure-based, MAX_HISTORY=50)
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
  
  // Мутации с автосохранением в историю
  addBlock(block: PageBlock): void
  removeBlock(id: string): void
  duplicateBlock(id: string): void
  updateBlockDesign(id, patch): void
  updateBlockProps(id, props): void
  
  // Elements (Edit Component)
  addElement(blockId, element): void
  removeElement(blockId, elementId): void
  updateElementProps(blockId, elementId, props): void
  updateElementDesign(blockId, elementId, patch): void
  duplicateElement(blockId, elementId): void
  moveElementDirection(blockId, elementId, 'up'|'down'): void
  replaceElements(blockId, elements[]): void
}
```

**Важно:** `store` создаётся один раз через `useState(() => createBuilderStore())` — НЕ глобальный синглтон. Передаётся как prop.

---

## 5. Режим Edit Component

Ключевые переменные в `builder-editor.tsx`:
```typescript
const [componentEditMode, setComponentEditMode] = React.useState(false)
const [componentEditFocus, setComponentEditFocus] = React.useState<'artboard'|'component'>('component')
const [selectedElementId, setSelectedElementId] = ...  // из store
```

При входе в Edit Component:
- `setLeftOpen(true)` + `setLeftTab('assets')` → левая панель показывает ComponentEditorLeftPanel
- `setComponentEditMode(true)` → правая панель показывает BuilderComponentInspector
- Хлебные крошки в топбаре: `Страница / ИмяКомпонента`

---

## 6. Выполненные спринты (A–H) ✅ — Framer Redesign завершён

### Sprint A — Дизайн-токены ✅
**Что сделано:**
- Inter шрифт: `apps/web/app/layout.tsx` → `Inter({ subsets: ['latin','cyrillic'], variable: '--font-inter' })`
- Dot-grid канвас: `globals.css` → `.rb-canvas-dots { background-image: radial-gradient(circle, #282828 1px, transparent 0); background-size: 24px 24px; }`
- Framer-токены в `themeTokens` (см. раздел 3)
- Compact inspector inputs: `h-6`, `rounded`, без borders

### Sprint B — Топбар ✅
**Файл:** `builder-editor.tsx`, `<header>` (строки ~1897–2290)

**Структура топбара (h-10, 40px):**
```
[ToggleLeft] [Randee] [/ ← Страница / КомпонентИмя?]   [PageName ●]   [📱💻🖥📲] [|] [☀/🌙] [💾] [⋯] [Экспорт]
```

- **Левый блок:** `PanelLeftOpen` + "Randee" лого + хлебные крошки в Edit Component режиме
- **Центр (absolute):** название страницы + цветная точка статуса (жёлтая/зелёная/красная)
- **Правый блок:** `BuilderViewportToolbar variant="topbar"` + ThemeToggle + Save иконка + `...` overflow меню + акцентный Export
- **Overflow меню** содержит: Insert, New Component, Edit Component, CMS, Инструкция, JSON, HTML

**Новый variant в `BuilderViewportToolbar`:** `variant='topbar'` → иконки без подписей, `h-7 w-7`

**State для overflow:** `overflowMenuOpen`, ref: `overflowMenuRef`

### Sprint C — Левая панель ✅
**Файл:** `builder-left-panel.tsx`

**Новая структура (flex-row):**
```
[Nav strip 36px] | [Content area flex-1]
```

**Nav strip** (4 иконки, вертикально):
- `FileText` → Страницы (`pages`)
- `Layers` → Слои (`blocks`)
- `Component` → Компоненты (`assets`)
- `Image` → Медиа (`media`) — placeholder

**Активная вкладка:** `t.active` фон + синяя полоска 2px слева

**Content area:** заголовок вкладки + поиск + контент без изменений (LayerTree/InsertPanel/ComponentEditorLeftPanel/Media placeholder)

**Обновлён тип:** `BuilderLeftTab` в `builder-session.ts` → добавлен `'media'`

### Sprint D — Канвас ✅
**Файл:** `builder-editor.tsx`, `builder-canvas-block-overlay.tsx`

**Нижний тулбар (footer):**
- `rounded-xl` + `backdropFilter: blur(12px)` вместо `rounded-full`
- Кнопки `h-7 w-7 rounded-lg`
- Zoom: `ZoomOut` иконка + `%` (клик = дропдаун) + `ZoomIn` иконка

**Canvas subheader:**
- `h-9` → `h-8`
- Viewport switcher убран (теперь только в топбаре)
- Ruler/Grid/Hotkeys — иконки без текста

**CanvasBlockOverlay:**
- Corner handles: белые круги `border-radius: 50%` с тенью (вместо синих квадратов)
- Action buttons (Edit/Duplicate/Delete): тёмный glass `rgba(18,18,20,0.88)` + blur вместо белых

### Sprint E — Inspector ✅
**Файлы:** `builder-inspector-ui.tsx`, `builder-component-inspector.tsx`, `builder-editor.tsx`

**`InspectorTabs` — underline стиль:**
```tsx
// Было: grid-cols-3 bordered boxes h-9
// Стало: flex h-8 underline indicator
<div className="flex" style={{ borderBottom: `1px solid ${theme.divider}` }}>
  <button style={{ borderBottom: active ? `2px solid ${theme.accent}` : '2px solid transparent', marginBottom: -1 }}>
    <Icon /> {label}
  </button>
</div>
```

**Правая панель (обычный режим) — 3 вкладки:**
- **Блок** (`SlidersHorizontal`) — viewport + BlockPropsFields
- **Страница** (`FileText`) — page name + slug
- **SEO** (`Globe`) — title + description + JSON-LD debug

State: `pageInspectorTab: 'block' | 'page' | 'seo'`

**BuilderComponentInspector заголовки:** унифицированы до `h-9 shrink-0`

---

### Sprint F — Element Picker Grid ✅
**Файл:** `builder-element-picker.tsx`

**Что сделано:** заменён tall-список на компактный 3-column grid:
- Компонент `ElementTile` с локальным `useState` для hover (без лишних re-render родителя)
- Плитка: `h-9 w-9` иконка + `text-[10px]` название снизу
- `groupAccentColor()` — каждая категория получает свой акцентный цвет (Layout=синий, Form=фиолетовый, Nav=зелёный, Data=жёлтый, Feedback=красный)
- Описание убрано из плитки → вынесено в `title` (tooltip при hover)
- Точка-индикатор под именем только у `ready`-элементов
- Drag-and-drop полностью сохранён

```tsx
// builder-element-picker.tsx
function ElementTile({ item, Icon, accent, t, onSelect }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button className="flex flex-col items-center gap-1.5 rounded-lg px-1 py-2 text-center" ...>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${accent}22`, color: accent }}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="line-clamp-2 text-[10px] font-medium leading-tight">{item.name}</span>
      {item.ready && <span className="h-1 w-1 rounded-full" style={{ background: accent }} />}
    </button>
  )
}
```

---

### Sprint G — Edit Component: хедер + артборд ✅
**Файл:** `builder-editor.tsx`

**Что сделано:**

**1. Canvas subheader в Edit Component режиме** (строки ~2492):
```tsx
// Когда componentEditMode === true:
// Левая часть: фиолетовая иконка Component + имя компонента + "· Edit Component"
<Component className="h-3.5 w-3.5" style={{ color: '#A855F7' }} />
<span>{block?.props?.name ?? block?.id}</span>
<span style={{ color: t.textMuted }}>· Edit Component</span>

// Правая часть: все стандартные кнопки + фиолетовая кнопка "← Выйти"
<button onClick={toggleComponentEditMode} style={{ color: '#A855F7', border: '1px solid rgba(168,85,247,0.3)' }}>
  <ChevronLeft /> Выйти
</button>
```

**2. Artboard label над артбордом:**
```tsx
<div className="mb-2 flex items-center gap-1.5">
  <Component className="h-3 w-3" style={{ color: '#A855F7' }} />
  <span className="text-[11px] font-medium">{block.props?.name ?? block.id}</span>
  <span className="rounded px-1 text-[9px] font-semibold uppercase"
    style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}>
    component
  </span>
</div>
```

**3. Hint под артбордом** — заменён с длинного на компактный: «Клик внутри — компонент · клик по рамке — artboard»

**Цвет Edit Component:** `#A855F7` (фиолетовый) — отличает от accent синего `#0099FF`

---

### Sprint H — Polish: transitions + tooltips + drag ghost ✅
**Файлы:** `builder-editor.tsx`, `builder-left-panel.tsx`, `builder-element-picker.tsx`

**H.1 Slide transitions для панелей** (`builder-editor.tsx`):
```tsx
// Было: {leftOpen ? <aside>...</aside> : null}
// Стало: всегда в DOM, width анимируется:
<aside
  className="relative shrink-0 overflow-hidden"
  style={{
    width: leftOpen ? leftPanelWidth : 0,
    transition: resizingPanel === 'left' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
  }}
>
  {/* Inner div с min-width — контент не сплющивается во время анимации */}
  <div style={{ width: leftPanelWidth, minWidth: leftPanelWidth }}>
    ...content...
  </div>
</aside>
```
Во время ручного drag-resize `transition: none` — нет задержки.

**H.2 Custom tooltips для nav-иконок** (`builder-left-panel.tsx`):
```tsx
// NavButton — отдельный компонент с useState(showTooltip)
function NavButton({ label, ... }) {
  const [showTooltip, setShowTooltip] = React.useState(false)
  return (
    <button onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <Icon />
      {showTooltip && <NavTooltip label={label} />}
    </button>
  )
}

// NavTooltip: absolute right of strip, dark chip со стрелочкой
function NavTooltip({ label }) {
  return (
    <div style={{ position: 'absolute', left: 38, top: '50%', transform: 'translateY(-50%)',
      background: '#111111', border: '1px solid #2C2C2C', borderRadius: 6,
      padding: '3px 9px', fontSize: 11, fontWeight: 500, zIndex: 60 }}>
      {/* CSS-стрелочка влево */}
      {label}
    </div>
  )
}
```

**H.3 Drag ghost chip** (`builder-element-picker.tsx`):
```tsx
onDragStart={(event) => {
  const ghost = document.createElement('div')
  ghost.style.cssText = 'position:fixed;left:-9999px;background:#1C1C1C;border:1px solid #303030;border-radius:8px;padding:4px 10px;font-size:11px;color:#E8E8E8;...'
  ghost.textContent = item.name
  document.body.appendChild(ghost)
  event.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 16)
  requestAnimationFrame(() => ghost.remove())  // убираем сразу после
  // ... остальной drag setup
}}
```

---

## 7. Следующие задачи — Sprint 8 (Element Canvas v2)

### 8.1 🟠 Drop из Insert → canvas без перезагрузки
**Цель:** клик/drop блока из Insert panel → сразу виден на canvas без reload страницы  
**Файлы:** `builder-editor.tsx`, `builder-insert-panel.tsx`, `builder-store.ts` (packages)

**Что проверить:**
```typescript
// Цепочка: Insert кнопка → addVariant() → store.addBlock() → React re-render
// Проверить: действительно ли блок появляется без page reload?
// Если нет — найти где цепочка обрывается
```

---

### 8.2 🟠 Экспорт element tree в Bitrix
**Цель:** Bitrix export включает HTML из element tree компонента, не только GenericComponentPreview  
**Файлы:** `packages/blocks/src/bitrix-export.ts`, `builder-editor.tsx` (sync-layout API)

**Что нужно:**
1. При export собирать `block.elements[]` и рендерить в HTML
2. Документировать контракт в `component-design-export-ru.md`

---

### 8.3 🟡 Live preview для catalog elements
**Цель:** сейчас ~17 из 71 с реальным `@randee/ui` preview, остальные — stub  
**Файлы:** `packages/blocks/src/element-registry.ts`, `element-preview.tsx`

**Приоритет:** Form, Modal, Table, Accordion

---

### 8.4 🟡 Inspector: props по типу элемента
**Цель:** heading→font size/weight; image→src/alt/object-fit; columns→count/gap; container→padding/direction  
**Файлы:** `builder-element-inspector.tsx`, `builder-element-props-fields.tsx`

---

### 8.5 🟢 IDE hot reload preview
**Цель:** правка `preview.tsx` в VSCode → canvas обновляется без ручного Reload  
**Файлы:** `builder-asset-editor.tsx`, HMR setup

---

## 8. Правила работы с кодом

### TypeScript
- Всегда проверять после изменений: `npx tsc --noEmit --project apps/web/tsconfig.json --ignoreDeprecations 5.0`
- `ComponentElement.props` имеет тип `Record<string, string>` — при пресетах нужен explicit return type `: ComponentElement[]`
- `selectElement(id | null)` — null очищает выбор элемента

### Стиль кода
- Inline стили через `style={{}}` — НЕ Tailwind для динамических цветов
- Tailwind только для структурных классов (flex, grid, gap, w-, h-, overflow-)
- Кнопки: `<button type="button">` — ВСЕГДА указывать type

### Компоненты-примитивы инспектора
```tsx
// Доступны в builder-inspector-ui.tsx:
<InspectorSection title="Заголовок секции">…</InspectorSection>
<InspectorLabel>Подпись поля</InspectorLabel>
<InspectorNumberField label="..." value={n} onChange={setN} />
<InspectorSelectField label="..." value={v} options={[…]} onChange={set} />
<InspectorTabs value={tab} tabs={[…]} onChange={setTab} />
<InspectorSegmented value={v} options={[…]} onChange={set} />
<InspectorSpacingBox ...padding props... />
// Оборачивать в:
<InspectorThemeProvider theme={theme}>…</InspectorThemeProvider>
```

### Добавление новой вкладки в левую панель
```typescript
// 1. builder-left-panel.tsx → добавить в NAV_TABS:
{ id: 'newTab', icon: SomeIcon, label: 'Название' }

// 2. Добавить тип в LeftTab:
type LeftTab = 'pages' | 'blocks' | 'assets' | 'media' | 'newTab'

// 3. builder-session.ts → BuilderLeftTab:
export type BuilderLeftTab = '...' | 'newTab'

// 4. Добавить контент в JSX секцию Tab content
```

---

## 9. Как продолжить с другим AI

Скопируйте этот раздел в начало диалога:

---

**Контекст:** Randee Builder — visual page builder (Next.js + TypeScript + Zustand + TailwindCSS v4).  
Путь проекта: `/Users/pinomax/Desktop/randee/ Randee Ecosystem` (пробел в пути — кавычки обязательны).  
Dev-сервер: `pnpm dev` → `http://localhost:3000/builder?slug=/`  
TypeScript-проверка: `npx tsc --noEmit --project apps/web/tsconfig.json --ignoreDeprecations 5.0`

**Текущий статус:**
- ✅ Framer Redesign (A–H) — полностью завершён
- 🟠 Следующий фокус: Sprint 8 — Element Canvas v2 (см. раздел 7)

**Задача (выбрать нужное):**
- [ ] Sprint 8.1: Drop из Insert → canvas без перезагрузки
- [ ] Sprint 8.2: Bitrix export из element tree
- [ ] Sprint 8.3: Live preview для элементов (Form, Modal, Table, Accordion)
- [ ] Sprint 8.4: Inspector props по типу элемента (heading/image/columns/container)
- [ ] Другое: ___

**Прочитать перед началом:**
1. Этот файл целиком (`framer-redesign-handoff.md`)
2. `dev-roadmap-ru.md` — общий roadmap (рядом в `docs/builder/`)
3. Целевые файлы из раздела 7 нужного спринта
4. TypeScript-проверка до изменений (убедиться что baseline = 0 ошибок)

**Что УЖЕ сделано — не трогать без причины:**
- `themeTokens.dark` — Framer-токены, значения зафиксированы
- Топбар `h-10` — структура (Sprint B)
- Левая панель — иконная навигация 36px strip (Sprint C)
- Нижний тулбар — `rounded-xl` + blur (Sprint D)
- `InspectorTabs` — underline стиль (Sprint E)
- `builder-element-picker.tsx` — 3-column grid (Sprint F)
- Canvas subheader — Edit Component mode header (Sprint G)
- Панели — slide transition `220ms` (Sprint H)

**Правила кода:**
- `style={{}}` для цветов/токенов, Tailwind только для структурных классов
- `<button type="button">` — всегда указывать type
- Inline styles: `onMouseEnter={(e) => { e.currentTarget.style.background = t.hover }}`
- Zustand store передаётся как prop `store: StoreApi<BuilderStore>` — не импортировать глобально
- Цвет Edit Component режима: `#A855F7` (фиолетовый), accent builder: `#0099FF`

**Стиль ответов:** русский язык, изменения точечные, после каждого файла — TypeScript проверка.

---

## 10. Быстрый справочник файл→функция

| Что нужно изменить | Файл | Примерная строка |
|---|---|---|
| Топбар (40px header) | `builder-editor.tsx` → `<header>` | ~1897 |
| Хлебные крошки / Edit Component в топбаре | `builder-editor.tsx` | ~1912 |
| Левая панель структура + tooltips | `builder-left-panel.tsx` | весь файл |
| Layer tree (Слои) | `builder-layer-tree.tsx` | весь файл |
| Левая панель в Edit Component | `builder-component-editor-left.tsx` | весь файл |
| Element picker (grid плитки) | `builder-element-picker.tsx` | весь файл |
| Правая панель Edit Component | `builder-component-inspector.tsx` | весь файл |
| Правая панель обычный режим (3 вкладки) | `builder-editor.tsx` → `{rightOpen ?…}` | ~3078 |
| Примитивы инспектора (Section, Tabs…) | `builder-inspector-ui.tsx` | весь файл |
| Рамки блоков + corner handles | `builder-canvas-block-overlay.tsx` | весь файл |
| Viewport switcher (topbar/inspector/full) | `builder-viewport-toolbar.tsx` | весь файл |
| Нижний floating toolbar | `builder-editor.tsx` → `<footer>` | ~2870 |
| Canvas subheader (Ruler/Grid/Edit mode) | `builder-editor.tsx` | ~2492 |
| Artboard Edit Component | `builder-editor.tsx` | ~2710 |
| Панель добавления блоков (grid превью) | `builder-insert-panel.tsx` | весь файл |
| Drag transitions левой/правой панели | `builder-editor.tsx` | ~2357, ~3078 |
| CSS переменные и dot-grid | `apps/web/app/globals.css` | весь файл |
| Дизайн-токены | `builder-editor.tsx` → `themeTokens` | ~157 |
| Zustand store (state + actions) | `packages/builder/src/store/builder-store.ts` | весь файл |
| Session (sessionStorage) | `builder-session.ts` | весь файл |
| Bitrix export | `packages/blocks/src/bitrix-export.ts` | весь файл |
| Element registry (71 элемент) | `packages/blocks/src/element-registry.ts` | весь файл |

---

## 11. Статус Framer Redesign

| Спринт | Описание | Статус |
|--------|----------|--------|
| A | Дизайн-токены + Inter шрифт + dot-grid + compact inspector | ✅ |
| B | Топбар Framer-style (40px, overflow menu, viewport в topbar) | ✅ |
| C | Левая панель: иконная навигация 36px + 4 таба + поиск | ✅ |
| D | Canvas: corner handles, glass action buttons, bottom toolbar | ✅ |
| E | Inspector: underline tabs, 3-вкладочная правая панель | ✅ |
| F | Element picker: 3-column grid с цветными плитками | ✅ |
| G | Edit Component: фиолетовый subheader + artboard label | ✅ |
| H | Polish: slide transitions, nav tooltips, drag ghost chip | ✅ |

---

*Документ обновлён: 2026-05-26. Все спринты Framer Redesign (A–H) завершены.*
