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

test('J09 attendre les clients malgré une latence variable', { tag: '@J09' }, async ({ page }) => {
  await page.route(customersUrl, async route => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Customers retrieved successfully',
        data: {
          content: [{
            id: 'mock-flaky-client',
            name: 'QA Flaky Client',
            address1: { line: 'Douala', country: 'Cameroun' },
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
  await expect(page.getByText('QA Flaky Client', { exact: true })).toBeVisible();
});

test('J10 diagnostiquer l’affichage d’un client', { tag: '@J10' }, async ({ page }, testInfo) => {
  const mockedResponse = {
    success: true,
    message: 'Customers retrieved successfully',
    data: {
      content: [{
        id: 'mock-diagnostic-client',
        name: 'QA Diagnostic Client',
        address1: { line: 'Yaounde', country: 'Cameroun' },
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
  };

  await page.route(customersUrl, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockedResponse),
  }));

  await test.step('Ouvrir la liste des clients', async () => {
    await page.goto('/clients');
  });

  await test.step('Joindre la réponse API simulée au rapport', async () => {
    await testInfo.attach('customers-api-response', {
      body: Buffer.from(JSON.stringify(mockedResponse, null, 2)),
      contentType: 'application/json',
    });
  });

  await test.step('Vérifier le client renvoyé par l’API', async () => {
    await expect(page.getByText('QA Diagnostic Client w', { exact: true })).toBeVisible();
  });
});