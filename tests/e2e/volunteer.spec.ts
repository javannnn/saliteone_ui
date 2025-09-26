import { test, expect } from '@playwright/test';

test('volunteer can open Volunteer Hub and see sections', async ({ page }) => {
  await page.goto('/volunteers');
  await expect(page.getByText('Volunteer Hub')).toBeVisible();
  await expect(page.getByText('My To-Dos')).toBeVisible();
});

test('volunteer can fill service log form', async ({ page }) => {
  await page.goto('/volunteers');
  await page.getByRole('tab', { name: 'Services Provided' }).click();
  // Example fill (date must be valid):
  // await page.getByTestId('svc-date').fill('2025-09-26');
  // await page.getByTestId('svc-type').fill('Ushering');
  // await page.getByTestId('svc-hours').fill('1');
  // await page.getByTestId('svc-add').click();
});

