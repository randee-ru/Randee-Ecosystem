import type { BitrixComponentDescriptor, BitrixComponentFiles } from '../types'

function escapePhpString(value: string): string {
  return value.replace(/'/g, "\\'")
}

function renderParams(params: Record<string, string>): string {
  const lines = Object.entries(params).map(
    ([key, value]) => `    '${key}' => array('PARENT' => 'BASE', 'NAME' => '${escapePhpString(value)}', 'TYPE' => 'STRING')`
  )

  return lines.join(',\n')
}

function renderTemplateData(templateData: Record<string, string>): string {
  return Object.entries(templateData)
    .map(([key, value]) => `    $${key} = htmlspecialcharsbx($arParams['${key}'] ?? '${escapePhpString(value)}');`)
    .join('\n')
}

export function buildBitrixComponentFiles(descriptor: BitrixComponentDescriptor): BitrixComponentFiles {
  const params = descriptor.params ?? {}
  const templateData = descriptor.templateData ?? {}

  const componentPhp = descriptor.componentPhp ?? `<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

$arResult = array();
$this->IncludeComponentTemplate();
`

  const parametersPhp = `<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

$arComponentParameters = array(
  'PARAMETERS' => array(
${Object.keys(params).length > 0 ? renderParams(params) : ''}
  )
);
`

  const templatePhp = descriptor.templatePhp ?? `<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();
${Object.keys(templateData).length > 0 ? renderTemplateData(templateData) : ''}
?>
<section class="randee-${descriptor.name.replace(/\./g, '-')}">
  <div class="randee-container">
    <h2>${escapePhpString(descriptor.title)}</h2>
    ${descriptor.description ? `<p>${escapePhpString(descriptor.description)}</p>` : ''}
  </div>
</section>
`

  const styleCss = descriptor.css ?? `.randee-${descriptor.name.replace(/\./g, '-')} {
  padding: 48px 0;
}
`

  const scriptJs = descriptor.js ?? `document.addEventListener('DOMContentLoaded', function () {
  // Randee ${descriptor.name} component hook
});
`

  return {
    componentPhp,
    parametersPhp,
    templatePhp,
    styleCss,
    scriptJs
  }
}
