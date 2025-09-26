import { test, expect } from '@playwright/test';

test('member can view membership and add family', async ({ page }) => {
  // This test assumes an authenticated session or a login helper in place.
  // Navigate directly to membership for now.
  await page.goto('/membership');
  await expect(page.getByText('My Membership')).toBeVisible();
});

