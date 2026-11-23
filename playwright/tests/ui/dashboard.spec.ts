import { expect, test } from '../../fixtures/test';
import { DashboardPage } from '../../pages/dashboard.page';

test('accéder au tableau de bord avec une session authentifiée', { tag: ['@J03', '@smoke', '@regression'] }, async ({ authenticatedPage }) => {
  const dashboardPage = new DashboardPage(authenticatedPage);

  await authenticatedPage.goto('/dashboard');

  await expect(authenticatedPage).toHaveURL(/\/dashboard/);
  await expect(dashboardPage.title).toBeVisible();
});