# Урок 04: Core и обновления

## Цель

Понять lifecycle пакетов: sync, install, update, rollback.

## Шаги

```bash
npm run randee:sync -- --registry ./уроки/examples/registry-v1.json
npm run randee:install -- hero
npm run randee:list

npm run randee:sync -- --registry ./уроки/examples/registry-v2.json
npm run randee:update -- hero
npm run randee:list
```

## Откат

Скопируйте `Snapshot: <id>` после `update`, затем:

```bash
npm run randee:rollback -- --snapshot <id>
npm run randee:list
```
