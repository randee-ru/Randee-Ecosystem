# Randee Builder — Dev Roadmap

Обновлён: **2026-05-25**  
Стратегия: маленькие итерации по 1–3 часа → видимый результат → следующая

Связанные документы: [blocks-roadmap-ru.md](./blocks-roadmap-ru.md) · [ui-rework-master-plan-ru.md](./ui-rework-master-plan-ru.md)

---

## Легенда

| Маркер | Смысл |
|--------|-------|
| 🔴 BLOCKER | Без этого что-то сломано сейчас |
| 🟠 P0 | Нужно сделать в первую очередь |
| 🟡 P1 | После P0, критично для MVP |
| 🟢 P2 | Улучшение UX, можно после MVP |
| ✅ DONE | Готово |
| ⏸ OUT | Сложная Framer-механика — отдельная фаза |

---

## Element Canvas v1 — что уже сделано

Переход с HTML5 drag на **Pointer Events** (как в Framer):

| Функция | Статус |
|---------|--------|
| Drag элементов (pointer events) | ✅ |
| Индикатор вставки (синяя линия before/after/inside) | ✅ |
| Ghost при перетаскивании | ✅ |
| Контекстное меню (5 действий) | ✅ Дублировать, Переименовать, Вверх, Вниз, Удалить |
| Горячие клавиши | ✅ Delete, ⌘D, ↑, ↓, Escape |
| Вложенность (Container, Columns) | ✅ Drop inside + синий фон |
| Дублировать со всеми детьми | ✅ `onDuplicateElement` |
| Inline rename в меню | ✅ |
| Move up/down в родителе | ✅ |
| Цветные категории + preview-текст в строке | ✅ |
| Layout presets (Hero / 2 колонки / Карточка / Форма) | ✅ |

**Пока вне scope (Element Canvas v2 / Framer-parity):**

| Функция | Статус |
|---------|--------|
| Абсолютное позиционирование / свободный канвас | ⏸ |
| Resize handles | ⏸ |
| Multi-select | ⏸ |
| Rotation | ⏸ |

**Файлы:** `packages/blocks/src/components/element-canvas.tsx`, `packages/blocks/src/preview.tsx`, `builder-editor.tsx`

---

## Итог: что уже работает (остальное)

- ✅ CRUD блоков на canvas (add, delete, reorder, duplicate)
- ✅ Inspector: props, design, CMS bindings, color/image fields
- ✅ Responsive preview (desktop / macbook / tablet / mobile)
- ✅ New → Component + Save to Assets
- ✅ CodeMirror + Emmet (Tab)
- ✅ Edit Component + UI Elements catalog
- ✅ Auto-sync layout → `layout.generated.tsx`
- ✅ Сохранение страницы по slug + автосохранение
- ✅ Reload превью после save (`TemplateRevisionProvider`)
- ✅ Bitrix export → ZIP в браузере
- ✅ Duplicate / Delete component (API + UI)
- ✅ dnd-kit в layer tree
- ✅ UI на русском, горячие клавиши, undo/redo, empty states
- ✅ Инструкция в Builder (визуальные демо)

---

## СПРИНТ 1 — Починить существующее ✅ (закрыт)

| # | Задача | Статус |
|---|--------|--------|
| 1.1 | ElementCanvas: реактивность после Insert | 🟡 проверить в браузере — если ок → ✅ |
| 1.2 | BUILTIN_TEMPLATES — защита кастомных component-XX | 🟡 |
| 1.3 | Reload превью после save кода | ✅ |
| 1.4 | Save / Load страницы | ✅ |
| 1.5 | dnd-kit в layer tree | ✅ |

---

## СПРИНТ 2 — Inspector и Props ✅ (закрыт)

| # | Задача | Статус |
|---|--------|--------|
| 2.1 | Typed props schema + renderFieldInput | ✅ color, image, select |
| 2.2 | SliderInspector отдельная панель | 🟡 частично |
| 2.3 | Убрать дубли секций Inspector | 🟢 |

---

## СПРИНТ 3 — Edit Component ✅ (основное закрыто)

| # | Задача | Статус |
|---|--------|--------|
| 3.1 | Context menu + scroll | ✅ |
| 3.2 | Визуальные типы в ElementCanvas | ✅ |
| 3.3 | Inline props элемента в Inspector | 🟡 доработать все типы |
| 3.4 | Layout presets | ✅ |

---

## СПРИНТ 4 — Экспорт ✅ (основное закрыто)

| # | Задача | Статус |
|---|--------|--------|
| 4.1 | Bitrix ZIP скачивание | ✅ |
| 4.2 | Duplicate component | ✅ |
| 4.3 | Delete component | ✅ |

---

## СПРИНТ 5–7 — CMS, Pages, Polish ✅ (база закрыта)

| Область | Статус |
|---------|--------|
| CMS connection + сохранение в страницу | ✅ |
| Block props → Binding (CMS) | ✅ |
| **R5 UI-элементы** (инфоблок в Inspector, live preview, export PHP) | ✅ см. [builder-v2-roadmap-ru.md](./builder-v2-roadmap-ru.md) R5 |
| Rename page из UI | 🟡 |
| Валидация CMS (расширенная) | 🟡 |

---

## FRAMER REDESIGN — прогресс

| Спринт | Описание | Статус |
|--------|----------|--------|
| A | Дизайн-токены + Inter шрифт + dot-grid канвас + compact inspector | ✅ |
| B | Топбар (новый хедер Framer-style) | ✅ |
| C | Левая панель: иконная навигация + 4 таба | ✅ |
| D | Канвас: рамки блоков + нижний тулбар | ✅ |
| E | Inspector: полная переработка (Layout/Style/Code) | ✅ |
| F | Insert panel: element picker grid (3 col, icon tiles) | ✅ |
| G | Edit Component: режим-хедер + artboard label | ✅ |
| H | Polish: slide transitions, nav tooltips, drag ghost chip | ✅ |

---

## СПРИНТ 8 — Element Canvas v2 (следующий фокус)

Итерации по 2–4 часа, каждая — видимый результат.

### 8.1 🟠 Drop из Insert → canvas без перезагрузки

- [ ] Проверить цепочку: Insert → `insertElement` → `block.elements` → `ElementCanvas`
- [ ] Drop external catalog item на canvas (не только reorder существующих)
- [ ] E2E: Insert Button → сразу виден на canvas

**Файлы:** `builder-editor.tsx`, `element-canvas.tsx`, `builder-store.ts`

---

### 8.2 🟡 Экспорт дерева elements в preview / Bitrix

- [x] `layout.generated.tsx` + autosync API (`sync-layout`, `elements.snapshot.json`) — **R4.1**
- [x] Bitrix export: CMS bindings → `CIBlockElement::GetList` — **R5.4**
- [ ] Bitrix export: полный HTML из element tree для всех типов
- [ ] Документировать контракт в `component-design-export-ru.md`

**Файлы:** `packages/blocks/src/bitrix-export.ts`, `bitrix-cms-php.ts`, sync-layout API

---

### 8.3 🟡 Live preview для всех catalog elements

- [ ] Сейчас ~17 из 71 с `@randee/ui` preview
- [ ] Остальные — stub → постепенно подключать реальные компоненты
- [ ] Приоритет: Form, Modal, Table, Accordion

**Файл:** `packages/blocks/src/element-registry.ts`, `element-preview.tsx`

---

### 8.4 🟡 Inspector: все props по типу элемента

- [ ] `heading` → font size, weight
- [ ] `image` → src, alt, object-fit
- [ ] `columns` → count, gap, min-width
- [ ] `container` → padding, direction

**Файлы:** `builder-element-inspector.tsx`, `builder-element-props-fields.tsx`

---

### 8.5 🟢 Вложенный drag между container/columns

- [ ] Улучшить hit-testing для deep nesting
- [ ] Визуальный outline при hover container
- [ ] Keyboard: Tab между элементами (accessibility)

---

## СПРИНТ 9 — IDE + Builder sync

### 9.1 ✅ preview.tsx с диска → canvas (hot reload) — база (R4.3)

- [x] Poll `file-revision` + `bumpTemplateRevision` в Редакторе
- [x] Кнопки **Открыть в VS Code / Cursor** (`builder-ide.ts`)
- [ ] Полный HMR без poll (опционально)
- [x] Кнопка **Reload preview** в asset editor

---

### 9.2 🟡 Инструкция актуальна с Element Canvas

- [ ] Раздел «Element Canvas» с визуалом drag/ghost/menu
- [ ] Ссылка на `dev-roadmap-ru.md`

**Файл:** `apps/web/app/builder/builder-instructions*.tsx`

---

## СПРИНТ 10 — Framer-parity (post-MVP, ⏸)

| ID | Задача | Зависимости |
|----|--------|-------------|
| 10.1 | Absolute layout mode | 8.x |
| 10.2 | Resize handles | 10.1 |
| 10.3 | Multi-select + group | 8.x |
| 10.4 | Rotation + constraints | 10.2 |
| 10.5 | Component variants | marketplace |

---

## Рекомендуемый порядок (сейчас)

```
✅ R1–R5 builder-v2-roadmap (см. builder-v2-roadmap-ru.md)
  → 8.1 drop из Insert (если ещё баг)
  → 8.2 export elements (доработка HTML tree)
  → 8.3 live previews (больше catalog elements)
  → 8.4 inspector по типам
  → 9.2 инструкция Element Canvas (частично обновлена)
  → backlog R5: multi-item CMS preview, drag CMS на элемент
  → 10.x Framer-parity (по запросу)
```

**Правило:** каждая задача — видимый результат в браузере за одну сессию.

---

## Definition of Done — верстальщик элементов

1. New → Component → Edit Component ON  
2. Insert / drag UI Elements на canvas  
3. Inspector меняет props выбранного элемента  
4. Save to Assets → вставка на другую страницу  
5. Export Bitrix включает вёрстку component  
6. (Опционально) правка `preview.tsx` в IDE → canvas обновился  

---

## Связанные документы

- [blocks-roadmap-ru.md](./blocks-roadmap-ru.md) — MVP блоков, Bitrix
- [component-design-export-ru.md](./component-design-export-ru.md) — design в export
- [уроки/06-блоки-roadmap.md](../../уроки/06-блоки-roadmap.md) — краткая версия для обучения
