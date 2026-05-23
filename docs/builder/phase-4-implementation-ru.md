# Phase 4: Builder MVP (RU)

## Что реализовано

### Пакет `@randee/builder`

- page schema (`BuilderPage`, `PageBlock`)
- block registry + default templates/props
- state/actions store (zustand/vanilla)
- операции:
  - add
  - remove
  - duplicate
  - reorder
  - update props
  - viewport switch
- export helpers:
  - JSON export
  - HTML export

### Web интеграция (`apps/web`)

Страница `/builder` включает:

- добавление блоков из библиотеки;
- удаление/дублирование;
- drag-and-drop reorder (native DnD);
- props inspector;
- responsive preview (desktop/tablet/mobile);
- live JSON preview;
- экспорт `page.json` и `page.html`.

## Файлы

- `packages/builder/src/*`
- `apps/web/app/builder/page.tsx`

## Ограничения текущего MVP

- drag-and-drop реализован native API, без dnd-kit sortable abstraction;
- live preview пока рендерит по одной активной секции;
- экспорт в Bitrix выполняется отдельным потоком через `@randee/exporter`.

## Следующий шаг Phase 4

1. Перейти на dnd-kit sortable канвас.
2. Рендерить в preview весь стек блоков страницы.
3. Добавить сохранение/загрузку JSON проектов из `apps/api`.
