# Phase 6: Marketplace (RU)

## Что реализовано

### Пакет `@randee/marketplace`

- marketplace index storage (`.randee/marketplace/index.json`)
- license storage (`.randee/marketplace/licenses.json`)
- package publish/list/get
- license upsert/validation
- version resolve (latest or exact)
- install flow через `@randee/core`

### CLI marketplace команды

- `randee marketplace:publish --file <json>`
- `randee marketplace:list`
- `randee marketplace:license --key <KEY> --tier <free|pro|enterprise>`
- `randee marketplace:install --name <package> --license <KEY>`

### API backend (`apps/api`)

REST endpoints:

- `GET /health`
- `GET /marketplace/packages`
- `GET /marketplace/packages/:name`
- `POST /marketplace/publish`
- `POST /marketplace/licenses`
- `POST /marketplace/license/check`
- `POST /marketplace/install`
- `GET /marketplace/download/:name?version=...`

## Практический сценарий

```bash
npm run randee:marketplace:publish -- --file ./samples/marketplace/hero-pro.json
npm run randee:marketplace:list
npm run randee:marketplace:license -- --key PRO-DEMO --tier pro
npm run randee:marketplace:install -- --name hero-pro --license PRO-DEMO
npm run randee:list
```

## Следующий шаг

1. Подключить реальный billing/license provider.
2. Добавить signed download urls и TTL.
3. Добавить moderation flow publish -> review -> release.
