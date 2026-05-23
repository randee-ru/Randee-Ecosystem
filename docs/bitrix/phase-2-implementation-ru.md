# Phase 2: Bitrix Integration (RU)

## Что реализовано

### 1. Bitrix component generator

Пакет: `packages/bitrix-adapter`

Генератор создает структуру:

- `local/components/randee/<component>/component.php`
- `local/components/randee/<component>/.parameters.php`
- `local/components/randee/<component>/templates/.default/template.php`
- `local/components/randee/<component>/templates/.default/style.css`
- `local/components/randee/<component>/templates/.default/script.js`

### 2. Template engine + export engine

Пакет: `packages/exporter`

- map block -> bitrix descriptor;
- генерация компонентов через `@randee/bitrix-adapter`;
- формирование `randee-export-manifest.json`.

### 3. Поддержанные block types (MVP)

- `hero`
- `faq`
- `catalog.section`

### 4. CLI команды

Пакет: `packages/cli`

- `randee bitrix:component --name hero --title "Hero" --out ./dist`
- `randee export --input ./samples/pages/home.json --out ./dist/bitrix-site`

## Где лежит код

- `packages/bitrix-adapter/src/*`
- `packages/exporter/src/*`
- `packages/cli/src/index.ts`
- `samples/pages/home.json`

## Infoblock bindings (текущий статус)

В `catalog.section` уже заложен контракт под передачу:

- `iblockId`
- `sectionId`

На текущем этапе это schema-level binding в `props` block-а.

Следующий шаг Phase 2:

- добавить строгую валидацию binding-полей;
- добавить генерацию bitrix-специфичных параметров в `.parameters.php` на основе binding context.

## Пример запуска

```bash
node packages/cli/src/index.ts export --input ./samples/pages/home.json --out ./dist/bitrix-site
```

После выполнения появится:

- структура `local/components/randee/*`
- `randee-export-manifest.json`
