# Phase 2 Progress

## Status as of 2026-05-23

- [x] `@randee/bitrix-adapter` package scaffold
- [x] Bitrix component file generator
- [x] `@randee/exporter` package scaffold
- [x] Export engine + manifest generation
- [x] Export map: `hero`, `faq`, `catalog.section`, `highload.list`
- [x] `@randee/cli` commands for component generation and export
- [x] Sample page JSON and end-to-end export run
- [x] Strict schema validation for block props and bindings
- [x] Snapshot/regression tests for generated PHP templates

## Next for Phase 2 hardening

1. Add field-level highload mapping strategy (`UF_*` mapper).
2. Add richer `.parameters.php` generation based on binding contracts.
3. Add backward-compat fixtures for future exporter versions.
