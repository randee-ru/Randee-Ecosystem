# UI Architecture

## Folder convention

- `src/components` — атомарные UI primitives.
- `src/sections` — готовые секции страниц.
- `src/layout` — shell/layout компоненты.
- `src/styles` — tokens, base styles, utilities.

## Component contract

Каждый компонент обязан иметь:

- typed props (`TypeScript`);
- variants API;
- responsive behavior;
- Storybook story;
- unit tests;
- accessibility checks;
- docs по props и usage.

## Styling

- Tailwind-first.
- Токены через CSS variables.
- Без hardcoded spacing/color в JSX при наличии токена.
