# Урок 05: SEO и Dynamic CMS

## Цель

Отредактировать SEO в Builder и получить `randee-seo.json`.

## Шаги

1. Откройте `/builder`.
2. В правой панели заполните:
   - `SEO title`
   - `SEO description`
   - `Canonical URL`
   - `OG image URL`
3. Экспортируйте JSON.
4. Запустите экспорт в Bitrix.

```bash
npm run randee:export -- --input ./уроки/examples/page-seo.json --out ./dist/bitrix-site-seo
```

## Проверка

Проверьте файл:

- `dist/bitrix-site-seo/randee-seo.json`
