import express from 'express'
import { resolve } from 'node:path'
import { MarketplaceService } from '@randee/marketplace'

export function createApiApp(rootDir = process.cwd()) {
  const app = express()
  const marketplace = new MarketplaceService(rootDir)

  app.use(express.json())

  app.get('/health', (_, res) => {
    res.json({ status: 'ok' })
  })

  app.get('/marketplace/packages', async (_, res) => {
    const packages = await marketplace.listPackages()
    res.json({ packages })
  })

  app.get('/marketplace/packages/:name', async (req, res) => {
    const pkg = await marketplace.getPackage(req.params.name)
    if (!pkg) return res.status(404).json({ error: 'Package not found' })
    return res.json(pkg)
  })

  app.post('/marketplace/publish', async (req, res) => {
    try {
      await marketplace.publishPackage(req.body)
      return res.status(201).json({ ok: true })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Publish error' })
    }
  })

  app.post('/marketplace/licenses', async (req, res) => {
    try {
      await marketplace.upsertLicense(req.body)
      return res.status(201).json({ ok: true })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'License error' })
    }
  })

  app.post('/marketplace/license/check', async (req, res) => {
    const valid = await marketplace.validateLicense(req.body.tier, req.body.key)
    res.json({ valid })
  })

  app.post('/marketplace/install', async (req, res) => {
    try {
      const result = await marketplace.installFromMarketplace(req.body.name, {
        version: req.body.version,
        licenseKey: req.body.licenseKey
      })
      return res.json(result)
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Install error' })
    }
  })

  app.get('/marketplace/download/:name', async (req, res) => {
    const pkg = await marketplace.getPackage(req.params.name)
    if (!pkg) return res.status(404).json({ error: 'Package not found' })

    try {
      const version = await marketplace.resolveVersion(pkg, req.query.version as string | undefined)
      return res.json({
        name: pkg.name,
        version: version.version,
        checksum: version.checksum,
        downloadUrl: version.downloadUrl
      })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Resolve error' })
    }
  })

  return app
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 4010)
  const app = createApiApp(resolve(process.cwd()))
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Randee API listening on http://localhost:${port}`)
  })
}
