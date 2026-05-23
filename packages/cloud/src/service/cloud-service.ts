import { randomUUID } from 'node:crypto'
import {
  readJsonFile,
  resolveCloudPath,
  writeJsonFile
} from '../storage/files'
import type {
  RandeeAuditEvent,
  RandeePreviewDeploy,
  RandeeProject,
  RandeeSyncState,
  RandeeTeamMember
} from '../types/cloud'

type CloudStore = {
  projects: RandeeProject[]
  previews: RandeePreviewDeploy[]
  syncStates: RandeeSyncState[]
  audit: RandeeAuditEvent[]
}

const EMPTY_STORE: CloudStore = {
  projects: [],
  previews: [],
  syncStates: [],
  audit: []
}

export class CloudService {
  private readonly storePath: string

  constructor(private readonly cwd: string) {
    this.storePath = resolveCloudPath(cwd, 'state.json')
  }

  private async loadStore(): Promise<CloudStore> {
    return readJsonFile(this.storePath, EMPTY_STORE)
  }

  private async saveStore(store: CloudStore): Promise<void> {
    await writeJsonFile(this.storePath, store)
  }

  async createProject(input: { name: string; slug: string; ownerEmail: string }): Promise<RandeeProject> {
    if (!input.name.trim()) throw new Error('Project name is required')
    if (!input.slug.trim()) throw new Error('Project slug is required')
    if (!input.ownerEmail.trim()) throw new Error('Owner email is required')

    const store = await this.loadStore()
    const exists = store.projects.some((project) => project.slug === input.slug)
    if (exists) throw new Error(`Project with slug ${input.slug} already exists`)

    const owner: RandeeTeamMember = {
      id: randomUUID(),
      email: input.ownerEmail,
      role: 'owner',
      addedAt: new Date().toISOString(),
      active: true
    }

    const project: RandeeProject = {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      createdAt: new Date().toISOString(),
      members: [owner]
    }

    store.projects.push(project)
    store.audit.push({
      id: randomUUID(),
      projectId: project.id,
      actor: owner.email,
      action: 'project.created',
      target: project.slug,
      createdAt: new Date().toISOString()
    })

    await this.saveStore(store)
    return project
  }

  async listProjects(): Promise<RandeeProject[]> {
    const store = await this.loadStore()
    return store.projects
  }

  async addMember(input: {
    projectId: string
    email: string
    role: RandeeTeamMember['role']
    actor: string
  }): Promise<RandeeTeamMember> {
    const store = await this.loadStore()
    const project = store.projects.find((entry) => entry.id === input.projectId)
    if (!project) throw new Error('Project not found')

    const exists = project.members.some((member) => member.email === input.email)
    if (exists) throw new Error(`Member ${input.email} already exists`)

    const member: RandeeTeamMember = {
      id: randomUUID(),
      email: input.email,
      role: input.role,
      addedAt: new Date().toISOString(),
      active: true
    }

    project.members.push(member)
    store.audit.push({
      id: randomUUID(),
      projectId: project.id,
      actor: input.actor,
      action: 'team.member.added',
      target: input.email,
      createdAt: new Date().toISOString(),
      metadata: { role: input.role }
    })

    await this.saveStore(store)
    return member
  }

  async createPreview(input: {
    projectId: string
    commitSha: string
    branch: string
    actor: string
  }): Promise<RandeePreviewDeploy> {
    const store = await this.loadStore()
    const project = store.projects.find((entry) => entry.id === input.projectId)
    if (!project) throw new Error('Project not found')

    const preview: RandeePreviewDeploy = {
      id: randomUUID(),
      projectId: input.projectId,
      commitSha: input.commitSha,
      branch: input.branch,
      environment: 'preview',
      url: `https://${project.slug}--${input.branch}.preview.randee.cloud`,
      status: 'ready',
      createdAt: new Date().toISOString()
    }

    store.previews.push(preview)
    store.audit.push({
      id: randomUUID(),
      projectId: project.id,
      actor: input.actor,
      action: 'preview.deployed',
      target: preview.url,
      createdAt: new Date().toISOString(),
      metadata: { branch: input.branch, commitSha: input.commitSha }
    })

    await this.saveStore(store)
    return preview
  }

  async listPreviews(projectId: string): Promise<RandeePreviewDeploy[]> {
    const store = await this.loadStore()
    return store.previews.filter((preview) => preview.projectId === projectId)
  }

  async syncProject(input: {
    projectId: string
    source: RandeeSyncState['source']
    filesCount: number
    actor: string
  }): Promise<RandeeSyncState> {
    const store = await this.loadStore()
    const project = store.projects.find((entry) => entry.id === input.projectId)
    if (!project) throw new Error('Project not found')

    const state: RandeeSyncState = {
      projectId: input.projectId,
      source: input.source,
      filesCount: input.filesCount,
      lastSyncedAt: new Date().toISOString()
    }

    const index = store.syncStates.findIndex((entry) => entry.projectId === input.projectId)
    if (index >= 0) {
      store.syncStates[index] = state
    } else {
      store.syncStates.push(state)
    }

    store.audit.push({
      id: randomUUID(),
      projectId: project.id,
      actor: input.actor,
      action: 'project.synced',
      target: project.slug,
      createdAt: new Date().toISOString(),
      metadata: { source: input.source, filesCount: String(input.filesCount) }
    })

    await this.saveStore(store)
    return state
  }

  async getSyncState(projectId: string): Promise<RandeeSyncState | null> {
    const store = await this.loadStore()
    return store.syncStates.find((state) => state.projectId === projectId) ?? null
  }

  async listAudit(projectId: string): Promise<RandeeAuditEvent[]> {
    const store = await this.loadStore()
    return store.audit.filter((event) => event.projectId === projectId)
  }
}
