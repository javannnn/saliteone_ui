import { Page, expect } from '@playwright/test';

export async function login(page: Page, email?: string, password?: string) {
  const usr = email || process.env.TEST_USER_EMAIL as string;
  const pwd = password || process.env.TEST_USER_PASSWORD as string;
  await page.goto('/');
  await page.getByTestId('login-email').fill(usr);
  await page.getByTestId('login-password').fill(pwd);
  await page.getByTestId('login-submit').click();
  await expect(page.getByText('Dashboard')).toBeVisible();
}

