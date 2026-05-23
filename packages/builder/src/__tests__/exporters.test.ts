import { describe, expect, it } from 'vitest'
import { exportPageToHtml, exportPageToJson } from '../export/exporters'

describe('builder exporters', () => {
  const page = {
    page: 'Main',
    slug: '/',
    blocks: [{ id: 'hero_1', type: 'hero' as const, template: 'hero-01', props: { title: 'Hero' } }]
  }

  it('exports json', () => {
    const json = exportPageToJson(page)
    expect(json).toContain('hero_1')
  })

  it('exports html', () => {
    const html = exportPageToHtml(page)
    expect(html).toContain('<section')
    expect(html).toContain('randee-hero')
  })
})
