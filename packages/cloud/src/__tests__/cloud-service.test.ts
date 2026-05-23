import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CloudService } from '../service/cloud-service'

describe('cloud service', () => {
  it('creates project, preview, sync state and audit trail', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-cloud-'))
    const cloud = new CloudService(cwd)

    const project = await cloud.createProject({
      name: 'Randee Site',
      slug: 'randee-site',
      ownerEmail: 'owner@randee.dev'
    })

    await cloud.addMember({
      projectId: project.id,
      email: 'dev@randee.dev',
      role: 'developer',
      actor: 'owner@randee.dev'
    })

    const preview = await cloud.createPreview({
      projectId: project.id,
      commitSha: 'abc1234',
      branch: 'feature/header',
      actor: 'dev@randee.dev'
    })

    expect(preview.url).toContain('preview.randee.cloud')

    const syncState = await cloud.syncProject({
      projectId: project.id,
      source: 'local',
      filesCount: 48,
      actor: 'dev@randee.dev'
    })

    expect(syncState.filesCount).toBe(48)

    const projects = await cloud.listProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0].members).toHaveLength(2)

    const audit = await cloud.listAudit(project.id)
    expect(audit.length).toBeGreaterThanOrEqual(4)
  })
})
