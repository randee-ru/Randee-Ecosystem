# Code Comment Policy

## Goal

Комментарии должны объяснять *почему* существует решение, а не *что* делает код построчно.

## Правила

- Писать комментарии для:
  - нетривиальной бизнес-логики;
  - сложных алгоритмов layout/export;
  - ограничений Bitrix-совместимости;
  - performance/animation trade-offs.
- Не писать комментарии-очевидности.
- Любой FIXME/TODO должен иметь контекст и owner-tag.

## Пример

```ts
// Bitrix template parser не поддерживает вложенные dynamic slots,
// поэтому flatten-им структуру до одноуровневого списка секций.
const flattened = flattenSections(tree)
```
