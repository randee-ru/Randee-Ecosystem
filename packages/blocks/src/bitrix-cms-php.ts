import type { BuilderPage, PageBlock } from '@randee/builder'
import type { BitrixComponentDescriptor } from '@randee/bitrix-adapter'

function findListBinding(block: PageBlock): { iblockId: string; limit: number } | null {
  const props = block.cmsBindings?.props ?? {}
  for (const state of Object.values(props)) {
    if (state?.mode !== 'binding' || !state.binding) continue
    const source = state.binding.source
    if (source.mode === 'list' && source.iblockId) {
      return {
        iblockId: source.iblockId,
        limit: Math.max(1, Math.min(50, Number(source.query?.limit ?? 10) || 10))
      }
    }
  }

  for (const element of block.elements ?? []) {
    const bindings = element.cmsBindings ?? {}
    for (const state of Object.values(bindings)) {
      if (state?.mode !== 'binding' || !state.binding) continue
      const source = state.binding.source
      if (source.mode === 'list' && source.iblockId) {
        return {
          iblockId: source.iblockId,
          limit: Math.max(1, Math.min(50, Number(source.query?.limit ?? 10) || 10))
        }
      }
    }
  }

  return null
}

export function buildCmsListComponentPhp(iblockId: string, limit: number): string {
  const iblock = Number(iblockId) || 0
  const top = Math.max(1, Math.min(50, limit))
  return `<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

CModule::IncludeModule('iblock');

$arResult = array('ITEMS' => array());

$rs = CIBlockElement::GetList(
  array('SORT' => 'ASC', 'ID' => 'DESC'),
  array('IBLOCK_ID' => ${iblock}, 'ACTIVE' => 'Y', 'CHECK_PERMISSIONS' => 'Y'),
  false,
  array('nTopCount' => ${top}),
  array('ID', 'NAME', 'CODE', 'PREVIEW_TEXT', 'DETAIL_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PICTURE', 'DETAIL_PAGE_URL')
);

while ($ob = $rs->GetNextElement()) {
  $arFields = $ob->GetFields();
  $arProps = $ob->GetProperties();
  $arResult['ITEMS'][] = array_merge($arFields, array('PROPERTIES' => $arProps));
}

$this->IncludeComponentTemplate();
`
}

export function applyCmsListComponentPhp(
  descriptor: BitrixComponentDescriptor,
  block: PageBlock
): BitrixComponentDescriptor {
  const list = findListBinding(block)
  if (!list) return descriptor
  return {
    ...descriptor,
    componentPhp: buildCmsListComponentPhp(list.iblockId, list.limit)
  }
}

export function pageHasCmsListBindings(page: BuilderPage): boolean {
  return page.blocks.some((block) => findListBinding(block) !== null)
}
