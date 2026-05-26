import { expect, test } from '@playwright/test'

test('builder CMS tab opens and shows refresh control', async ({ page }) => {
  await page.goto('/builder')
  await expect(page.locator('[data-builder-ready="true"]')).toBeVisible()

  await page.getByTestId('left-tab-cms').click()
  await expect(page.getByTestId('cms-refresh-iblocks')).toBeVisible()
})
