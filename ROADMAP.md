# Randee Roadmap

## Phase 1 — Randee UI Foundation

### Цель
Собрать базовую UI-платформу и инженерный фундамент.

### Execution Status (2026-05-23)
- [x] Monorepo bootstrap.
- [x] Next/Tailwind/TypeScript strict setup.
- [x] ESLint + Prettier + Stylelint.
- [x] Storybook + addon-a11y.
- [x] Visual regression integration.
- [x] UI Kit primitives (core + backlog set implemented).
- [x] Sections v1 (Hero, Features, FAQ, CTA, Header, Footer).
- [~] Variants system + tokens + theming (base layer ready, needs token expansion).

### Scope
- Monorepo bootstrap.
- Vite/Next/Tailwind/TypeScript strict setup.
- ESLint + Prettier + Stylelint.
- Storybook + a11y addon + visual regression integration.
- UI Kit primitives: Button/Input/Select/Tabs/Card/Modal/Tooltip/Table и др.
- Sections v1: Hero, Features, FAQ, CTA, Footer, Header.
- Variants system + tokens + theming.

### Deliverables
- Рабочая `packages/ui`.
- Stories + tests на каждый компонент.
- Документированные API/props.

## Phase 2 — Bitrix Integration

### Цель
Создать стабильный путь экспорта и исполнения в 1С-Битрикс.

### Scope
- Генератор структуры `local/components/randee/*`.
- Template engine для `template.php/style.css/script.js`.
- Интеграция с infoblock/highloadblock bindings.
- Валидация экспортируемых артефактов.

### Deliverables
- `packages/bitrix-adapter`.
- Export maps: Randee block -> Bitrix component.
- Тестовые демо-компоненты (`hero`, `faq`, `catalog.section`).

### Execution Status (2026-05-23)
- [x] Generator structure for `local/components/randee/*`.
- [x] Template engine for `component.php/.parameters.php/template.php/style.css/script.js`.
- [x] Export maps for `hero`, `faq`, `catalog.section`.
- [x] CLI export flow for page JSON -> Bitrix artifacts.
- [~] Infoblock/highload bindings (MVP props-level contract; strict validation pending).

## Phase 3 — Randee Core

### Цель
Построить ядро пакетов, обновлений и dependency graph.

### Scope
- Registry schema.
- Install/update/rollback engine.
- Semver policies.
- Lockfile.
- CLI команды `randee install/update/rollback/sync/list`.

### Deliverables
- `packages/core` + `packages/cli`.
- Package metadata contract.
- Интеграционные тесты обновлений.

### Execution Status (2026-05-23)
- [x] Registry schema and sample registries.
- [x] Install/update/rollback/sync/list engine in `@randee/core`.
- [x] Lockfile + snapshots in `.randee/*`.
- [x] CLI commands wired in `@randee/cli`.
- [~] Dependency graph resolution (MVP state; advanced resolver pending).

## Phase 4 — Builder MVP

### Цель
Собрать визуальный редактор блоков с живым превью.

### Scope
- DnD canvas + block library.
- CRUD для блоков.
- Inline props editor.
- Responsive preview (desktop/tablet/mobile).
- Page JSON schema.
- Экспорт HTML + Bitrix package.

### Deliverables
- `apps/web` MVP builder.
- `packages/builder` + `packages/exporter`.
- E2E сценарии на Playwright.

### Execution Status (2026-05-23)
- [x] Block CRUD and JSON schema editing.
- [x] Responsive preview modes in `apps/web`.
- [x] JSON/HTML export from Builder state.
- [x] Builder package (`@randee/builder`) and web route `/builder`.
- [~] Drag-and-drop reorder (native DnD; dnd-kit integration pending).
- [~] Live preview (focused block; full-stack page preview pending).

## Phase 5 — Dynamic CMS Layer

### Цель
Добавить динамические данные и SEO-панель.

### Scope
- Инфоблок data bindings.
- Dynamic fields mapping.
- SEO metadata editor.
- Schema.org JSON-LD support.

### Execution Status (2026-05-23)
- [x] SEO metadata editor in Builder.
- [x] Schema.org JSON-LD helper and export artifact.
- [~] Dynamic bindings model in Builder schema (foundation).
- [ ] API-backed dynamic data providers.

## Phase 6 — Marketplace

### Цель
Запустить каталог модулей и шаблонов с лицензированием.

### Scope
- Marketplace backend.
- Package publishing flow.
- License + version checks.
- Download/install/update flow.

## Phase 7 — Randee Cloud

### Цель
Дать командам облачные функции поверх экосистемы.

### Scope
- Preview deploys.
- Team collaboration.
- Project sync.
- Audit/activity trail.

## Cross-phase Quality Gates

- TypeScript strict mode mandatory.
- Unit coverage thresholds per package.
- Playwright smoke + critical E2E flows.
- Visual regression checks for UI packages.
- Accessibility checks (axe-core + Storybook addon-a11y).
