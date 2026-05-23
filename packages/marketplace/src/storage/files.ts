import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { LicenseStore, MarketplaceIndex } from '../types/marketplace'

export interface MarketplacePaths {
  indexPath: string
  licensesPath: string
}

export function resolveMarketplacePaths(rootDir: string): MarketplacePaths {
  const marketplaceDir = join(rootDir, '.randee', 'marketplace')
  return {
    indexPath: join(marketplaceDir, 'index.json'),
    licensesPath: join(marketplaceDir, 'licenses.json')
  }
}

export async function ensureMarketplaceDirs(paths: MarketplacePaths): Promise<void> {
  await mkdir(join(paths.indexPath, '..'), { recursive: true })
}

export async function readIndex(paths: MarketplacePaths): Promise<MarketplaceIndex> {
  if (!existsSync(paths.indexPath)) {
    return { updatedAt: new Date(0).toISOString(), packages: [] }
  }

  return JSON.parse(await readFile(paths.indexPath, 'utf8')) as MarketplaceIndex
}

export async function writeIndex(paths: MarketplacePaths, data: MarketplaceIndex): Promise<void> {
  await ensureMarketplaceDirs(paths)
  await writeFile(paths.indexPath, JSON.stringify(data, null, 2), 'utf8')
}

export async function readLicenses(paths: MarketplacePaths): Promise<LicenseStore> {
  if (!existsSync(paths.licensesPath)) {
    return { updatedAt: new Date(0).toISOString(), licenses: [] }
  }

  return JSON.parse(await readFile(paths.licensesPath, 'utf8')) as LicenseStore
}

export async function writeLicenses(paths: MarketplacePaths, data: LicenseStore): Promise<void> {
  await ensureMarketplaceDirs(paths)
  await writeFile(paths.licensesPath, JSON.stringify(data, null, 2), 'utf8')
}
