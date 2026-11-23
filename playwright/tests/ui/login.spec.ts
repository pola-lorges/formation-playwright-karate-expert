import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/dashboard.page';
import { LoginPage } from '../../pages/login.page';
import { env } from '../../utils/env';

test('Login -> Dashboard -> Logout', { tag: ['@J01', '@J02', '@smoke', '@regression', '@e2e'] }, async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.open();
  await loginPage.login(env.userEmail, env.userPassword);
  await expect(page).toHaveURL(/dashboard/);
  await expect(dashboardPage.title).toBeVisible();
  await dashboardPage.header.signOut();
  await expect(page).toHaveURL(/login/);
});