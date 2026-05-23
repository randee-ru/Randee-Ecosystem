# Phase 5: Dynamic CMS Layer (RU)

## Что добавлено

### Builder schema расширен

`@randee/builder` теперь включает:

- `seo` объект на уровне страницы:
  - `title`
  - `description`
  - `canonicalUrl`
  - `noindex`
  - `ogImage`
- `bindings` на уровне блока (foundation для dynamic data mapping).

### SEO editor в Builder UI

На странице `/builder` добавлены панели:

- Page Meta editor (`page`, `slug`)
- SEO editor (`title`, `description`, `canonicalUrl`, `ogImage`, `noindex`)
- live preview `JSON-LD`.

### Export layer

`@randee/exporter` дополнен:

- helper `buildWebPageJsonLd` (`schema.org WebPage`)
- экспорт `randee-seo.json` рядом с `randee-export-manifest.json` при наличии `seo`.

## Ключевые файлы

- `packages/builder/src/types/page.ts`
- `packages/builder/src/store/builder-store.ts`
- `apps/web/app/builder/page.tsx`
- `packages/exporter/src/engine/seo-jsonld.ts`
- `packages/exporter/src/engine/export-bitrix-page.ts`

## Следующий шаг

1. Связать bindings с реальными data providers (`apps/api`).
2. Добавить schema validation для SEO полей (`url` format, длины).
3. Добавить meta insertion в HTML export pipeline.
