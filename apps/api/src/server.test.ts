import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createApiApp } from './server'
import type { Express } from 'express'

type InvokeRequest = {
  method: 'GET' | 'POST'
  path: string
  body?: unknown
  headers?: Record<string, string>
}

type InvokeResponse = {
  statusCode: number
  payload: unknown
  headers: Record<string, string>
}

async function invoke(app: Express, input: InvokeRequest): Promise<InvokeResponse> {
  return new Promise((resolve, reject) => {
    const req = {
      method: input.method,
      url: input.path,
      headers: {
        'content-type': 'application/json',
        ...(input.headers ?? {})
      },
      body: input.body,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' }
    }

    const responseHeaders: Record<string, string> = {}
    const res = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        responseHeaders[name.toLowerCase()] = value
      },
      getHeader(name: string) {
        return responseHeaders[name.toLowerCase()]
      },
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(payload: unknown) {
        resolve({
          statusCode: this.statusCode,
          payload,
          headers: responseHeaders
        })
        return this
      }
    }

    ;(app as Express & { handle: (req: unknown, res: unknown, next: (error?: unknown) => void) => void }).handle(
      req,
      res,
      (error?: unknown) => {
      if (error) reject(error)
      else resolve({ statusCode: res.statusCode, payload: undefined, headers: responseHeaders })
      }
    )
  })
}

describe('api marketplace endpoints', () => {
  it('publishes and lists package', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-api-'))
    const app = createApiApp(cwd)

    const publishResponse = await invoke(app, {
      method: 'POST',
      path: '/marketplace/publish',
      body: {
        name: 'hero-lite',
        title: 'Hero Lite',
        description: 'Lite hero section',
        category: 'section',
        licenseTier: 'free',
        tags: ['hero'],
        versions: [
          {
            version: '1.0.0',
            checksum: 'sha256-hero-lite-100',
            minCoreVersion: '0.1.0',
            downloadUrl: 'https://cdn.randee.local/hero-lite-1.0.0.tgz',
            releasedAt: '2026-05-23T00:00:00.000Z'
          }
        ]
      }
    })
    expect(publishResponse.statusCode).toBe(201)

    const listResponse = await invoke(app, {
      method: 'GET',
      path: '/marketplace/packages'
    })

    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.headers['x-request-id']).toBeTypeOf('string')
    expect(listResponse.payload).toEqual({
      packages: expect.arrayContaining([
        expect.objectContaining({
          name: 'hero-lite'
        })
      ])
    })
  })
})

describe('api cloud endpoints', () => {
  it('creates project and preview flow', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-api-cloud-'))
    const app = createApiApp(cwd)

    const createProject = await invoke(app, {
      method: 'POST',
      path: '/cloud/projects',
      body: {
        name: 'Cloud Project',
        slug: 'cloud-project',
        ownerEmail: 'owner@randee.dev'
      }
    })
    expect(createProject.statusCode).toBe(201)

    const projectId = (createProject.payload as { project: { id: string } }).project.id

    const preview = await invoke(app, {
      method: 'POST',
      path: `/cloud/projects/${projectId}/previews`,
      body: {
        commitSha: 'def5678',
        branch: 'main',
        actor: 'owner@randee.dev'
      }
    })
    expect(preview.statusCode).toBe(201)

    const sync = await invoke(app, {
      method: 'POST',
      path: `/cloud/projects/${projectId}/sync`,
      body: {
        source: 'cloud',
        filesCount: 12,
        actor: 'owner@randee.dev'
      }
    })
    expect(sync.statusCode).toBe(200)

    const audit = await invoke(app, {
      method: 'GET',
      path: `/cloud/projects/${projectId}/audit`
    })
    expect(audit.statusCode).toBe(200)
    expect(audit.payload).toEqual({
      events: expect.arrayContaining([
        expect.objectContaining({
          action: 'project.created'
        })
      ])
    })
  })

  it('requires api key for write operations when configured', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-api-auth-'))
    const app = createApiApp(cwd, { apiKey: 'secret-key' })

    const denied = await invoke(app, {
      method: 'POST',
      path: '/cloud/projects',
      body: {
        name: 'Denied Project',
        slug: 'denied-project',
        ownerEmail: 'owner@randee.dev'
      }
    })
    expect(denied.statusCode).toBe(401)

    const allowed = await invoke(app, {
      method: 'POST',
      path: '/cloud/projects',
      headers: {
        'x-randee-api-key': 'secret-key'
      },
      body: {
        name: 'Allowed Project',
        slug: 'allowed-project',
        ownerEmail: 'owner@randee.dev'
      }
    })
    expect(allowed.statusCode).toBe(201)
  })
})
