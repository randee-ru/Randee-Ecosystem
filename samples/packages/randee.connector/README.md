# Randee Connector Package (`randee.connector`)

This folder contains a marketplace-ready component package for Bitrix.

## Package layout

```text
package.json
payload/
  local/
    components/
      randee/
        connector/
          .description.php
          .parameters.php
          component.php
          templates/
            .default/
              template.php
```

## Build ZIP

Run from this directory:

```bash
cd "samples/packages/randee.connector"
zip -r randee-connector-v0.1.0.zip package.json payload
```

Important: `package.json` must be in ZIP root.

## Install on Bitrix

1. Upload package to marketplace (`updates.c0l.ru`) as product:
   - `product_id`: `randee.connector`
   - `type`: `component`
2. Install on client site.
3. Configure connector credentials:
   - `API_KEY`
   - `ALLOWED_IBLOCK_IDS` (recommended)
   - `DEFAULT_PAGE_SIZE`
   - `MAX_PAGE_SIZE`

Recommended for direct endpoint usage:

1. Copy `config.php.example` to `config.php` in component folder.
2. Set a strong `api_key`.
3. Set `allowed_iblock_ids`.

`component.php` reads values from component params first, then from `config.php`.

## API examples

```text
/local/components/randee/connector/component.php?action=ping&api_key=SECRET
/local/components/randee/connector/component.php?action=iblocks.list&api_key=SECRET
/local/components/randee/connector/component.php?action=iblock.schema&iblockId=1&api_key=SECRET
/local/components/randee/connector/component.php?action=elements.list&iblockId=1&limit=20&offset=0&api_key=SECRET
/local/components/randee/connector/component.php?action=element.get&iblockId=1&elementId=10&api_key=SECRET
```

## Notes

- Connector is read-only.
- `element.get` returns element fields and normalized properties.
- File properties return object(s) with `src`, dimensions, mime type and file name.
