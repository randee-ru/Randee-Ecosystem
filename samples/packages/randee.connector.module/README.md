# Randee Connector Module (`randee.connector`)

This package is a **Bitrix module** (not a component).  
It gives:

- admin settings in Bitrix panel;
- stable API endpoint for Builder.

## Where it appears in admin

After installation:

1. Open `Settings`.
2. In the left menu, find **Randee Connector** (added with sort `9999`, near the bottom).
3. Open `Настройки коннектора`.

Direct URL (example):

`/bitrix/admin/settings.php?mid=randee.connector&lang=ru`

## API endpoint

Use one fixed endpoint:

`/local/modules/randee.connector/tools/connector.php`

Examples:

- `...?action=ping&api_key=SECRET`
- `...?action=iblocks.list&api_key=SECRET`
- `...?action=iblock.schema&iblockId=1&api_key=SECRET`
- `...?action=elements.list&iblockId=1&limit=20&offset=0&api_key=SECRET`
- `...?action=element.get&iblockId=1&elementId=10&api_key=SECRET`

## ZIP build

From this directory:

```bash
cd "samples/packages/randee.connector.module"
zip -r randee-connector-module-v0.3.1.zip package.json payload
```

Important: `package.json` must be in ZIP root.
