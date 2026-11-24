import { expect, type Request } from '@playwright/test';
import { performance as nodePerformance } from 'node:perf_hooks';
import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/test';
import { ClientPage } from '../pages/client.page';
import { DashboardPage } from '../pages/dashboard.page';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env';

const { Given, When, Then } = createBdd(test);
const pageLoadBudgetMs = Number(process.env.PERF_PAGE_LOAD_BUDGET_MS ?? 2_000);
const customersApiBudgetMs = Number(process.env.PERF_CUSTOMERS_API_BUDGET_MS ?? 300);

Given('je suis connecté pour le parcours UI', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(env.userEmail, env.userPassword);
});

Given("je dispose d'une page authentifiée par la fixture", async ({ authenticatedPage }) => {
  await expect(authenticatedPage).toHaveURL(/\/dashboard/);
});

When("j'accède aux clients depuis le tableau de bord", async ({ page }) => {
  await new DashboardPage(page).goToClients();
});

When('je crée un client unique', async ({ page, clientName }) => {
  const clientPage = new ClientPage(page);
  await clientPage.createClient({ name: clientName, city: 'Yaoundé', country: 'Cameroun' });
});

Then('le client créé est visible dans la liste', async ({ page, clientName }) => {
  await expect(new ClientPage(page).clientRow(clientName)).toBeVisible();
});

When("j'ouvre le tableau de bord du parcours", async ({ page }) => {
  await page.goto('/dashboard');
});

Then('le tableau de bord du parcours est visible', async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(new DashboardPage(page).title).toBeVisible();
});

When('je mesure le chargement de la page Clients', async ({ page, $testInfo }) => {
  const requestStartedAt = new WeakMap<Request, number>();
  const apiResponses: Array<{ endpoint: string; status: number; durationMs: number }> = [];

  page.on('request', request => {
    requestStartedAt.set(request, nodePerformance.now());
  });

  page.on('response', response => {
    const request = response.request();
    const startedAt = requestStartedAt.get(request);
    if (startedAt === undefined) return;

    if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') {
      const url = new URL(response.url());
      apiResponses.push({
        endpoint: url.pathname,
        status: response.status(),
        durationMs: Number((nodePerformance.now() - startedAt).toFixed(1)),
      });
    }
  });

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();

  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!entry) return null;

    return {
      ttfbMs: Number(entry.responseStart.toFixed(1)),
      domContentLoadedMs: Number(entry.domContentLoadedEventEnd.toFixed(1)),
      loadEventMs: Number(entry.loadEventEnd.toFixed(1)),
    };
  });

  const metrics = {
    page: '/clients',
    navigation,
    apiResponses,
    customersApi: apiResponses.find(response => /(customers|clients)/i.test(response.endpoint)) ?? null,
    budgets: {
      pageLoadMs: pageLoadBudgetMs,
      customersApiMs: customersApiBudgetMs,
    },
  };

  $testInfo.annotations.push({ type: 'performance', description: JSON.stringify(metrics) });

  if (navigation && navigation.loadEventMs > pageLoadBudgetMs) {
    console.warn(`Performance signal: /clients load ${navigation.loadEventMs} ms > ${pageLoadBudgetMs} ms budget`);
  }
  if (metrics.customersApi && metrics.customersApi.durationMs > customersApiBudgetMs) {
    console.warn(`Performance signal: /customers ${metrics.customersApi.durationMs} ms > ${customersApiBudgetMs} ms budget`);
  }
});

Then('les mesures de performance sont enregistrées', async ({ $testInfo }) => {
  expect($testInfo.annotations.some(annotation => annotation.type === 'performance')).toBe(true);
});