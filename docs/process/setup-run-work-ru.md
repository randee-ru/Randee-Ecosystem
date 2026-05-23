# Randee: Настройка, запуск и работа (RU)

Документ актуален для состояния репозитория на **23 мая 2026**.

## 1. Требования

- Node.js: `>=22`
- npm: `>=10`
- Git
- macOS/Linux/WSL (рекомендовано)

Проверка версий:

```bash
node -v
npm -v
git --version
```

## 2. Первичная настройка

В корне репозитория:

```bash
npm install
```

После установки появится `package-lock.json` и `node_modules`.

## 3. Структура проекта

- `apps/web` — Next.js приложение (будущий Builder UI)
- `apps/api` — backend-заготовка
- `packages/ui` — Randee UI Kit (компоненты, stories, тесты)
- `packages/*` — будущие core/builder/exporter/bitrix-adapter пакеты
- `docs/*` — архитектура, roadmap и процессы

## 4. Основные команды (root)

Запуск dev-режима web-приложения:

```bash
npm run dev
```

Проверка линта по workspace:

```bash
npm run lint
```

Проверка типов:

```bash
npm run typecheck
```

Запуск unit-тестов:

```bash
npm run test
```

E2E тесты:

```bash
npm run test:e2e
```

Storybook:

```bash
npm run storybook
```

Сборка Storybook:

```bash
npm run build-storybook
```

Production build:

```bash
npm run build
```

## 5. Команды по пакетам

UI пакет:

```bash
npm run test --workspace @randee/ui
npm run typecheck --workspace @randee/ui
npm run storybook --workspace @randee/ui
```

Web пакет:

```bash
npm run dev --workspace @randee/web
npm run build --workspace @randee/web
npm run lint --workspace @randee/web
```

## 6. Как сейчас работать по roadmap

### Шаг 1. Выбрать пункт в `ROADMAP.md`

Открыть [ROADMAP.md](/Users/pinomax/Desktop/randee/ Randee Ecosystem/ROADMAP.md) и выбрать следующий незавершенный пункт.

### Шаг 2. Реализовать в соответствующем пакете

- UI primitives/sections: `packages/ui`
- Builder функции: `apps/web` + `packages/builder`
- Bitrix export: `packages/exporter` + `packages/bitrix-adapter`

### Шаг 3. Проверки перед коммитом

Минимум:

```bash
npm run typecheck
npm run test
npm run lint
```

### Шаг 4. Коммит и push

```bash
git add .
git commit -m "feat(scope): short description"
git push
```

## 7. Текущий статус (Phase 1)

- Monorepo bootstrap: готово
- `apps/web` (Next.js + Tailwind + shadcn base): готово
- `packages/ui` primitives: Button/Input/Card/Select/Tabs/Modal/Tooltip/Table готовы
- `Hero` section: готова
- Visual regression: в планах
- Остальные Sections v1: в работе

Детали прогресса: [phase-1-progress.md](/Users/pinomax/Desktop/randee/ Randee Ecosystem/docs/process/phase-1-progress.md)

## 8. Частые проблемы

### `ENOTFOUND registry.npmjs.org`

Проблема сети/DNS. Повторите `npm install` при стабильном соединении.

### Ошибки TypeScript по алиасам

Проверьте `tsconfig.json` в пакете и наличие `paths`/`baseUrl`.

### Next build не проходит в sandbox

Для ограниченных сред может потребоваться запуск с повышенными правами/вне sandbox.

## 9. Ближайший порядок работ

1. Завершить `Sections v1`: Features, FAQ, CTA, Header, Footer.
2. Добавить visual regression pipeline.
3. Перейти к Phase 2 (Bitrix integration scaffolding).
