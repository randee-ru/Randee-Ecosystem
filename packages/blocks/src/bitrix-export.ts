import type { BitrixComponentDescriptor } from '@randee/bitrix-adapter'
import type { PageBlock } from '@randee/builder'
import { isUserComponentTemplateId } from './component-template-id'
import { readComponentMeta, readTemplateAssetText } from './component-io'

function escapePhpString(value: string): string {
  return value.replace(/'/g, "\\'")
}

export function mapUserComponentBlockToBitrix(block: PageBlock): BitrixComponentDescriptor | null {
  if (block.type !== 'component' || !isUserComponentTemplateId(block.template)) return null

  const meta = readComponentMeta(block.template)
  if (!meta?.savedToAssets) return null

  const cls = block.template.replace(/\./g, '-')
  const title = block.props.title ?? meta.name
  const css = readTemplateAssetText(block.template, 'style.css') ?? ''
  const js = readTemplateAssetText(block.template, 'script.js') ?? ''
  const bitrixName = block.template.replace(/-/g, '_')

  const templatePhp = `<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
$TITLE = htmlspecialcharsbx($arParams['TITLE'] ?? '${escapePhpString(title)}');
?>
<div class="randee-${cls}" data-randee-template="${block.template}">
  <h2 class="randee-${cls}__title"><?= $TITLE ?></h2>
</div>`

  return {
    namespace: 'randee',
    name: bitrixName,
    title: meta.name,
    description: meta.description,
    params: { TITLE: 'Title' },
    templateData: { TITLE: title },
    css,
    js,
    templatePhp
  }
}
