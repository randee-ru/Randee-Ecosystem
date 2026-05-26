# Roadmap: `randee.connector` + CMS Bindings в Builder

Статус: draft  
Дата: 2026-05-24

## 1. Цель

Сделать подключение Builder к данным Bitrix без экспорта:

- подключение сайта в разделе `CMS`;
- выбор инфоблока/поля в правом Inspector;
- live preview компонента на реальных данных.

В этой фазе **не делаем** выгрузку в Bitrix.

## 2. Архитектура

### 2.1 Bitrix side

Пакет marketplace-формата:

- `product_id`: `randee.connector`
- `type`: `component`
- установка в `local/components/randee/connector`

Компонент предоставляет read-only JSON API.

### 2.2 Builder side

- хранит CMS connection (`siteUrl`, `apiKey`, `connectorPath`);
- запрашивает schema инфоблоков и sample data;
- сохраняет привязки по каждому prop (`static` или `binding`);
- резолвит данные в canvas preview.

## 3. Контракт привязок (Builder)

Источник типа уже добавлен в `@randee/builder`:

- файл: `packages/builder/src/types/cms-binding.ts`
- поле в блоке: `PageBlock.cmsBindings`

Ключевая идея:

- для каждого `prop` есть `mode`:
  - `static`
  - `binding`
- в `binding` храним источник (`iblock`, `element/list/section`) и `field/property`.

## 4. API `randee.connector` (MVP)

Все ответы в формате:

```json
{
  "ok": true,
  "data": {},
  "meta": {},
  "error": null
}
```

Эндпоинты (`component.php?action=...`):

1. `ping`
2. `iblocks.list`
3. `iblock.schema&iblockId=...`
4. `elements.list&iblockId=...&limit=20&offset=0`
5. `element.get&iblockId=...&elementId=...`

## 5. Нагрузка и безопасность

Обязательные ограничения:

1. allowlist инфоблоков в настройках компонента;
2. read-only доступ;
3. `limit` по умолчанию 20, максимум 100;
4. rate limit на `apiKey`;
5. кеш schema 10-15 минут, lists 30-120 секунд;
6. выборка только нужных полей (`select`), без `*`.

## 6. Правый Inspector: что выбирает пользователь

Для каждого prop:

1. `Source mode`: `Static` или `Bitrix binding`;
2. `Iblock`;
3. `Entity`: `Element` / `List` / `Section`;
4. `Field` или `Property code`;
5. Для list: `limit/sort/filter`;
6. `Fallback`.

## 7. План внедрения

### Phase 1. Contract + types

- [x] типы binding в `@randee/builder`;
- [ ] API spec примеры payload в docs.

### Phase 2. Connector component MVP

- [ ] scaffold пакета `randee.connector`;
- [ ] `component.php` с action router;
- [ ] `iblocks.list`, `iblock.schema`, `elements.list`, `element.get`;
- [ ] auth + allowlist + rate limit + кэш.

### Phase 3. Builder CMS panel

- [ ] UI подключения (`siteUrl`, `apiKey`, `connectorPath`);
- [ ] проверка `ping`;
- [ ] загрузка инфоблоков и schema.

### Phase 4. Inspector bindings UI

- [ ] переключатель static/binding;
- [ ] выбор iblock/field/property;
- [ ] сохранение в `cmsBindings`.

### Phase 5. Live preview data resolver

- [ ] fetch sample data по binding;
- [ ] подстановка в props preview;
- [ ] fallback и ошибки в UI.

### Phase 6. Инструкция для команды

- [ ] раздел в Builder Instructions: подключение CMS;
- [ ] шаги по настройке `randee.connector` на сайте;
- [ ] troubleshooting (401/403/empty data/rate limit).

## 8. Definition of Done (без экспорта)

Готово, когда:

1. можно подключить сайт из Builder;
2. можно выбрать инфоблок и свойства у пропса;
3. компонент показывает реальные данные в preview;
4. повторное открытие страницы сохраняет привязки.
