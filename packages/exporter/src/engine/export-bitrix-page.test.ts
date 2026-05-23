import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { exportPageToBitrix } from './export-bitrix-page'

describe('exportPageToBitrix', () => {
  it('exports supported blocks and writes manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-export-'))

    const manifest = await exportPageToBitrix(
      {
        page: 'Главная',
        slug: '/',
        blocks: [
          { id: 'hero_001', type: 'hero', props: { title: 'Title' } },
          { id: 'faq_001', type: 'faq', props: { title: 'FAQ' } }
        ]
      },
      root
    )

    expect(manifest.items).toHaveLength(2)

    const manifestRaw = await readFile(join(root, 'randee-export-manifest.json'), 'utf8')
    expect(manifestRaw).toContain('hero_001')
  })
})
