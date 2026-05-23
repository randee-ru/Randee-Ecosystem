import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const webPages = [
  'apps/web/app/page.tsx',
  'apps/web/app/builder/page.tsx',
  'apps/web/app/marketplace/page.tsx'
]

test('web pages use explicit Randee page scopes', async () => {
  for (const file of webPages) {
    const source = await readFile(file, 'utf8')
    expect(source).toContain('data-randee-page=')
  }
})

test('web UI does not expose placeholder copy', async () => {
  const forbidden = ['TODO', 'smoke placeholder']

  for (const file of webPages) {
    const source = await readFile(file, 'utf8')
    for (const word of forbidden) {
      expect(source.toLowerCase()).not.toContain(word.toLowerCase())
    }
  }
})
