import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  readLockfile,
  readRegistry,
  readSnapshot,
  resolveCorePaths,
  snapshotLockfile,
  writeLockfile,
  writeRegistry,
  type CorePaths
} from '../storage/json-store'
import type { LockPackage, LockfileDocument, RegistryDocument, RegistryPackage } from '../types/registry'

export interface CoreEngineOptions {
  cwd: string
}

export interface OperationResult {
  changed: boolean
  message: string
  snapshotId?: string
}

function asLockPackage(pkg: RegistryPackage): LockPackage {
  return {
    name: pkg.name,
    version: pkg.version,
    checksum: pkg.checksum,
    dependencies: pkg.dependencies ?? {}
  }
}

function upsert(lockfile: LockfileDocument, pkg: LockPackage): LockfileDocument {
  const rest = lockfile.packages.filter((entry) => entry.name !== pkg.name)
  return {
    generatedAt: new Date().toISOString(),
    packages: [...rest, pkg].sort((a, b) => a.name.localeCompare(b.name))
  }
}

function findRegistryPackage(registry: RegistryDocument, name: string): RegistryPackage {
  const pkg = registry.packages.find((entry) => entry.name === name)
  if (!pkg) throw new Error(`Package not found in registry: ${name}`)
  return pkg
}

export class CoreEngine {
  private readonly paths: CorePaths

  constructor(private readonly options: CoreEngineOptions) {
    this.paths = resolveCorePaths(options.cwd)
  }

  async syncRegistryFromFile(filePath: string): Promise<OperationResult> {
    const raw = await readFile(resolve(this.options.cwd, filePath), 'utf8')
    const registry = JSON.parse(raw) as RegistryDocument

    if (!Array.isArray(registry.packages)) {
      throw new Error('Invalid registry: packages must be an array')
    }

    await writeRegistry(this.paths, { ...registry, updatedAt: new Date().toISOString() })
    return { changed: true, message: `Registry synced (${registry.packages.length} packages)` }
  }

  async listInstalled(): Promise<LockPackage[]> {
    const lock = await readLockfile(this.paths)
    return lock.packages
  }

  async install(name: string): Promise<OperationResult> {
    const registry = await readRegistry(this.paths)
    const lockfile = await readLockfile(this.paths)
    const pkg = asLockPackage(findRegistryPackage(registry, name))

    const prev = lockfile.packages.find((entry) => entry.name === name)
    if (prev && prev.version === pkg.version) {
      return { changed: false, message: `${name} already installed (${pkg.version})` }
    }

    const snapshotId = await snapshotLockfile(this.paths, lockfile)
    await writeLockfile(this.paths, upsert(lockfile, pkg))

    return { changed: true, snapshotId, message: `Installed ${name}@${pkg.version}` }
  }

  async update(name?: string): Promise<OperationResult> {
    const registry = await readRegistry(this.paths)
    const lockfile = await readLockfile(this.paths)

    if (lockfile.packages.length === 0) {
      return { changed: false, message: 'No installed packages' }
    }

    const snapshotId = await snapshotLockfile(this.paths, lockfile)
    let next = lockfile
    let changed = false

    for (const installed of lockfile.packages) {
      if (name && installed.name !== name) continue
      const latest = asLockPackage(findRegistryPackage(registry, installed.name))
      if (latest.version !== installed.version || latest.checksum !== installed.checksum) {
        changed = true
        next = upsert(next, latest)
      }
    }

    if (!changed) {
      return { changed: false, message: name ? `${name} already up to date` : 'All packages are up to date' }
    }

    await writeLockfile(this.paths, next)
    return { changed: true, snapshotId, message: name ? `Updated ${name}` : 'Updated installed packages' }
  }

  async rollback(snapshotId: string): Promise<OperationResult> {
    const lock = await readLockfile(this.paths)
    const snapshot = await readSnapshot(this.paths, snapshotId)

    await snapshotLockfile(this.paths, lock)
    await writeLockfile(this.paths, { ...snapshot, generatedAt: new Date().toISOString() })

    return { changed: true, message: `Rollback completed to snapshot ${snapshotId}` }
  }

  async state() {
    const registry = await readRegistry(this.paths)
    const lockfile = await readLockfile(this.paths)
    return { registry, lockfile }
  }
}
