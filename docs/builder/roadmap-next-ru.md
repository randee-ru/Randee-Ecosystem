# Randee Builder — следующие шаги

Обновлён: **2026-05-26**  
Основа: анализ Framer «Thoughtful Business» + gap-analysis текущего Builder.  
Всё что в R1–R5 — уже сделано. Этот документ — что делаем дальше.

---

## Что уже готово (R1–R5)

| Группа | Что сделано |
|--------|------------|
| Builder UI | Редактор, Preview ▶, Multi-viewport canvas, hot reload |
| Редактор компонентов | Drag reorder, inline edit, breadcrumb, CMS привязка |
| Auto-save | sync-layout → layout.generated.tsx, IDE кнопки, file watcher |
| CMS Bitrix | Браузер инфоблоков, привязка полей, live preview, PHP export |
| Export | HTML fix (реальный контент), Bitrix ZIP, комбинированный HTML+Bitrix |
| Инструкции | Интерактивные визуалы, CMS workflow, варианты блоков |

---

## Приоритеты

```
P0 — нужно прямо сейчас (блокирует реальные проекты)
P1 — следующий спринт
P2 — улучшения, не блокируют
```

---

## R7 — Базовые блоки страницы 🟠 P0

> Без навигации, подвала и тарифов нельзя собрать ни один нормальный лендинг.

### R7.1 — `nav-01` Навигация
**Что:** шапка сайта — логотип слева, меню по центру, кнопка справа.  
**Props:** `logo`, `links` (JSON-массив), `buttonText`, `buttonUrl`, `background`  
**Варианты:** A — прозрачная, B — белая с тенью, C — тёмная  
**Файлы:**
- `packages/blocks/src/templates/nav/nav-01/preview.tsx`
- `packages/blocks/src/templates/nav/nav-01/style.css`
- `packages/blocks/src/templates/nav/nav-01/manifest.ts`
- `packages/blocks/src/templates/nav/nav-01/init.ts`
- Зарегистрировать в `template-path.ts`

**Сложность:** 3–4 ч

---

### R7.2 — `footer-01` Подвал
**Что:** 3–4 колонки со ссылками + строка копирайта снизу.  
**Props:** `logo`, `col1Title`/`col1Links`, `col2Title`/`col2Links`, `col3Title`/`col3Links`, `copyright`  
**Варианты:** A — тёмный, B — светлый  
**Сложность:** 3–4 ч

---

### R7.3 — `pricing-01` Тарифы
**Что:** 3 карточки (Free / Pro / Team) с ценой, фичами и кнопкой. Средняя выделена.  
**Props:** `plan1Name/Price/Features`, `plan2Name/Price/Features` (highlighted), `plan3Name/Price/Features`  
**Варианты:** A — карточки с тенью, B — minimal с бордером  
**Сложность:** 4–5 ч

---

## R8 — Stack и Grid в Редакторе компонентов 🟠 P0

> Сейчас можно добавить Button и Text, но нельзя их нормально расположить. Stack разблокирует вёрстку.

### R8.1 — `stack` элемент
**Что:** flex-контейнер (как Frame во Framer) — содержит другие элементы, раскладывает их в ряд или колонку.  
**Props:** `direction` (row/column), `gap`, `align`, `justify`, `padding`  
**В Редакторе:** можно перетащить Button/Text внутрь Stack  
**Файлы:**
- `packages/blocks/src/element-registry.ts` — добавить тип `stack`
- `packages/builder/src/types.ts` — поддержка вложенности для stack
- `builder-component-editor-left.tsx` — отображение stack в дереве с indent

**Сложность:** 4–6 ч

---

### R8.2 — `grid` элемент
**Что:** CSS Grid контейнер — `columns`, `gap`, `rows`.  
**Зависит от R8.1** (нужна поддержка вложенности).  
**Сложность:** 2–3 ч после R8.1

---

## R9 — Варианты блоков A/B/C 🟡 P1

> «Переключить стиль Hero с тёмного на светлый» — сейчас невозможно без правки кода.

### R9.1 — Поле `variant` в manifest
Добавить в `BlockTemplateManifest`:
```ts
variants?: Array<{ id: string; label: string }>
// example: [{ id: 'A', label: 'Тёмный' }, { id: 'B', label: 'Светлый' }]
```

### R9.2 — Switcher в Inspector
Кнопки A / B / C в Inspector блока — меняют `block.props.variant`.

### R9.3 — CSS-классы по варианту
В шаблонах поддержка `variant` через CSS:
```css
.randee-hero-01[data-variant="A"] { background: #000; color: #fff; }
.randee-hero-01[data-variant="B"] { background: #fff; color: #000; }
```

**Файлы:** `packages/blocks/src/types.ts`, `builder-component-inspector.tsx`, все новые шаблоны

**Сложность:** 3–4 ч + доработка шаблонов

---

## R10 — Дополнительные блоки 🟡 P1

### R10.1 — `logos-01` Логотипы / Social proof
**Что:** полоса с логотипами партнёров / клиентов + заголовок «Нам доверяют».  
**Props:** `title`, `logos` (массив SVG/URL)  
**Сложность:** 2–3 ч

### R10.2 — `testimonial-01` Отзыв
**Что:** цитата + имя автора + должность + аватар.  
**Props:** `quote`, `authorName`, `authorRole`, `authorAvatar`  
**Варианты:** A — с большими кавычками, B — минималистичный  
**Сложность:** 2–3 ч

### R10.3 — `hero-04` Hero с картинкой
**Что:** заголовок слева, большая картинка справа или снизу.  
**Props:** `title`, `subtitle`, `image`, `buttonText`, `buttonUrl`  
**Сложность:** 2–3 ч

---

## R11 — Элементы Редактора: медиа и формы 🟢 P2

### R11.1 — `video` элемент
YouTube/Vimeo embed по URL. Props: `url`, `aspectRatio`.  
**Сложность:** 2 ч

### R11.2 — `icon` элемент
Пикер иконок Lucide React. Список иконок, поиск, цвет, размер.  
**Сложность:** 3–4 ч

### R11.3 — `ticker` / Marquee
Бегущая строка с текстом или логотипами. Props: `items`, `speed`, `direction`.  
**Сложность:** 2–3 ч

### R11.4 — `form` / email signup
Поле email + кнопка «Подписаться». Props: `placeholder`, `buttonText`, `action`.  
**Сложность:** 3 ч

---

## R12 — Fork встроенных блоков 🟢 P2

> Сейчас нельзя изменить hero-01 через UI — только через IDE.

**Что:** при попытке войти в Редактор встроенного блока → диалог «Создать редактируемую копию?»  
**Логика:** API `duplicate` уже есть → автоматически создаётся `component-XX` как копия  
**Сложность:** 1–2 ч

---

## R13 — CMS Backlog 🟡 P1

Из backlog после R5:

| ID | Задача | Сложность |
|----|--------|-----------|
| R13.1 | Поиск по инфоблокам в CMS браузере | 1 ч |
| R13.2 | Drag поля из CMS-браузера на элемент | 3–4 ч |
| R13.3 | Live preview: несколько элементов (limit 5) для слайдера/списка | 2–3 ч |

---

## Порядок выполнения

```
R7.1  nav-01              ~4 ч
  → R7.2  footer-01       ~4 ч
  → R7.3  pricing-01      ~5 ч
  → R8.1  stack element   ~6 ч
  → R8.2  grid element    ~3 ч
  → R9    variants A/B/C  ~4 ч + обновление шаблонов
  → R10.1 logos-01        ~3 ч
  → R10.2 testimonial-01  ~3 ч
  → R10.3 hero-04         ~3 ч
  → R13.1 CMS search      ~1 ч
  → R13.3 CMS multi-card  ~3 ч
  → R11   video/icon/form ~8 ч
  → R12   fork built-in   ~2 ч
  → R13.2 CMS drag        ~4 ч
```

**Итого оценка: ~53 часа** (реалистично за 2–3 недели при работе по 3–5 ч в день)

---

## Definition of Done

| Задача | Критерий |
|--------|----------|
| R7 | nav + footer + pricing на странице, экспортируются в Bitrix |
| R8 | Stack в Редакторе: добавить Stack, перетащить Button внутрь |
| R9 | Кнопки A/B/C в Inspector меняют вид блока |
| R10 | Все 3 блока в Insert, работают в export |
| R11 | Видео, иконки, форма добавляются в компонент |
| R12 | Кнопка Edit на hero-01 → диалог → создаётся component-XX |
| R13 | Поиск в CMS, слайдер показывает 5 карточек |
