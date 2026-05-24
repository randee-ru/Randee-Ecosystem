import { DEFAULT_COMPONENT_DESIGN } from '@randee/builder'
import { describe, expect, it } from 'vitest'
import { exportPageToHtmlWithAssets } from '../server'
import { mapPageBlockToBitrix } from '../bitrix-export'

describe('component design export', () => {
  const design = {
    ...DEFAULT_COMPONENT_DESIGN,
    fill: 'EEEEEE',
    layout: {
      ...DEFAULT_COMPONENT_DESIGN.layout,
      gap: 20,
      padding: 40
    },
    typography: { baseSize: 20 }
  }

  it('includes inline design styles in HTML export', () => {
    const html = exportPageToHtmlWithAssets({
      page: 'Test',
      slug: '/test',
      seo: { title: 'Test', description: 'Test' },
      blocks: [
        {
          id: 'hero_0001',
          type: 'hero',
          template: 'hero-01',
          props: {
            title: 'Title',
            description: 'Description',
            buttonText: 'Go'
          },
          design
        }
      ]
    })

    expect(html).toContain('background:#EEEEEE')
    expect(html).toContain('gap:20px')
    expect(html).toContain('padding:40px')
    expect(html).toContain('font-size:20px')
  })

  it('includes inline design styles in Bitrix template.php', () => {
    const descriptor = mapPageBlockToBitrix({
      id: 'hero_0001',
      type: 'hero',
      template: 'hero-01',
      props: {
        title: 'Title',
        description: 'Description',
        buttonText: 'Go'
      },
      design
    })

    expect(descriptor?.templatePhp).toContain('background:#EEEEEE')
    expect(descriptor?.templatePhp).toContain('gap:20px')
  })
})
