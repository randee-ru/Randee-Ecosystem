import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { createBlockSnapshotFromTemplate, exportBlockPackage } from '../export-block'

describe('exportBlockPackage', () => {
  it('exports hero block with manifest and bitrix files', async () => {
    const block = createBlockSnapshotFromTemplate('hero-01')
    expect(block).toBeTruthy()

    const exportRoot = join(tmpdir(), `randee-export-block-${Date.now()}`)
    const result = await exportBlockPackage(block!, exportRoot)

    expect(result.manifest.templateId).toBe('hero-01')
    expect(result.manifest.files.length).toBeGreaterThan(0)
    expect(result.manifest.bitrixComponent).toBe('randee:hero')
    expect(existsSync(join(exportRoot, 'block.json'))).toBe(true)
    expect(existsSync(join(exportRoot, 'randee-block-export-manifest.json'))).toBe(true)
    expect(existsSync(join(exportRoot, 'local', 'components', 'randee', 'hero'))).toBe(true)
    expect(existsSync(join(exportRoot, 'template-sources', 'hero-01', 'style.css'))).toBe(true)

    const manifest = JSON.parse(
      readFileSync(join(exportRoot, 'randee-block-export-manifest.json'), 'utf8')
    ) as { props: Record<string, string> }
    expect(manifest.props.title).toBeTruthy()

    rmSync(exportRoot, { recursive: true, force: true })
  })
})
