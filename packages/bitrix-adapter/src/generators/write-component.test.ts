import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeBitrixComponent } from './write-component'

describe('writeBitrixComponent', () => {
  it('creates full bitrix component structure', async () => {
    const root = await mkdtemp(join(tmpdir(), 'randee-bitrix-'))

    const dir = await writeBitrixComponent(
      {
        namespace: 'randee',
        name: 'hero',
        title: 'Hero',
        params: { TITLE: 'Заголовок' },
        templateData: { TITLE: 'Default title' }
      },
      { rootDir: root }
    )

    const template = await readFile(join(dir, 'templates', '.default', 'template.php'), 'utf8')
    expect(template).toContain('randee-hero')
  })
})
