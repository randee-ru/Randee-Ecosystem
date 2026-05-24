# Component `design` в export

Контракт для поля `PageBlock.design` (`ComponentDesignSettings`) при экспорте в HTML и Bitrix.

## Что попадает в production

| Настройка | Edit Component | HTML export | Bitrix export |
|-----------|----------------|-------------|---------------|
| **Artboard** — position (X/Y) | ✅ canvas | ❌ | ❌ |
| **Artboard** — size (width/height, modes) | ✅ canvas | ❌ | ❌ |
| **Layout** — stack/grid, direction, gap, padding | ✅ root | ✅ inline `style` | ✅ inline `style` |
| **Fill** — background color | ✅ root | ✅ inline `style` | ✅ inline `style` |
| **Typography** — base font size | ✅ root | ✅ inline `style` | ✅ inline `style` |

Artboard — только рамка редактора. В Bitrix/HTML не экспортируется.

## Формат export

- **HTML** (`exportPageToHtmlWithAssets`): inline `style` на корневом `<div data-randee-template="...">`.
- **Bitrix** (`mapPageBlockToBitrix`): тот же inline `style` на корневом div в `template.php`.
- **JSON** (`block.json`, `page.json`): поле `design` сохраняется как есть для повторного импорта в Builder.

CSS variables не используются: inline styles совпадают с preview в Edit Component mode.

## Код

- Расчёт стилей: `packages/builder/src/utils/component-design-css.ts`
- Canvas (editor): `apps/web/app/builder/builder-component-canvas.ts`
- HTML: `packages/blocks/src/server.ts` → `blockToHtml`
- Bitrix: `packages/blocks/src/bitrix-export.ts` → `buildBitrixTemplateFromPreview`

## Пример

```json
{
  "design": {
    "layout": { "gap": 16, "padding": 32, "direction": "vertical" },
    "fill": "F5F5F5",
    "typography": { "baseSize": 18 }
  }
}
```

В export root div:

```html
style="background:#F5F5F5;font-size:18px;display:flex;flex-direction:column;gap:16px;padding:32px;..."
```
