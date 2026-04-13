import { expect, test } from '@playwright/test'

test('loads the demo workspace and builds an export bundle', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /import extracted map data/i })).toBeVisible()
  await page.getByRole('button', { name: /load demo workspace/i }).click()
  await expect(page.getByText('Ember March')).toBeVisible()

  await page.getByRole('link', { name: /Export/ }).click()
  await page.getByRole('button', { name: /build export bundle/i }).click()

  await expect(page.getByText('Levels.txt')).toBeVisible()
  await expect(page.getByText('EXPORT_REPORT.md')).toBeVisible()
})
