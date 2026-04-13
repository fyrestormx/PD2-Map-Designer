import { expect, test } from '@playwright/test'

test('quick start flow reaches review with a placed room', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /make a map without fighting the data files/i })).toBeVisible()
  await page.getByRole('button', { name: /start blank map/i }).click()

  await expect(page.getByRole('heading', { name: /choose the look and feel/i })).toBeVisible()
  await page.getByRole('button', { name: /hell wastes/i }).click()
  await page.getByRole('button', { name: /continue to build/i }).click()

  await expect(page.getByRole('heading', { name: /build the route visually/i })).toBeVisible()
  await page.getByRole('button', { name: 'Choose Room' }).click()
  await page.getByRole('button', { name: 'Place Room at 0,0' }).click()
  await page.getByRole('link', { name: /continue to review/i }).click()

  await expect(page.getByRole('heading', { name: /review the route before export/i })).toBeVisible()
  await expect(page.getByText(/import extracted PD2 files in Advanced Mode/i)).toBeVisible()
})
