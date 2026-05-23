# Core & CLI Architecture

## Core responsibilities

- Package registry sync.
- Dependency graph resolution.
- Install/update/rollback.
- Lockfile consistency.

## CLI commands

- `randee install <package>`
- `randee update`
- `randee rollback`
- `randee sync`
- `randee list`

## Safety model

- checksums для пакетов (stored + compared in lockfile).
- snapshots before install/update/rollback.
- dry-run и migration hooks запланированы в следующем итерационном шаге.
