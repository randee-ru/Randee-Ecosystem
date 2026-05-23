import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01
    }
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:6006'
  },
  webServer: {
    command: 'npm run storybook --workspace @randee/ui -- --ci --port 6006',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: true,
    timeout: 120_000
  }
})
