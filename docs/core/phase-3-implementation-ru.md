# Phase 3: Randee Core (RU)

## Что реализовано

### Пакет `@randee/core`

- registry schema (`RegistryDocument`)
- lockfile schema (`LockfileDocument`)
- storage layer (`.randee/registry.json`, `.randee/lock.json`)
- history snapshots (`.randee/history/*.json`)
- engine операции:
  - `syncRegistryFromFile`
  - `install`
  - `update`
  - `rollback`
  - `listInstalled`

### Пакет `@randee/cli`

Команды Core:

- `randee sync --registry <path>`
- `randee list`
- `randee install <package>`
- `randee update [package]`
- `randee rollback --snapshot <id>`

Команды Bitrix Export (сохранены):

- `randee bitrix:component ...`
- `randee export ...`

## Локальные файлы состояния

В рабочем проекте создается каталог:

- `.randee/registry.json`
- `.randee/lock.json`
- `.randee/history/<snapshot>.json`

## Быстрый сценарий

```bash
npm run randee:sync -- --registry ./samples/core/registry.v1.json
npm run randee:install -- hero
npm run randee:list
npm run randee:sync -- --registry ./samples/core/registry.v2.json
npm run randee:update -- hero
npm run randee:list
npm run randee:rollback -- --snapshot <snapshot_id>
```

## Ограничения текущего этапа

- semver range-resolution пока упрощен (берется единственная latest запись по имени).
- dependency graph присутствует в schema, но полноценный resolver будет расширен в следующем шаге.
- checksums хранятся и сравниваются, но без внешней верификации источника.
