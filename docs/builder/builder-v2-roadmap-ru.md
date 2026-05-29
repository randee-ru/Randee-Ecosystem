# Randee Builder v2 — Roadmap

Обновлён: **2026-05-26**  
Стратегия: итерации по 2–4 часа, каждая — видимый результат в браузере.

Связанные: [framer-redesign-handoff.md](./framer-redesign-handoff.md) · [dev-roadmap-ru.md](./dev-roadmap-ru.md)

---

## Легенда

| Маркер | Смысл |
|--------|-------|
| ✅ DONE | Сделано |
| 🟠 P0 | Делать прямо сейчас |
| 🟡 P1 | После P0 |
| 🟢 P2 | Улучшение, после P1 |
| 🔲 PLAN | Спланировано, ещё не начато |
| ⏸ OUT | Сложно, отдельная фаза |

---

## R1 — Quick wins 🟠

### R1.1 ✅ Переименовать «Edit Component» → «Редактор» (DONE 2026-05-26)
Везде в UI: кнопки, заголовки, tooltips, подписи.  
Идентификаторы кода (`componentEditMode`, `toggleComponentEditMode`) — не трогать.

**Файлы:**
- `builder-editor.tsx` — кнопка в overflow menu, subheader, breadcrumb
- `builder-left-panel.tsx` — если есть упоминания
- `builder-instructions.tsx` — тексты инструкции
- `builder-instructions-visuals.tsx` — визуальные демо

---

### R1.2 ✅ Кнопка Preview (▶ Play) (DONE 2026-05-26)
Кнопка в правой части топбара — открывает full-screen режим: скрывается весь builder chrome, страница отображается как для конечного пользователя.

**Поведение:**
- Клик `▶` → `previewMode = true` → fullscreen overlay
- Overlay: белый фон, блоки в натуральном размере (zoom 100%)
- Плавающая кнопка `×` в правом верхнем углу → выход из preview
- Горячая клавиша: `Escape`

**Файлы:** `builder-editor.tsx`

---

## R2 — Multi-viewport Canvas ✅ (DONE 2026-05-26)

### Задача
На одном канвасе видеть все версии сайта одновременно (Desktop + Tablet + Mobile рядом горизонтально) — как в Figma/Framer.

### Режимы
| Режим | Поведение |
|-------|-----------|
| Single (сейчас) | Один viewport, переключатель в топбаре |
| All viewports | Desktop (1440) + Tablet (768) + Mobile (390) горизонтально |

### Итерации

**R2.1 ✅ Multi-select viewport тогглы + Multi-viewport canvas (DONE 2026-05-26)**
- В canvas subheader добавить иконку «Show all viewports» (иконка ≡ или grid)
- `canvasLayout: 'single' | 'all'` — новый state

**R2.2 ✅ Горизонтальный layout нескольких канвасов (DONE 2026-05-26)**
```
[  Desktop 1440px  ] [  Tablet 768px  ] [  Mobile 390px  ]
      gap 80px              gap 80px
```
- Каждый canvas — отдельный `div` с фиксированной шириной viewport
- Масштабирование через `transform: scale(frameScale)`
- Лейбл под каждым: «Desktop», «Планшет», «Мобильный»

**R2.3 ✅ Синхронизация выделения (DONE 2026-05-26)**
- Клик на блок в любом viewport → выделяет его во всех трёх
- Hover + selection overlay (цвет viewport) с именем блока

**Файлы:** `builder-editor.tsx` (canvas section), `builder-canvas-chrome.tsx`  
**Сложность:** 4–6 часов

---

## R3 — Редактор компонентов (Redesign) ✅ (DONE 2026-05-26)

### Проблема
Текущий «Редактор» (Edit Component) неудобен:
- Непонятно как добавить элемент
- Нет визуального drag между элементами прямо на превью
- Layer tree в левой панели — отдельно от превью, не интуитивно
- Inspector громоздкий

### Цель
Сделать Редактор понятным для верстальщика: вижу элемент → кликнул → изменил → готово.

### Итерации

**R3.1 ✅ Визуальный оверлей элементов на превью (DONE 2026-05-26)**
Когда `componentEditMode = true`, каждый элемент в превью получает:
- ✅ Hover: подсветка фиолетовым бордером (rgba(124,58,237,0.45))
- ✅ Клик: выделение (2px solid #7c3aed) + Inspector справа
- ✅ Артборд показывает ВИЗУАЛЬНЫЙ компонент (не tree-view), через `artboardElementOptions`
- Действия прямо на элементе: кнопки Edit/Duplicate/Delete — R3.5

**R3.2 ✅ Inline добавление элемента (DONE 2026-05-26)**
- ✅ «+» кнопка при hover (bottom:-11px, фиолетовая, z-index 31)
- ✅ Клик → мини-каталог 8 элементов (4-col grid, portal в document.body)
- ✅ Drag из левой панели каталога → drop на визуальный артборд (forceVisual + onDropElement)
- ✅ artboardElementOptions: forceVisual=true, onDropElement полный

**R3.3 ✅ Drag reorder прямо на превью (DONE 2026-05-26)**
- ✅ HTML5 drag включён (`draggable={true}` когда `onDropElement` есть)
- ✅ grab-курсор при hover в edit-режиме, grabbing при drag
- ✅ Перетаскиваемый элемент: `opacity: 0.35` (визуальный сигнал)
- ✅ Framer-style лейбл имени элемента при hover/selected (фиолетовый badge сверху)
- ✅ Drop-zone индикаторы: before/after (фиолетовая линия) + inside (dashed border)

**R3.4 ✅ Breadcrumb path выбранного элемента (DONE 2026-05-26)**
- ✅ `buildElementPath()` — строит цепочку предков по `parentId`
- ✅ `<ElementBreadcrumb>` — кликабельный путь в Inspector (Компонент › Container › Button)
- ✅ Показывается в обоих заголовках: columns case + regular element case
- ✅ Клик на предка → выделяет его (`onSelectElement`)
- ✅ Клик «Компонент» → сбрасывает выделение (`onSelectElement('')`)

**R3.5 ✅ Quick props inline (DONE 2026-05-26)**
- ✅ Double-click text/heading/button/link → textarea overlay с текстом
- ✅ Double-click image → input для URL
- ✅ Double-click input/text-field → редактировать placeholder
- ✅ Enter = сохранить, Escape = отмена, кнопки Сохранить/Отмена
- ✅ `onPatchElementProps` в CanvasElementOptions, artboardElementOptions, BlockTemplatePreviewProps

**Файлы:** `builder-component-editor-left.tsx`, `builder-editor.tsx`, `builder-element-inspector.tsx`  
**Сложность:** разбито на 4–6 итераций по 2–3 часа каждая

---

## R4 — Сохранение компонентов в файлы ✅ (DONE 2026-05-26)

### Проблема
Компонент собранный в Редакторе существует только в браузере (store). После перезагрузки — всё потеряно (пока не сохранён в Assets). Нет возможности открыть в VSCode и доработать.

### Цель
Компонент из Редактора → автоматически сохраняется как `.tsx` файл → виден в IDE → изменения в IDE → горячая перезагрузка в Редакторе.

### Итерации

**R4.1 ✅ Auto-save element tree → TSX файл (DONE 2026-05-26, коммит `bdf8902`)**
- ✅ Debounce ~600 мс при изменении `block.elements` → `POST /api/builder/components/[template]/sync-layout`
- ✅ На диск: `layout.generated.tsx`, `elements.snapshot.json`; при первом sync — `preview.tsx` (если нет `GeneratedLayout`), `init.ts`, доп. стили в `style.css`
- ✅ Индикатор в шапке Редактора: ⟳ синк / ✓ ок / ✗ ошибка / **«только IDE»** для встроенных шаблонов
- ⚠️ **Ограничение:** встроенные шаблоны (`component-03`, `component-04`, hero, features, faq, …) — API отвечает **403**, автосинк в файлы недоступен (правка только в IDE или Save to Assets → свой `component-XX`)

**R4.2 ✅ Кнопка «Открыть в IDE» (DONE 2026-05-26)**
- ✅ `builder-ide.ts` — deep links `vscode://` и `cursor://`
- ✅ API `GET …/asset-path` — абсолютный путь к файлу шаблона
- ✅ Кнопки **VS Code** / **Cursor** в `builder-asset-editor.tsx` и `builder-component-inspector.tsx` (preview, layout, style)

**R4.3 ✅ File watcher → hot reload в Редакторе (DONE 2026-05-26)**
- ✅ Poll `GET …/file-revision` каждые ~1.5 с → `getTemplateAssetsRevision` → `bumpTemplateRevision`
- ✅ Превью перечитывает CSS/TSX без полного reload страницы (`TemplateRevisionProvider`)
- ✅ Ручной reload по-прежнему в asset editor

**Файлы:** `sync-layout/route.ts`, `file-revision/route.ts`, `builder-editor.tsx`, `builder-ide.ts`, `template-assets.ts`

---

## R5 — CMS Bitrix: связь компонентов с данными ✅ (DONE 2026-05-26, база)

### Проблема
Модуль CMS Bitrix есть, но:
- Непонятно как привязать элемент компонента к инфоблоку
- Нет live preview с реальными данными
- Слайдеры, аккордионы, карточки — содержимое статическое

### Цель
В Редакторе: создал слайдер → выбрал инфоблок → сразу видишь реальные карточки в превью.

### Итерации

**R5.1 ✅ Браузер инфоблоков в левой панели (DONE 2026-05-26)**
- ✅ Таб **CMS** в левой панели (`builder-left-panel.tsx`, `builder-cms-browser.tsx`)
- ✅ «Обновить» → список инфоблоков, schema полей, sample элементов (connector `iblock.list`, `iblock.schema`, `elements.list`)
- ✅ Кеш в `localStorage` + событие `randee:cms-cache-updated`
- 🟡 Поиск по названию инфоблока в браузере — **не сделан** (можно добавить позже)

**R5.2 ✅ Привязка поля элемента к CMS-источнику (DONE 2026-05-26)**
- ✅ `element.cmsBindings` + `updateElementCmsBinding` в store
- ✅ Inspector: блок **«CMS привязка»** — выбор **инфоблока**, режим (список / конкретный элемент), поле из schema (`builder-element-cms-fields.tsx`)
- ✅ Для блоков страницы: **Binding (CMS)** в `builder-block-props-fields.tsx`
- ✅ Кнопки **→ CMS**, **Авто** (маппинг NAME / PREVIEW_TEXT / PREVIEW_PICTURE)
- 🟡 Drag инфоблока на элемент — **не сделан** (только через Inspector)

**R5.3 ✅ Live preview с реальными данными (DONE 2026-05-26, v1)**
- ✅ `use-cms-preview-data.ts` → `cmsPreviewValues` на артборде в Редакторе
- ✅ `resolveElementProp` в `element-preview.tsx` подставляет значения из connector
- ⚠️ Режим **list** сейчас берёт **первый** элемент (`limit: 1`), не 3–5 карточек; слайдер/аккордион как список — **отдельная доработка**

**R5.4 ✅ Export → Bitrix PHP с реальными запросами (DONE 2026-05-26)**
- ✅ `packages/blocks/src/bitrix-cms-php.ts` — генерация `CIBlockElement::GetList` / полей
- ✅ `applyCmsListComponentPhp` в `bitrix-export.ts` + override в `@randee/bitrix-adapter`

**Файлы:** `builder-cms-browser.tsx`, `builder-element-cms-fields.tsx`, `use-cms-preview-data.ts`, `bitrix-cms-php.ts`  
**Коммит:** `bdf8902` · sample: `samples/packages/randee.connector*`

---

## R6 — Multi-viewport: Preview кнопка ✅ (реализовано в R1.2)

---

## Рекомендуемый порядок

```
R1.1 Переименовать (30 мин) ✅
  → R1.2 Preview кнопка (1 час) ✅
  → R2.1–R2.3 Multi-viewport canvas ✅
  → R3.1–R3.5 Редактор компонентов ✅
  → R4.1–R4.3 Auto-save / IDE / hot reload ✅
  → R5.1–R5.4 CMS Bitrix (база) ✅
  → дальше: dev-roadmap Спринт 8.x (drop Insert, больше live previews, inspector по типам)
```

---

## Definition of Done

| Задача | Критерий | Статус |
|--------|----------|--------|
| R1.1 | Нигде в UI нет «Edit Component», везде «Редактор» | ✅ |
| R1.2 | ▶ кнопка скрывает chrome, Escape выходит | ✅ |
| R2 | Все 3 viewport рядом, переключение работает | ✅ |
| R3 | Клик на элемент в превью → выделение + Inspector | ✅ |
| R4 | Auto-sync в `layout.generated.tsx` (свой component); IDE; hot reload по revision | ✅* |
| R5 | Инфоблок в Inspector; live preview; export PHP с GetList | ✅** |

\* R4: встроенные шаблоны — только IDE, без autosync.  
\** R5: preview list = 1 элемент; drag CMS на canvas и multi-card слайдер — в backlog.

---

## Backlog после R5 (не блокирует MVP)

| ID | Задача |
|----|--------|
| B1 | Поиск по инфоблокам во вкладке CMS |
| B2 | Drag поля из CMS-браузера на элемент |
| B3 | Live preview: несколько элементов (limit 5) для слайдера/списка |
| B4 | E2E с mock connector (полный сценарий привязки) |
