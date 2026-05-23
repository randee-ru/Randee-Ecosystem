import { CoreEngine } from '@randee/core'
import { join } from 'node:path'
import {
  readIndex,
  readLicenses,
  resolveMarketplacePaths,
  writeIndex,
  writeLicenses
} from '../storage/files'
import type {
  LicenseRecord,
  LicenseTier,
  MarketplaceIndex,
  MarketplacePackage,
  MarketplacePackageVersion
} from '../types/marketplace'

const tierPriority: Record<LicenseTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2
}

function parseVersion(value: string): [number, number, number] {
  const [major = '0', minor = '0', patch = '0'] = value.split('.')
  return [Number(major), Number(minor), Number(patch)]
}

function versionGte(a: string, b: string): boolean {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return true
    if (pa[i] < pb[i]) return false
  }
  return true
}

export class MarketplaceService {
  constructor(private readonly rootDir: string) {}

  private get paths() {
    return resolveMarketplacePaths(this.rootDir)
  }

  async listPackages(): Promise<MarketplacePackage[]> {
    return (await readIndex(this.paths)).packages
  }

  async getPackage(name: string): Promise<MarketplacePackage | undefined> {
    return (await this.listPackages()).find((pkg) => pkg.name === name)
  }

  async publishPackage(pkg: MarketplacePackage): Promise<void> {
    const index = await readIndex(this.paths)
    const filtered = index.packages.filter((entry) => entry.name !== pkg.name)
    await writeIndex(this.paths, {
      updatedAt: new Date().toISOString(),
      packages: [...filtered, pkg].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  async upsertLicense(license: LicenseRecord): Promise<void> {
    const licenses = await readLicenses(this.paths)
    const filtered = licenses.licenses.filter((entry) => entry.key !== license.key)
    await writeLicenses(this.paths, {
      updatedAt: new Date().toISOString(),
      licenses: [...filtered, license]
    })
  }

  async validateLicense(required: LicenseTier, key?: string): Promise<boolean> {
    if (required === 'free') return true
    if (!key) return false

    const store = await readLicenses(this.paths)
    const license = store.licenses.find((entry) => entry.key === key && entry.active)
    if (!license) return false

    return tierPriority[license.tier] >= tierPriority[required]
  }

  async resolveVersion(pkg: MarketplacePackage, version?: string): Promise<MarketplacePackageVersion> {
    if (version) {
      const found = pkg.versions.find((entry) => entry.version === version)
      if (!found) throw new Error(`Version not found: ${pkg.name}@${version}`)
      return found
    }

    const sorted = [...pkg.versions].sort((a, b) => (versionGte(a.version, b.version) ? -1 : 1))
    const latest = sorted[0]
    if (!latest) throw new Error(`No versions for package ${pkg.name}`)
    return latest
  }

  async installFromMarketplace(name: string, options?: { version?: string; licenseKey?: string }) {
    const pkg = await this.getPackage(name)
    if (!pkg) throw new Error(`Package not found: ${name}`)

    const licenseValid = await this.validateLicense(pkg.licenseTier, options?.licenseKey)
    if (!licenseValid) throw new Error('License validation failed')

    const selectedVersion = await this.resolveVersion(pkg, options?.version)

    const core = new CoreEngine({ cwd: this.rootDir })
    const registryPath = join(this.rootDir, '.randee', 'marketplace', 'registry.json')

    const registry: MarketplaceIndex = {
      updatedAt: new Date().toISOString(),
      packages: [
        {
          name: pkg.name,
          title: pkg.title,
          description: pkg.description,
          category: pkg.category,
          licenseTier: pkg.licenseTier,
          tags: pkg.tags,
          versions: [selectedVersion]
        }
      ]
    }

    await writeIndex({ ...this.paths, indexPath: registryPath }, registry)

    await core.syncRegistryFromFile('.randee/marketplace/registry.json')
    return core.install(name)
  }
}
