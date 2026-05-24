# Урок 06: Roadmap блоков Builder

Краткая версия полного плана: [docs/builder/blocks-roadmap-ru.md](../docs/builder/blocks-roadmap-ru.md)

## Что уже работает

- Страница = JSON со списком блоков (`type`, `template`, `props`).
- **Insert** — встроенные шаблоны (Hero, FAQ, …).
- **New → Component** — пустой `component-01` на диске.
- **Save to Assets** — блок попадает в библиотеку для повторного использования.
- **Blocks** — дерево, код (preview / style / script), rename.
- **Edit Component** — artboard + props + layout.
- **Export** JSON, HTML, Bitrix (API).

## Что делаем дальше (по приоритету)

### P0 — базовый цикл

1. **Zip при Export Bitrix** — скачать архив, а не только tmp на сервере.
2. **Reload превью** после сохранения кода.
3. **Props из manifest** — нормальные поля в Inspector, не сырые ключи.
4. **Duplicate component** — копия шаблона как новый `component-XX`.

### P1 — persistence и экспорт

5. **Save/Load страницы** по slug (API).
6. **Export одного блока** (CLI + UI).
7. **Bitrix template.php** ближе к реальному preview.
8. **design** из Edit Component в export pipeline.

### P1 — UX

9. **dnd-kit** для reorder (вместо HTML5 drag на iPad).
10. **Assets CRUD** — rename/delete component.

### P2 — Framer-level

11. **Слои внутри компонента** — выбор элементов на canvas.
12. **Marketplace** — публикация `.randee-block` пакетов.

## Критерий «MVP блоков готов»

Создать component → отредактировать → Save to Assets → сохранить страницу → скачать Bitrix zip → вставить блок на другую страницу — **всё из UI, без ручного git**.

## Практика после каждой фазы

| Фаза | Проверка |
|------|----------|
| P0 | Export Bitrix → открыть zip, есть `local/components/randee/component_XX` |
| P1 | Закрыть вкладку, открыть `/builder?slug=demo` — блоки на месте |
| P2 | Опубликовать блок в marketplace (когда появится UI) |
