import { expect, test } from '../../fixtures/test';
import { performance as nodePerformance } from 'node:perf_hooks';
import type { Request } from '@playwright/test';

const pageLoadBudgetMs = Number(process.env.PERF_PAGE_LOAD_BUDGET_MS ?? 2_000);
const customersApiBudgetMs = Number(process.env.PERF_CUSTOMERS_API_BUDGET_MS ?? 300);

test('mesurer les temps de chargement de Clients', { tag: ['@J25', '@perf'] }, async ({ authenticatedPage }, testInfo) => {
  const requestStartedAt = new WeakMap<Request, number>();
  const apiResponses: Array<{ endpoint: string; status: number; durationMs: number }> = [];

  authenticatedPage.on('request', request => {
    requestStartedAt.set(request, nodePerformance.now());
  });

  authenticatedPage.on('response', response => {
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

  await authenticatedPage.goto('/clients');
  await expect(authenticatedPage.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();

  const navigation = await authenticatedPage.evaluate(() => {
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

  testInfo.annotations.push({ type: 'performance', description: JSON.stringify(metrics) });

  if (navigation && navigation.loadEventMs > pageLoadBudgetMs) {
    console.warn(`Performance signal: /clients load ${navigation.loadEventMs} ms > ${pageLoadBudgetMs} ms budget`);
  }
  if (metrics.customersApi && metrics.customersApi.durationMs > customersApiBudgetMs) {
    console.warn(`Performance signal: /customers ${metrics.customersApi.durationMs} ms > ${customersApiBudgetMs} ms budget`);
  }
});