import express from 'express'
import { resolve } from 'node:path'
import { MarketplaceService } from '@randee/marketplace'
import { CloudService } from '@randee/cloud'

export function createApiApp(rootDir = process.cwd()) {
  const app = express()
  const marketplace = new MarketplaceService(rootDir)
  const cloud = new CloudService(rootDir)

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

  app.post('/cloud/projects', async (req, res) => {
    try {
      const project = await cloud.createProject(req.body)
      return res.status(201).json({ project })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Project error' })
    }
  })

  app.get('/cloud/projects', async (_, res) => {
    const projects = await cloud.listProjects()
    res.json({ projects })
  })

  app.post('/cloud/projects/:projectId/members', async (req, res) => {
    try {
      const member = await cloud.addMember({
        projectId: req.params.projectId,
        email: req.body.email,
        role: req.body.role,
        actor: req.body.actor
      })
      return res.status(201).json({ member })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Member error' })
    }
  })

  app.post('/cloud/projects/:projectId/previews', async (req, res) => {
    try {
      const preview = await cloud.createPreview({
        projectId: req.params.projectId,
        commitSha: req.body.commitSha,
        branch: req.body.branch,
        actor: req.body.actor
      })
      return res.status(201).json({ preview })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Preview error' })
    }
  })

  app.get('/cloud/projects/:projectId/previews', async (req, res) => {
    const previews = await cloud.listPreviews(req.params.projectId)
    res.json({ previews })
  })

  app.post('/cloud/projects/:projectId/sync', async (req, res) => {
    try {
      const state = await cloud.syncProject({
        projectId: req.params.projectId,
        source: req.body.source,
        filesCount: req.body.filesCount,
        actor: req.body.actor
      })
      return res.status(200).json({ state })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Sync error' })
    }
  })

  app.get('/cloud/projects/:projectId/sync', async (req, res) => {
    const state = await cloud.getSyncState(req.params.projectId)
    if (!state) return res.status(404).json({ error: 'Sync state not found' })
    return res.json({ state })
  })

  app.get('/cloud/projects/:projectId/audit', async (req, res) => {
    const events = await cloud.listAudit(req.params.projectId)
    res.json({ events })
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
