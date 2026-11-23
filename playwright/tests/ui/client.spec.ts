import { expect, test } from '@playwright/test';
import { ClientPage } from '../../pages/client.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { LoginPage } from '../../pages/login.page';
import { env } from '../../utils/env';

test('créer un client et vérifier sa présence', { tag: ['@J02', '@smoke', '@regression', '@e2e'] }, async ({ page }, testInfo) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const clientPage = new ClientPage(page);
  const name = `QA-Client-W${testInfo.workerIndex}-${Date.now()}`;

  await loginPage.open();
  await loginPage.login(env.userEmail, env.userPassword);
  await dashboardPage.goToClients();
  await clientPage.createClient({ name, city: 'Yaoundé', country: 'Cameroun' });

  await expect(clientPage.clientRow(name)).toBeVisible();
});