export type RandeeCloudEnvironment = 'production' | 'staging' | 'preview'

export type RandeePreviewDeploy = {
  id: string
  projectId: string
  commitSha: string
  branch: string
  environment: RandeeCloudEnvironment
  url: string
  status: 'queued' | 'running' | 'ready' | 'failed'
  createdAt: string
}

export type RandeeTeamMember = {
  id: string
  email: string
  role: 'owner' | 'admin' | 'developer' | 'viewer'
  addedAt: string
  active: boolean
}

export type RandeeProject = {
  id: string
  name: string
  slug: string
  createdAt: string
  members: RandeeTeamMember[]
}

export type RandeeSyncState = {
  projectId: string
  lastSyncedAt: string
  source: 'local' | 'cloud'
  filesCount: number
}

export type RandeeAuditEvent = {
  id: string
  projectId: string
  actor: string
  action: string
  target: string
  createdAt: string
  metadata?: Record<string, string>
}
