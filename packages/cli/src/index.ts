#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CoreEngine } from '@randee/core'
import { CloudService } from '@randee/cloud'
import { MarketplaceService, type MarketplacePackage } from '@randee/marketplace'
import { writeBitrixComponent } from '@randee/bitrix-adapter'
import { exportPageToBitrix, type RandeePageSchema } from '@randee/exporter'

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue

    const key = token.slice(2)
    const value = argv[i + 1]

    if (!value || value.startsWith('--')) {
      args[key] = true
      continue
    }

    args[key] = value
    i += 1
  }

  return args
}

function printHelp() {
  process.stdout.write(`
Randee CLI

Core commands:
  randee sync --registry ./path/to/registry.json
  randee list
  randee install <package>
  randee update [package]
  randee rollback --snapshot <id>

Marketplace commands:
  randee marketplace:publish --file ./samples/marketplace/hero-pro.json
  randee marketplace:list
  randee marketplace:license --key PRO-KEY --tier pro
  randee marketplace:install --name hero-pro --license PRO-KEY

Cloud commands:
  randee cloud:project:create --name "Site" --slug site --owner owner@randee.dev
  randee cloud:project:list
  randee cloud:member:add --project <id> --email dev@randee.dev --role developer --actor owner@randee.dev
  randee cloud:preview --project <id> --branch main --sha abc123 --actor dev@randee.dev
  randee cloud:sync --project <id> --source local --files 42 --actor dev@randee.dev
  randee cloud:audit --project <id>

Bitrix commands:
  randee bitrix:component --name hero --title "Hero" --out ./dist
  randee export --input ./samples/pages/home.json --out ./dist/bitrix-site
`)
}

async function run(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === 'help') {
    printHelp()
    return
  }

  const args = parseArgs(rest)
  const engine = new CoreEngine({ cwd: process.cwd() })
  const marketplace = new MarketplaceService(process.cwd())
  const cloud = new CloudService(process.cwd())

  if (command === 'sync') {
    const registry = String(args.registry ?? '')
    if (!registry) throw new Error('sync requires --registry <path>')
    const result = await engine.syncRegistryFromFile(registry)
    process.stdout.write(`${result.message}\n`)
    return
  }

  if (command === 'list') {
    const installed = await engine.listInstalled()
    if (installed.length === 0) {
      process.stdout.write('No packages installed\n')
      return
    }

    for (const pkg of installed) {
      process.stdout.write(`${pkg.name}@${pkg.version} (${pkg.checksum})\n`)
    }
    return
  }

  if (command === 'install') {
    const name = rest[0]
    if (!name) throw new Error('install requires package name: randee install <package>')
    const result = await engine.install(name)
    process.stdout.write(`${result.message}\n`)
    if (result.snapshotId) process.stdout.write(`Snapshot: ${result.snapshotId}\n`)
    return
  }

  if (command === 'update') {
    const name = rest[0] && !rest[0].startsWith('--') ? rest[0] : undefined
    const result = await engine.update(name)
    process.stdout.write(`${result.message}\n`)
    if (result.snapshotId) process.stdout.write(`Snapshot: ${result.snapshotId}\n`)
    return
  }

  if (command === 'rollback') {
    const snapshot = String(args.snapshot ?? '')
    if (!snapshot) throw new Error('rollback requires --snapshot <id>')
    const result = await engine.rollback(snapshot)
    process.stdout.write(`${result.message}\n`)
    return
  }

  if (command === 'marketplace:publish') {
    const file = String(args.file ?? '')
    if (!file) throw new Error('marketplace:publish requires --file <path>')

    const raw = await readFile(resolve(file), 'utf8')
    const pkg = JSON.parse(raw) as MarketplacePackage
    await marketplace.publishPackage(pkg)
    process.stdout.write(`Published ${pkg.name}\n`)
    return
  }

  if (command === 'marketplace:list') {
    const packages = await marketplace.listPackages()
    if (packages.length === 0) {
      process.stdout.write('Marketplace is empty\n')
      return
    }

    for (const pkg of packages) {
      process.stdout.write(`${pkg.name} [${pkg.licenseTier}] versions=${pkg.versions.length}\n`)
    }
    return
  }

  if (command === 'marketplace:license') {
    const key = String(args.key ?? '')
    const tier = String(args.tier ?? '')
    if (!key || !tier) throw new Error('marketplace:license requires --key and --tier')

    if (tier !== 'free' && tier !== 'pro' && tier !== 'enterprise') {
      throw new Error('tier must be one of: free, pro, enterprise')
    }

    await marketplace.upsertLicense({ key, tier, active: true })
    process.stdout.write(`License upserted: ${key}\n`)
    return
  }

  if (command === 'marketplace:install') {
    const name = String(args.name ?? '')
    if (!name) throw new Error('marketplace:install requires --name')

    const result = await marketplace.installFromMarketplace(name, {
      version: typeof args.version === 'string' ? args.version : undefined,
      licenseKey: typeof args.license === 'string' ? args.license : undefined
    })

    process.stdout.write(`${result.message}\n`)
    if (result.snapshotId) process.stdout.write(`Snapshot: ${result.snapshotId}\n`)
    return
  }

  if (command === 'cloud:project:create') {
    const name = String(args.name ?? '')
    const slug = String(args.slug ?? '')
    const owner = String(args.owner ?? '')
    if (!name || !slug || !owner) {
      throw new Error('cloud:project:create requires --name --slug --owner')
    }

    const project = await cloud.createProject({ name, slug, ownerEmail: owner })
    process.stdout.write(`Created project ${project.slug} (${project.id})\n`)
    return
  }

  if (command === 'cloud:project:list') {
    const projects = await cloud.listProjects()
    if (projects.length === 0) {
      process.stdout.write('No cloud projects\n')
      return
    }

    for (const project of projects) {
      process.stdout.write(`${project.id} ${project.slug} members=${project.members.length}\n`)
    }
    return
  }

  if (command === 'cloud:member:add') {
    const projectId = String(args.project ?? '')
    const email = String(args.email ?? '')
    const role = String(args.role ?? '')
    const actor = String(args.actor ?? '')
    if (!projectId || !email || !role || !actor) {
      throw new Error('cloud:member:add requires --project --email --role --actor')
    }

    if (role !== 'owner' && role !== 'admin' && role !== 'developer' && role !== 'viewer') {
      throw new Error('role must be one of: owner, admin, developer, viewer')
    }

    const member = await cloud.addMember({
      projectId,
      email,
      role,
      actor
    })
    process.stdout.write(`Member added: ${member.email} (${member.role})\n`)
    return
  }

  if (command === 'cloud:preview') {
    const projectId = String(args.project ?? '')
    const branch = String(args.branch ?? '')
    const commitSha = String(args.sha ?? '')
    const actor = String(args.actor ?? '')
    if (!projectId || !branch || !commitSha || !actor) {
      throw new Error('cloud:preview requires --project --branch --sha --actor')
    }

    const preview = await cloud.createPreview({
      projectId,
      branch,
      commitSha,
      actor
    })
    process.stdout.write(`Preview ready: ${preview.url}\n`)
    return
  }

  if (command === 'cloud:sync') {
    const projectId = String(args.project ?? '')
    const source = String(args.source ?? '')
    const files = Number(args.files ?? 0)
    const actor = String(args.actor ?? '')
    if (!projectId || !source || !files || !actor) {
      throw new Error('cloud:sync requires --project --source --files --actor')
    }

    if (source !== 'local' && source !== 'cloud') {
      throw new Error('source must be one of: local, cloud')
    }

    const state = await cloud.syncProject({
      projectId,
      source,
      filesCount: files,
      actor
    })
    process.stdout.write(`Synced at ${state.lastSyncedAt} from ${state.source}\n`)
    return
  }

  if (command === 'cloud:audit') {
    const projectId = String(args.project ?? '')
    if (!projectId) throw new Error('cloud:audit requires --project')

    const events = await cloud.listAudit(projectId)
    if (events.length === 0) {
      process.stdout.write('No audit events\n')
      return
    }

    for (const event of events) {
      process.stdout.write(`${event.createdAt} ${event.actor} ${event.action} ${event.target}\n`)
    }
    return
  }

  if (command === 'bitrix:component') {
    const name = String(args.name ?? '')
    const title = String(args.title ?? '')
    const out = String(args.out ?? '')

    if (!name || !title || !out) {
      throw new Error('bitrix:component requires --name, --title, --out')
    }

    const dir = await writeBitrixComponent(
      {
        namespace: 'randee',
        name,
        title,
        description: String(args.description ?? ''),
        params: { TITLE: 'Title' },
        templateData: { TITLE: title }
      },
      { rootDir: resolve(out) }
    )

    process.stdout.write(`Generated Bitrix component: ${dir}\n`)
    return
  }

  if (command === 'export') {
    const input = String(args.input ?? '')
    const out = String(args.out ?? '')

    if (!input || !out) {
      throw new Error('export requires --input and --out')
    }

    const raw = await readFile(resolve(input), 'utf8')
    const page = JSON.parse(raw) as RandeePageSchema
    const manifest = await exportPageToBitrix(page, resolve(out))

    process.stdout.write(
      `Export finished. Generated ${manifest.items.length} components at ${resolve(out)}\n`
    )
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
