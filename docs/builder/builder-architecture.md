# Builder Architecture

## Core modules

- Canvas engine (dnd-kit).
- Block registry.
- Block props editor.
- Preview renderer.
- Persistence layer (JSON schema storage).
- Export bridge.

## JSON schema (MVP)

```json
{
  "page": "Главная",
  "slug": "/",
  "blocks": [
    {
      "id": "hero_001",
      "type": "hero",
      "template": "hero-01",
      "props": {
        "title": "Разработка сайтов на Bitrix"
      }
    }
  ]
}
```

## E2E critical paths

- create project;
- create page;
- add/edit/reorder/delete block;
- responsive preview switch;
- export HTML;
- export Bitrix.
