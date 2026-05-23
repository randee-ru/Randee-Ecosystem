import { test, expect } from '@playwright/test'

const stories = [
  { id: 'ui-button--primary', file: 'ui-button-primary.png' },
  { id: 'ui-input--default', file: 'ui-input-default.png' },
  { id: 'ui-card--default', file: 'ui-card-default.png' },
  { id: 'sections-hero--left', file: 'section-hero-left.png' },
  { id: 'sections-features--default', file: 'section-features-default.png' }
]

for (const story of stories) {
  test(`visual: ${story.id}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`)
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page).toHaveScreenshot(story.file, { fullPage: true })
  })
}
