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

## R2 — Multi-viewport Canvas 🔲

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

## R3 — Редактор компонентов (Redesign) 🔲

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

## R4 — Сохранение компонентов в файлы 🔲

### Проблема
Компонент собранный в Редакторе существует только в браузере (store). После перезагрузки — всё потеряно (пока не сохранён в Assets). Нет возможности открыть в VSCode и доработать.

### Цель
Компонент из Редактора → автоматически сохраняется как `.tsx` файл → виден в IDE → изменения в IDE → горячая перезагрузка в Редакторе.

### Итерации

**R4.1 🔲 Auto-save element tree → TSX файл**
При каждом Save:
- `block.elements[]` → генерация `preview.tsx` (разметка + props)
- API `/api/builder/components/[id]/preview` пишет файл на диск
- Уже частично есть через `sync-layout` API

**R4.2 🔲 Кнопка «Открыть в IDE»**
В Редакторе — кнопка `</>`, которая:
- Показывает путь к файлу компонента
- (Опционально) открывает `vscode://...` URI

**R4.3 🔲 File watcher → hot reload в Редакторе**
- Watcher на `component-XX/preview.tsx`
- При изменении → refresh превью в Редакторе без перезагрузки страницы
- Кнопка «Reload preview» в asset editor (уже есть в `dev-roadmap`)

**Файлы:** `apps/web/app/api/builder/`, `builder-asset-editor.tsx`, `packages/blocks/src/`  
**Сложность:** 4–8 часов (зависит от текущего состояния sync-layout)

---

## R5 — CMS Bitrix: связь компонентов с данными 🔲

### Проблема
Модуль CMS Bitrix есть, но:
- Непонятно как привязать элемент компонента к инфоблоку
- Нет live preview с реальными данными
- Слайдеры, аккордионы, карточки — содержимое статическое

### Цель
В Редакторе: создал слайдер → выбрал инфоблок → сразу видишь реальные карточки в превью.

### Итерации

**R5.1 🔲 Браузер инфоблоков в левой панели**
Новый таб в левой панели: «CMS» (иконка Database)
- Список инфоблоков из подключённого Bitrix
- Поиск по названию
- Превью структуры: какие поля есть (NAME, PREVIEW_TEXT, PREVIEW_PICTURE…)

**R5.2 🔲 Привязка поля элемента к CMS-источнику**
В Inspector при выборе Text-элемента:
```
[Текст] — статический
[CMS] → выбрать инфоблок → выбрать поле
```
- Drag из браузера инфоблоков → drop на элемент
- Сохраняется как `{ cmsBinding: { iblockId, field } }`

**R5.3 🔲 Live preview с реальными данными**
- Компонент с привязками рендерит несколько реальных элементов (первые 3–5 из инфоблока)
- Слайдер → показывает реальные карточки
- Аккордион → показывает реальные вопросы/ответы

**R5.4 🔲 Export → Bitrix PHP с реальными запросами**
- При экспорте: вместо hardcoded текста → `CIBlockElement::GetList(...)` с нужным infoblock_id
- Генерация правильного PHP шаблона

**Файлы:** `builder-cms.tsx`, `builder-left-panel.tsx`, `packages/bitrix-adapter/`, API routes  
**Сложность:** 8–16 часов, несколько фаз

---

## R6 — Multi-viewport: Preview кнопка ✅ (реализовано в R1.2)

---

## Рекомендуемый порядок

```
R1.1 Переименовать (30 мин) ✅
  → R1.2 Preview кнопка (1 час) ✅
  → R3.1 Визуальный оверлей элементов (2 часа)
  → R3.2 Inline добавление (2 часа)
  → R2.1+R2.2 Multi-viewport canvas (4 часа)
  → R4.1 Auto-save to TSX (2 часа)
  → R5.1 CMS браузер инфоблоков (3 часа)
  → остальное по приоритету
```

---

## Definition of Done

| Задача | Критерий |
|--------|----------|
| R1.1 | Нигде в UI нет «Edit Component», везде «Редактор» |
| R1.2 | ▶ кнопка скрывает chrome, Escape выходит |
| R2 | Все 3 viewport рядом, переключение работает |
| R3 | Клик на элемент в превью → выделение + Inspector |
| R4 | Save компонента → файл на диске, изменения в IDE видны в Редакторе |
| R5 | Выбрал инфоблок → слайдер показывает реальные карточки |
