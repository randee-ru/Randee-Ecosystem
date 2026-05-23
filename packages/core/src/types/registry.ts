export interface RegistryPackage {
  name: string
  version: string
  checksum: string
  dependencies?: Record<string, string>
  description?: string
}

export interface RegistryDocument {
  updatedAt: string
  packages: RegistryPackage[]
}

export interface LockPackage {
  name: string
  version: string
  checksum: string
  dependencies: Record<string, string>
}

export interface LockfileDocument {
  generatedAt: string
  packages: LockPackage[]
}

export interface CoreState {
  registry: RegistryDocument
  lockfile: LockfileDocument
}
