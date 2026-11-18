import { expect, test, type Page } from '@playwright/test';

const customersUrl = 'https://api-prod.intranet-pawk.com/api/v1/customers**';
const refreshUrl = 'https://api-prod.intranet-pawk.com/api/v1/auth/refresh**';

async function mockCustomerFailure(
  page: Page,
  failure: { status?: number; timeout?: boolean },
): Promise<{ customerRequests: number; refreshRequests: number }> {
  const requests = { customerRequests: 0, refreshRequests: 0 };

  await page.route(customersUrl, async route => {
    requests.customerRequests++;
    if (failure.timeout) {
      await route.abort('timedout');
      return;
    }

    await route.fulfill({
      status: failure.status ?? 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Mock customer API error',
        data: null,
        errorCode: 'MOCK_ERROR',
      }),
    });
  });

  if (failure.status === 401) {
    await page.route(refreshUrl, route => {
      requests.refreshRequests++;
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Session expired', data: null }),
      });
    });
  }

  return requests;
}

test('afficher les clients renvoyés par une API simulée', { tag: '@J07' }, async ({ page }) => {
  let interceptedRequests = 0;

  await page.route(customersUrl, async route => {
    interceptedRequests++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Customers retrieved successfully',
        data: {
          content: [{
            id: 'mock-customer-001',
            name: 'QA Mock Client',
            address1: { line: 'Bafoussam', country: 'Cameroun' },
            address2: null,
            address3: null,
            logoUrl: null,
          }],
          empty: false,
          first: true,
          last: true,
          number: 0,
          numberOfElements: 1,
          pageable: {},
          size: 10,
          sort: {},
          totalElements: 1,
          totalPages: 1,
        },
        timestamp: new Date().toISOString(),
        path: '/api/v1/customers',
        errorCode: null,
      }),
    });
  });

  await page.goto('/clients');

  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();
  await expect(page.getByText('QA Mock Client', { exact: true })).toBeVisible();
  await expect(page.getByText('Bafoussam', { exact: true })).toBeVisible();
  expect(interceptedRequests).toBeGreaterThan(0);
});

test('afficher un état vide si l’API clients répond 400', { tag: '@J07' }, async ({ page }) => {
  const requests = await mockCustomerFailure(page, { status: 400 });
  await page.goto('/clients');

  await expect(page.getByText('Aucun client trouvé', { exact: true })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
});

test('rediriger vers la connexion si le token est refusé et son refresh échoue', { tag: '@J07' }, async ({ page }) => {
  const requests = await mockCustomerFailure(page, { status: 401 });
  await page.goto('/clients');

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
  expect(requests.refreshRequests).toBeGreaterThan(0);
});

test('afficher un état vide si l’API clients répond 500', { tag: '@J07' }, async ({ page }) => {
  const requests = await mockCustomerFailure(page, { status: 500 });
  await page.goto('/clients');

  await expect(page.getByText('Aucun client trouvé', { exact: true })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
});

test('afficher un état vide si la requête clients expire', { tag: '@J07' }, async ({ page }) => {
  const requests = await mockCustomerFailure(page, { timeout: true });
  await page.goto('/clients');

  await expect(page.getByText('Aucun client trouvé', { exact: true })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
});