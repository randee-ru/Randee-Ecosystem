import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createApiApp } from './server'
import type { Express } from 'express'

type MockRequest = {
  body?: unknown
  params?: Record<string, string>
  query?: Record<string, string | undefined>
}

type MockResponse = {
  statusCode: number
  payload: unknown
  status: (code: number) => MockResponse
  json: (payload: unknown) => MockResponse
}

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    payload: undefined,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.payload = payload
      return this
    }
  }
}

async function invokeRoute(app: Express, method: 'get' | 'post', path: string, req: MockRequest) {
  const stack =
    (app as Express & { _router?: { stack?: Array<{ route?: unknown }> } })._router?.stack ?? []
  const layer = stack.find((entry: { route?: unknown }) => {
    const route = entry.route as { path?: string; methods?: Record<string, boolean> } | undefined
    return route?.path === path && route.methods?.[method]
  })

  if (!layer) throw new Error(`Route not found: ${method.toUpperCase()} ${path}`)

  const route = layer.route as { stack: Array<{ handle: (req: MockRequest, res: MockResponse) => unknown }> }
  const res = createMockResponse()

  for (const routeLayer of route.stack) {
    await routeLayer.handle(req, res)
  }

  return res
}

describe('api marketplace endpoints', () => {
  it('publishes and lists package', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-api-'))
    const app = createApiApp(cwd)

    const publishResponse = await invokeRoute(app, 'post', '/marketplace/publish', {
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

    const listResponse = await invokeRoute(app, 'get', '/marketplace/packages', {})
    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.payload).toEqual({
      packages: expect.arrayContaining([
        expect.objectContaining({
          name: 'hero-lite'
        })
      ])
    })
  })
})
