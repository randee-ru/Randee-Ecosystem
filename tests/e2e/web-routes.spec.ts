import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 1000 }
]

for (const viewport of viewports) {
  test(`home renders on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await expect(page.locator('[data-randee-page="home"]')).toBeVisible()
    await expect(page.getByRole('link', { name: /открыть builder/i })).toBeVisible()
  })

  test(`builder renders on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/builder')
    await expect(page.locator('[data-randee-page="builder"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /export bitrix/i })).toBeVisible()
  })

  test(`marketplace renders on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/marketplace')
    await expect(page.locator('[data-randee-page="marketplace"]')).toBeVisible()
    await expect(page.getByText(/hero pro/i)).toBeVisible()
  })
}

test('builder panels can collapse and expand', async ({ page }) => {
  await page.goto('/builder')
  await page.getByRole('button', { name: /hide blocks/i }).click()
  await expect(page.getByRole('button', { name: /blocks/i })).toBeVisible()
  await page.getByRole('button', { name: /hide inspector/i }).click()
  await expect(page.getByRole('button', { name: /inspector/i })).toBeVisible()
})
