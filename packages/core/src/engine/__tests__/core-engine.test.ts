import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CoreEngine } from '../core-engine'

describe('CoreEngine', () => {
  it('syncs registry and installs package', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-core-'))
    const registryPath = join(cwd, 'registry.json')

    await writeFile(
      registryPath,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          packages: [{ name: 'hero', version: '1.0.0', checksum: 'x' }]
        },
        null,
        2
      )
    )

    const engine = new CoreEngine({ cwd })
    await engine.syncRegistryFromFile('registry.json')
    const result = await engine.install('hero')

    expect(result.changed).toBe(true)
    const lockRaw = await readFile(join(cwd, '.randee', 'lock.json'), 'utf8')
    expect(lockRaw).toContain('hero')
  })

  it('updates installed package when registry changes', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'randee-core-'))
    const registryPath = join(cwd, 'registry.json')
    const engine = new CoreEngine({ cwd })

    await writeFile(
      registryPath,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          packages: [{ name: 'hero', version: '1.0.0', checksum: 'x' }]
        },
        null,
        2
      )
    )
    await engine.syncRegistryFromFile('registry.json')
    await engine.install('hero')

    await writeFile(
      registryPath,
      JSON.stringify(
        {
          updatedAt: new Date().toISOString(),
          packages: [{ name: 'hero', version: '1.1.0', checksum: 'y' }]
        },
        null,
        2
      )
    )

    await engine.syncRegistryFromFile('registry.json')
    const update = await engine.update('hero')
    expect(update.changed).toBe(true)

    const lockRaw = await readFile(join(cwd, '.randee', 'lock.json'), 'utf8')
    expect(lockRaw).toContain('1.1.0')
  })
})
