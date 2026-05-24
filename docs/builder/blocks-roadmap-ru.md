# Roadmap: блоки Builder MVP

Документ описывает **текущее состояние**, **цель MVP** и **оставшуюся работу** по циклу: создать → редактировать → опубликовать → выгрузить → переиспользовать блок.

Статус на: **2026-05-24**

---

## Текущее состояние (что уже есть)

| Область | Готово |
|--------|--------|
| Страница + блоки в JSON (`BuilderPage`, Zustand store) | ✅ |
| Библиотека встроенных шаблонов (`hero`, `faq`, `features`, …) | ✅ |
| CRUD на canvas: add, duplicate, delete, reorder | ✅ |
| Props в Inspector (string key-value) | ✅ |
| Responsive preview (desktop / tablet / mobile) | ✅ |
| **New → Component** (scaffold `component-XX/` на диске) | ✅ |
| **Save to Assets** (`savedToAssets`, Assets + Insert) | ✅ |
| **Blocks** — дерево, rename, context menu, code files | ✅ |
| CodeMirror: preview / style / script + PUT API | ✅ |
| **Edit Component** — artboard + props + layout/fill (`design`) | ✅ |
| Export JSON / HTML | ✅ |
| Export Bitrix (API, tmp на сервере) | ✅ |
| Custom component → Bitrix (css/js с диска, нужен Save to Assets) | ✅ |
| Touch / iPad (pinch, pan, long-press) | ✅ частично |

**Ключевые пути в коде**

- UI: `apps/web/app/builder/*`
- Store / schema: `packages/builder/src/*`
- Шаблоны и custom components: `packages/blocks/src/*`
- API: `apps/web/app/api/builder/*`
- Bitrix: `packages/exporter`, `packages/bitrix-adapter`, `packages/blocks/src/bitrix-export.ts`

---

## Цель MVP

Замкнутый цикл для **пользовательского блока** без правок monorepo вручную:

1. **Create** — создать блок из UI.
2. **Edit** — править props, код и визуальные настройки; видеть результат на canvas.
3. **Publish** — сохранить в Assets как переиспользуемый шаблон.
4. **Export** — выгрузить страницу или блок в Bitrix (zip) / JSON.
5. **Reuse** — вставить сохранённый блок на другую страницу.

---

## Фазы и приоритеты

### Phase A — P0: закрыть базовый цикл (1–2 недели)

#### A1. Скачивание Bitrix export (zip)

**Проблема:** `POST /api/builder/export-bitrix` пишет во `tmpdir`, пользователь не получает архив.

**Задачи**

- [ ] Собрать `exportRoot` в zip (например `archiver` или `adm-zip`).
- [ ] Отдавать `Content-Disposition: attachment` из API или второй endpoint `export-bitrix/download`.
- [ ] Кнопка **Export Bitrix** в builder скачивает `.zip`.

**Критерий готовности:** после экспорта в браузере лежит zip с `local/components/randee/*` и `randee-export-manifest.json`.

**Файлы:** `apps/web/app/api/builder/export-bitrix/`, `apps/web/app/builder/builder-editor.tsx`

---

#### A2. Reload превью после сохранения кода

**Проблема:** после PUT `preview.tsx` / `style.css` canvas может не обновиться без refresh.

**Задачи**

- [ ] После save в `BuilderAssetEditor` — bump версии шаблона / `registerUserTemplate` повторно.
- [ ] Инвалидировать кэш стилей (`data-randee-template-styles`).
- [ ] E2E: изменить `title` в preview.tsx → текст на canvas меняется.

**Файлы:** `builder-asset-editor.tsx`, `packages/blocks/src/registry.ts`, `generic-component-preview.tsx`

---

#### A3. Props из manifest (typed schema)

**Проблема:** Inspector показывает сырые `block.props`; нет labels, типов, defaults из manifest.

**Задачи**

- [ ] Расширить `BlockTemplateManifest`: `propsSchema` (name, label, type: text/number/boolean/select).
- [ ] Генерировать поля Inspector из schema для встроенных и custom blocks.
- [ ] Fallback на текущий key-value для старых manifest.

**Критерий готовности:** у hero/component поля с подписями, не только ключи JSON.

**Файлы:** `packages/blocks/src/types.ts`, `builder-component-inspector.tsx`, Properties panel

---

#### A4. Duplicate component as template

**Задачи**

- [ ] API `POST /api/builder/components/[template]/duplicate` — копия папки `component-XX`.
- [ ] Пункт в context menu Blocks или Assets: **Duplicate component**.
- [ ] Новый блок на canvas с тем же preview/style (копия файлов).

**Критерий готовности:** duplicate `component-01` → `component-03` с файлами на диске.

---

### Phase B — P1: persistence и экспорт блока (2–3 недели)

#### B1. Save / Load страницы

**Проблема:** страница только в memory + sessionStorage.

**Задачи**

- [ ] API `GET/POST /api/builder/pages/[slug]` — JSON на диск или БД.
- [ ] При открытии `/builder?slug=...` — `loadPage` в store.
- [ ] Autosave (debounce) + индикатор «Saved».

**Файлы:** новый `apps/web/app/api/builder/pages/`, `builder-editor.tsx`

---

#### B2. Export одного блока

**Задачи**

- [x] CLI: `randee export:block --template component-01 --out ./dist`.
- [x] UI: в Blocks context menu **Export block** (json + bitrix mini-package).
- [x] Manifest одного блока: template id, props, file list.

**Файлы:** `packages/cli`, `packages/blocks/src/component-io.ts`, API route

---

#### B3. Bitrix template.php из реального preview

**Проблема:** `mapUserComponentBlockToBitrix` генерирует упрощённый PHP, не HTML из preview.

**Задачи**

- [x] SSR-преобразование preview → HTML fragment (или статический шаблон + props map).
- [x] Подключать реальный `style.css` / `script.js` (уже частично есть).
- [x] Тест: export component → в Bitrix визуально близко к canvas.

**Файлы:** `packages/blocks/src/bitrix-export.ts`, `packages/exporter`

---

#### B4. `design` в export pipeline

**Задачи**

- [x] Решить: `design` → inline styles в export HTML / Bitrix (artboard — только editor).
- [x] Документировать контракт: `docs/builder/component-design-export-ru.md`.

**Файлы:** `builder-component-canvas.ts`, exporter mappers

---

### Phase C — P1: UX Blocks и Assets (1–2 недели)

#### C1. DnD reorder (dnd-kit)

**Проблема:** HTML5 drag не работает на iOS; reorder только context menu на touch.

**Задачи**

- [ ] `@dnd-kit/core` + sortable в `builder-layer-tree.tsx`.
- [ ] Сохранить long-press menu как fallback.

---

#### C2. Assets: полный CRUD компонентов

**Задачи**

- [ ] Rename component (meta + folder optional).
- [ ] Delete component (API + confirm, только если не на canvas).
- [ ] Move to folder / tags (опционально v2).

**Файлы:** `builder-assets-component-tree.tsx`, `component-io.ts`

---

#### C3. Edit Component — слои внутри preview

**Проблема:** редактируется artboard и props, но не отдельные элементы (h2, img) как во Framer.

**Задачи**

- [ ] Парсинг/регистрация layer tree из preview (v1: статический список из manifest).
- [ ] v2: click-to-select в iframe/preview root.
- [ ] Inspector для выбранного слоя (text, fill, spacing).

**Приоритет:** P2 для полного Framer-parity, P1 для read-only layer list + jump to code.

---

### Phase D — P2: marketplace и пакеты (post-MVP)

| ID | Задача | Зависимости |
|----|--------|-------------|
| D1 | Формат `.randee-block` (manifest + files tarball) | B2 |
| D2 | Publish в `@randee/marketplace` из Save to Assets | D1, B1 |
| D3 | Install block from marketplace → `registerUserTemplate` | D2 |
| D4 | Versioning / semver компонентов | D1, Phase 3 Core |

---

## Матрица: тип блока × операция

| Операция | Library (hero-01) | Custom (component-XX) |
|----------|-------------------|------------------------|
| Insert на страницу | ✅ | ✅ после Save to Assets |
| Props в UI | ✅ string | ✅ string |
| Code editor | ✅ файлы в repo | ✅ preview/style/script |
| Edit Component design | ✅ | ✅ |
| Bitrix export | ✅ mapper | ✅ если savedToAssets |
| Duplicate as template | — | 🔲 A4 |
| Export single block | 🔲 B2 | 🔲 B2 |
| Marketplace | — | 🔲 D2 |

---

## Рекомендуемый порядок работ

```
A1 zip export
  → A2 preview reload
  → A3 props schema
  → A4 duplicate component
  → B1 page save/load
  → B3 bitrix preview fidelity
  → B2 single block export
  → C1 dnd-kit
  → C2 assets CRUD
  → C3 inner layers (iterative)
  → D* marketplace
```

---

## Definition of Done — Blocks MVP

Считаем MVP **готовым**, когда:

1. Пользователь создаёт component, редактирует код и props, сохраняет в Assets **без git/IDE**.
2. Страница сохраняется и загружается по slug.
3. Bitrix export скачивается zip-ом; custom block с css/js попадает в `local/components/randee/`.
4. Сохранённый блок можно вставить на новую страницу из Assets.
5. Есть smoke E2E: create → edit code → save assets → export bitrix.

---

## Связанные документы

- [builder-architecture.md](./builder-architecture.md)
- [phase-4-progress.md](./phase-4-progress.md)
- [../bitrix/phase-2-implementation-ru.md](../bitrix/phase-2-implementation-ru.md)
- Уроки: [02-ui-и-builder.md](../../уроки/02-ui-и-builder.md), [03-экспорт-в-bitrix.md](../../уроки/03-экспорт-в-bitrix.md)
