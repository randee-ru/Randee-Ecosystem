export type LicenseTier = 'free' | 'pro' | 'enterprise'

export interface MarketplacePackageVersion {
  version: string
  checksum: string
  minCoreVersion: string
  downloadUrl: string
  releasedAt: string
}

export interface MarketplacePackage {
  name: string
  title: string
  description: string
  category: 'component' | 'section' | 'template' | 'integration'
  licenseTier: LicenseTier
  tags: string[]
  versions: MarketplacePackageVersion[]
}

export interface MarketplaceIndex {
  updatedAt: string
  packages: MarketplacePackage[]
}

export interface LicenseRecord {
  key: string
  tier: LicenseTier
  active: boolean
  owner?: string
}

export interface LicenseStore {
  updatedAt: string
  licenses: LicenseRecord[]
}
