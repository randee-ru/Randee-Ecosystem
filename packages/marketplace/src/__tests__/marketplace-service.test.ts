import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MarketplaceService } from '../service/marketplace-service'

describe('MarketplaceService', () => {
  it('publishes and lists package', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-marketplace-'))
    const service = new MarketplaceService(root)

    await service.publishPackage({
      name: 'hero-pro',
      title: 'Hero Pro',
      description: 'Advanced hero section',
      category: 'section',
      licenseTier: 'pro',
      tags: ['hero', 'landing'],
      versions: [
        {
          version: '1.0.0',
          checksum: 'sha256-hero-pro-100',
          minCoreVersion: '0.1.0',
          downloadUrl: 'https://cdn.randee.local/hero-pro-1.0.0.tgz',
          releasedAt: '2026-05-23T00:00:00.000Z'
        }
      ]
    })

    const list = await service.listPackages()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('hero-pro')
  })

  it('validates pro license', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-marketplace-'))
    const service = new MarketplaceService(root)

    await service.upsertLicense({ key: 'PRO-1', tier: 'pro', active: true })

    await service.publishPackage({
      name: 'faq-pro',
      title: 'FAQ Pro',
      description: 'Advanced FAQ',
      category: 'component',
      licenseTier: 'pro',
      tags: ['faq'],
      versions: [
        {
          version: '1.0.0',
          checksum: 'sha256-faq-pro-100',
          minCoreVersion: '0.1.0',
          downloadUrl: 'https://cdn.randee.local/faq-pro-1.0.0.tgz',
          releasedAt: '2026-05-23T00:00:00.000Z'
        }
      ]
    })

    const install = await service.installFromMarketplace('faq-pro', { licenseKey: 'PRO-1' })
    expect(install.changed).toBe(true)
  })
})
