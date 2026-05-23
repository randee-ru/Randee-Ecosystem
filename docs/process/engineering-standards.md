# Engineering Standards

## Code quality

- TypeScript strict mode always on.
- ESLint errors block CI.
- Prettier и Stylelint обязательны.

## Testing strategy

- Unit/component: Vitest + React Testing Library.
- E2E: Playwright.
- Visual regression: Storybook + Chromatic + screenshot baselines.
- Accessibility: axe-core + addon-a11y.

## Required scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run format`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run storybook`
- `npm run build-storybook`
