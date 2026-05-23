# Randee Ecosystem

Современная модульная экосистема для быстрой разработки сайтов на 1С-Битрикс.

## Миссия

Randee — это не конструктор лендингов в стиле Tilda. Цель проекта — дать Bitrix-разработчикам современную инженерную инфраструктуру:

- Tailwind-first UI framework;
- компонентная система с повторным использованием;
- визуальный drag-and-drop builder;
- экспорт в Bitrix-компоненты и шаблоны;
- маркетплейс блоков, секций и шаблонов;
- система версионирования, обновлений и rollback;
- сильный DX и стандарты качества.

## Состав системы

- `Randee UI` — библиотека компонентов и секций.
- `Randee Core` — ядро пакетов, зависимостей и обновлений.
- `Randee Builder` — визуальный редактор страниц.
- `Randee Marketplace` — каталог и дистрибуция модулей.
- `Randee Cloud` — облачные сервисы (preview, collaboration, sync).

## Монорепозиторий

```txt
apps/
  web/                 # Builder/Web UI (Next.js)
  api/                 # Backend API (NestJS/Express)
packages/
  ui/                  # Randee UI Kit
  core/                # Registry, updates, dependencies
  builder/             # DnD, page model, editor engine
  exporter/            # Export to HTML/Bitrix
  cli/                 # randee CLI
  bitrix-adapter/      # Bitrix integration layer
  cloud/               # Randee Cloud domain services
tooling/
  scripts/             # internal scripts
.docs/                 # optional generated docs

docs/
  architecture/        # системная архитектура
  bitrix/              # структура и экспорт Bitrix
  builder/             # builder model и UX flows
  core/                # пакеты, обновления, registry
  marketplace/         # marketplace design
  cloud/               # cloud design
  process/             # quality, ci/cd, standards
```

## Технологический стек

- Frontend: React, Next.js, TypeScript, TailwindCSS, Zustand, dnd-kit, shadcn/ui
- Backend: Node.js, Express/NestJS, PostgreSQL, Supabase
- Анимации: GSAP, Framer Motion
- Формы/валидация: React Hook Form, Zod
- Data: TanStack Query/Table
- Quality: Vitest, RTL, Playwright, Storybook, Chromatic, ESLint, Prettier, Stylelint

## Документация

- [Product Roadmap](./ROADMAP.md)
- [System Architecture](./docs/architecture/system-architecture.md)
- [UI Architecture](./docs/architecture/ui-architecture.md)
- [Builder Architecture](./docs/builder/builder-architecture.md)
- [Phase 4 Builder Implementation (RU)](./docs/builder/phase-4-implementation-ru.md)
- [Phase 5 Dynamic CMS Implementation (RU)](./docs/builder/phase-5-implementation-ru.md)
- [Bitrix Export Architecture](./docs/bitrix/export-architecture.md)
- [Phase 2 Bitrix Implementation (RU)](./docs/bitrix/phase-2-implementation-ru.md)
- [Core & CLI Architecture](./docs/core/core-cli-architecture.md)
- [Phase 3 Core Implementation (RU)](./docs/core/phase-3-implementation-ru.md)
- [Phase 6 Marketplace Implementation (RU)](./docs/marketplace/phase-6-implementation-ru.md)
- [Phase 7 Cloud Implementation (RU)](./docs/cloud/phase-7-implementation-ru.md)
- [Engineering Standards](./docs/process/engineering-standards.md)
- [Code Comment Policy](./docs/process/code-comment-policy.md)
- [Setup/Run Guide (RU)](./docs/process/setup-run-work-ru.md)
- [Animation Composition (RU)](./docs/process/animation-composition-ru.md)
- [Phase 8 Production Hardening (RU)](./docs/process/phase-8-production-hardening-ru.md)

## Быстрый старт (план)

После инициализации package manager (pnpm/npm):

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run storybook
npm run randee:marketplace:list
npm run randee:cloud:project:list
npm run randee:hardening:check
```

## Git workflow

1. Основная ветка: `main`.
2. Рабочие ветки: `feature/*`, `fix/*`, `chore/*`.
3. PR обязателен для merge.
4. Проверки CI обязательны перед merge.

## Лицензирование

На этапе bootstrap используйте приватный репозиторий. Политику лицензирования маркетплейса и коммерческих модулей фиксируйте в отдельном документе `docs/marketplace/licensing.md`.
