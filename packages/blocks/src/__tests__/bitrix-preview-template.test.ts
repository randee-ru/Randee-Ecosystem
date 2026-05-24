import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildBitrixTemplateFromPreview, parsePreviewPropBindings, propKeyToPhpVar } from '../bitrix-preview-template'
import { mapPageBlockToBitrix } from '../bitrix-export'
import { createBlockSnapshotFromTemplate } from '../export-block'

describe('bitrix preview template', () => {
  it('maps prop keys to php vars', () => {
    expect(propKeyToPhpVar('title')).toBe('TITLE')
    expect(propKeyToPhpVar('buttonText')).toBe('BUTTON_TEXT')
  })

  it('parses preview prop bindings', () => {
    const preview = readFileSync(
      join(process.cwd(), 'src/templates/hero/hero-01/preview.tsx'),
      'utf8'
    )
    const bindings = parsePreviewPropBindings(preview)
    expect(bindings.map((item) => item.propKey)).toEqual(['title', 'description', 'buttonText'])
  })

  it('builds hero template.php from preview.tsx', () => {
    const preview = readFileSync(
      join(process.cwd(), 'src/templates/hero/hero-01/preview.tsx'),
      'utf8'
    )
    const result = buildBitrixTemplateFromPreview(preview, {
      templateId: 'hero-01',
      blockType: 'hero',
      blockProps: {
        title: 'Hero title',
        description: 'Hero description',
        buttonText: 'Go'
      }
    })

    expect(result.templatePhp).toContain('randee-hero-01__title')
    expect(result.templatePhp).toContain('<?= $TITLE ?>')
    expect(result.templatePhp).toContain('<?= $DESCRIPTION ?>')
    expect(result.templatePhp).toContain('<?= $BUTTON_TEXT ?>')
    expect(result.templatePhp).toContain('$templateFolder')
    expect(result.templatePhp).toContain('images/accent.svg')
    expect(result.params.TITLE).toBeTruthy()
  })
})

describe('mapPageBlockToBitrix', () => {
  it('includes css, js, images and preview-based template for hero', () => {
    const block = createBlockSnapshotFromTemplate('hero-01')
    expect(block).toBeTruthy()

    const descriptor = mapPageBlockToBitrix(block!)
    expect(descriptor).toBeTruthy()
    expect(descriptor?.name).toBe('hero')
    expect(descriptor?.templatePhp).toContain('randee-hero-01__button')
    expect(descriptor?.css).toContain('.randee-hero-01')
    expect(descriptor?.js).toContain('data-randee-template="hero-01"')
    expect(descriptor?.staticAssets?.some((asset) => asset.path.includes('accent.svg'))).toBe(true)
  })
})
