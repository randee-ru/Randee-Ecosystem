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
          { id: 'faq_001', type: 'faq', props: { title: 'FAQ' } },
          {
            id: 'hl_001',
            type: 'highload.list',
            props: { title: 'HL', hlblockTable: 'b_randee_reviews' }
          }
        ]
      },
      root
    )

    expect(manifest.items).toHaveLength(3)

    const manifestRaw = await readFile(join(root, 'randee-export-manifest.json'), 'utf8')
    expect(manifestRaw).toContain('hero_001')
  })

  it('fails on invalid bindings', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-export-invalid-'))

    await expect(
      exportPageToBitrix(
        {
          page: 'Главная',
          slug: '/',
          blocks: [
            {
              id: 'catalog_bad',
              type: 'catalog.section',
              props: { title: 'Catalog', iblockId: 'abc', sectionId: '3' }
            }
          ]
        },
        root
      )
    ).rejects.toThrow(/numeric/)
  })
})
