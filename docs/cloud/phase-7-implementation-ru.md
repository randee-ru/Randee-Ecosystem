# Phase 7 — Randee Cloud (MVP)

Дата: 2026-05-23

## Что реализовано

- Пакет `@randee/cloud` с локальным cloud-state (`.randee/cloud/state.json`).
- Управление проектами: создание и список.
- Team collaboration: добавление участников с ролями (`owner/admin/developer/viewer`).
- Preview deploys: генерация preview URL и запись статуса деплоя.
- Project sync: фиксация последней синхронизации (`source`, `filesCount`, `lastSyncedAt`).
- Audit trail: журнал действий по проекту.

## API endpoints

- `POST /cloud/projects`
- `GET /cloud/projects`
- `POST /cloud/projects/:projectId/members`
- `POST /cloud/projects/:projectId/previews`
- `GET /cloud/projects/:projectId/previews`
- `POST /cloud/projects/:projectId/sync`
- `GET /cloud/projects/:projectId/sync`
- `GET /cloud/projects/:projectId/audit`

## CLI команды

- `randee cloud:project:create --name ... --slug ... --owner ...`
- `randee cloud:project:list`
- `randee cloud:member:add --project ... --email ... --role ... --actor ...`
- `randee cloud:preview --project ... --branch ... --sha ... --actor ...`
- `randee cloud:sync --project ... --source local|cloud --files ... --actor ...`
- `randee cloud:audit --project ...`

## Ограничения MVP

- Хранилище локальное (JSON), без внешнего DB.
- Preview URL с детерминированным шаблоном, без real deploy provider.
- Нет auth/ACL middleware на API.

## Следующий инкремент

- Подключить Supabase/PostgreSQL для multi-user режима.
- Добавить authN/authZ и разделение доступа по ролям.
- Вынести preview execution в queue/job-runner.
