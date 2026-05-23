#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { CoreEngine } from '@randee/core'
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
