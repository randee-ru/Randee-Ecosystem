import express, { type NextFunction, type Request, type Response } from 'express'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { MarketplaceService } from '@randee/marketplace'
import type { LicenseTier } from '@randee/marketplace'
import { CloudService } from '@randee/cloud'
import type { RandeeSyncState, RandeeTeamMember } from '@randee/cloud'

type ApiAppOptions = {
  apiKey?: string
  rateLimitWindowMs?: number
  rateLimitMaxRequests?: number
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Field "${field}" is required`)
  }

  return value.trim()
}

function asPositiveNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    throw new Error(`Field "${field}" must be a positive number`)
  }

  return value
}

function readRateLimitKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  return `${ip}:${req.method}`
}

function asRole(value: unknown): RandeeTeamMember['role'] {
  const role = asNonEmptyString(value, 'role')
  if (role === 'owner' || role === 'admin' || role === 'developer' || role === 'viewer') {
    return role
  }

  throw new Error('Field "role" must be one of: owner, admin, developer, viewer')
}

function asSyncSource(value: unknown): RandeeSyncState['source'] {
  const source = asNonEmptyString(value, 'source')
  if (source === 'local' || source === 'cloud') {
    return source
  }

  throw new Error('Field "source" must be one of: local, cloud')
}

function asLicenseTier(value: unknown): LicenseTier {
  const tier = asNonEmptyString(value, 'tier')
  if (tier === 'free' || tier === 'pro' || tier === 'enterprise') {
    return tier
  }

  throw new Error('Field "tier" must be one of: free, pro, enterprise')
}

export function createApiApp(rootDir = process.cwd(), options: ApiAppOptions = {}) {
  const app = express()
  const marketplace = new MarketplaceService(rootDir)
  const cloud = new CloudService(rootDir)
  const apiKey = options.apiKey ?? process.env.RANDEE_API_KEY
  const rateLimitWindowMs = options.rateLimitWindowMs ?? Number(process.env.RANDEE_RATE_LIMIT_WINDOW_MS ?? 60_000)
  const rateLimitMaxRequests = options.rateLimitMaxRequests ?? Number(process.env.RANDEE_RATE_LIMIT_MAX ?? 120)
  const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

  app.use(express.json())
  app.use((req, res, next) => {
    const requestId = randomUUID()
    res.setHeader('x-request-id', requestId)
    next()
  })

  app.use((req: Request, res: Response, next: NextFunction) => {
    const key = readRateLimitKey(req)
    const now = Date.now()
    const current = rateLimitStore.get(key)

    if (!current || now >= current.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitWindowMs })
      return next()
    }

    if (current.count >= rateLimitMaxRequests) {
      return res.status(429).json({ error: 'Rate limit exceeded' })
    }

    current.count += 1
    return next()
  })

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!apiKey || !WRITE_METHODS.has(req.method)) return next()

    const received = req.header('x-randee-api-key')
    if (received !== apiKey) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    return next()
  })

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
    const tier = asLicenseTier(req.body.tier)
    const key = asNonEmptyString(req.body.key, 'key')
    const valid = await marketplace.validateLicense(tier, key)
    res.json({ valid })
  })

  app.post('/marketplace/install', async (req, res) => {
    try {
      const name = asNonEmptyString(req.body.name, 'name')
      const result = await marketplace.installFromMarketplace(name, {
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
      const project = await cloud.createProject({
        name: asNonEmptyString(req.body.name, 'name'),
        slug: asNonEmptyString(req.body.slug, 'slug'),
        ownerEmail: asNonEmptyString(req.body.ownerEmail, 'ownerEmail')
      })
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
        email: asNonEmptyString(req.body.email, 'email'),
        role: asRole(req.body.role),
        actor: asNonEmptyString(req.body.actor, 'actor')
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
        commitSha: asNonEmptyString(req.body.commitSha, 'commitSha'),
        branch: asNonEmptyString(req.body.branch, 'branch'),
        actor: asNonEmptyString(req.body.actor, 'actor')
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
        source: asSyncSource(req.body.source),
        filesCount: asPositiveNumber(req.body.filesCount, 'filesCount'),
        actor: asNonEmptyString(req.body.actor, 'actor')
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
