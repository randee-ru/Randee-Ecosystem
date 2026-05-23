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

- dry-run для update/rollback.
- checksums для пакетов.
- migration hooks per package version.
