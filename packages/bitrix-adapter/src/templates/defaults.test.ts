import { describe, expect, it } from 'vitest'
import { buildBitrixComponentFiles } from './defaults'

describe('buildBitrixComponentFiles', () => {
  it('creates deterministic php templates for hero', () => {
    const files = buildBitrixComponentFiles({
      namespace: 'randee',
      name: 'hero',
      title: 'Hero title',
      description: 'Hero description',
      params: { TITLE: 'Title' },
      templateData: { TITLE: 'Hero title' }
    })

    expect(files.parametersPhp).toMatchInlineSnapshot(`"<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

$arComponentParameters = array(
  'PARAMETERS' => array(
    'TITLE' => array('PARENT' => 'BASE', 'NAME' => 'Title', 'TYPE' => 'STRING')
  )
);
"`)

    expect(files.templatePhp).toContain('<section class="randee-hero">')
  })

  it('renders dotted component names to dashed css class', () => {
    const files = buildBitrixComponentFiles({
      namespace: 'randee',
      name: 'catalog.section',
      title: 'Catalog',
      params: { TITLE: 'Title' },
      templateData: { TITLE: 'Catalog' }
    })

    expect(files.templatePhp).toContain('randee-catalog-section')
    expect(files.styleCss).toContain('.randee-catalog-section')
  })
})
