import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { LockfileDocument, RegistryDocument } from '../types/registry'

export interface CorePaths {
  rootDir: string
  registryPath: string
  lockfilePath: string
  historyDir: string
}

export function resolveCorePaths(rootDir: string): CorePaths {
  const randeeDir = join(rootDir, '.randee')
  return {
    rootDir,
    registryPath: join(randeeDir, 'registry.json'),
    lockfilePath: join(randeeDir, 'lock.json'),
    historyDir: join(randeeDir, 'history')
  }
}

export async function ensureCoreDirs(paths: CorePaths): Promise<void> {
  await mkdir(join(paths.rootDir, '.randee'), { recursive: true })
  await mkdir(paths.historyDir, { recursive: true })
}

export async function readRegistry(paths: CorePaths): Promise<RegistryDocument> {
  if (!existsSync(paths.registryPath)) {
    return { updatedAt: new Date(0).toISOString(), packages: [] }
  }
  return JSON.parse(await readFile(paths.registryPath, 'utf8')) as RegistryDocument
}

export async function writeRegistry(paths: CorePaths, registry: RegistryDocument): Promise<void> {
  await ensureCoreDirs(paths)
  await writeFile(paths.registryPath, JSON.stringify(registry, null, 2), 'utf8')
}

export async function readLockfile(paths: CorePaths): Promise<LockfileDocument> {
  if (!existsSync(paths.lockfilePath)) {
    return { generatedAt: new Date(0).toISOString(), packages: [] }
  }
  return JSON.parse(await readFile(paths.lockfilePath, 'utf8')) as LockfileDocument
}

export async function writeLockfile(paths: CorePaths, lockfile: LockfileDocument): Promise<void> {
  await ensureCoreDirs(paths)
  await writeFile(paths.lockfilePath, JSON.stringify(lockfile, null, 2), 'utf8')
}

export async function snapshotLockfile(paths: CorePaths, lockfile: LockfileDocument): Promise<string> {
  await ensureCoreDirs(paths)
  const id = `${Date.now()}`
  await writeFile(join(paths.historyDir, `${id}.json`), JSON.stringify(lockfile, null, 2), 'utf8')
  return id
}

export async function readSnapshot(paths: CorePaths, snapshotId: string): Promise<LockfileDocument> {
  return JSON.parse(await readFile(join(paths.historyDir, `${snapshotId}.json`), 'utf8')) as LockfileDocument
}
