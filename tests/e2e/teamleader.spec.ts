import { test, expect } from '@playwright/test';

test('team leader approvals page loads', async ({ page }) => {
  await page.goto('/team/approvals');
  await expect(page.getByText('Team Approvals')).toBeVisible();
});

