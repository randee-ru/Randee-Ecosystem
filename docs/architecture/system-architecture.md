# System Architecture

## Architectural style

Randee проектируется как модульный monorepo с четким разделением доменов:

- Presentation (`apps/web`, `packages/ui`)
- Domain/Core (`packages/core`, `packages/builder`)
- Integration (`packages/exporter`, `packages/bitrix-adapter`)
- Interfaces (`packages/cli`, `apps/api`)

## Core principles

- Composition over duplication.
- UI logic отделена от export logic.
- Bitrix-адаптер изолирован от UI runtime.
- Все ключевые контракты фиксируются schema-first подходом.

## Main data flow

1. Пользователь собирает страницу в Builder.
2. Builder хранит структуру в JSON schema.
3. Exporter конвертирует JSON в HTML/Bitrix artifacts.
4. Bitrix adapter генерирует корректную структуру компонентов.
5. Core отслеживает версии и зависимости установленных модулей.
