import { expect, test, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const customersUrl = 'https://api-prod.intranet-pawk.com/api/v1/customers**';
const refreshUrl = 'https://api-prod.intranet-pawk.com/api/v1/auth/refresh**';

function customerResponse(id: string, name: string, city: string) {
  return {
    success: true,
    message: 'Customers retrieved successfully',
    data: {
      content: [{
        id,
        name,
        address1: { line: city, country: 'Cameroun' },
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
}

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

Then('le parcours mock clients affiche le client simulé', async ({ page }) => {
  let interceptedRequests = 0;
  await page.route(customersUrl, async route => {
    interceptedRequests++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(customerResponse('mock-customer-001', 'QA Mock Client', 'Bafoussam')),
    });
  });

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();
  await expect(page.getByText('QA Mock Client', { exact: true })).toBeVisible();
  await expect(page.getByText('Bafoussam', { exact: true })).toBeVisible();
  expect(interceptedRequests).toBeGreaterThan(0);
});

Then('le parcours mock clients affiche un état vide pour le statut {int}', async ({ page }, status: number) => {
  const requests = await mockCustomerFailure(page, { status });
  await page.goto('/clients');
  await expect(page.getByText('Aucun client trouvé', { exact: true })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
});

Then('le parcours mock clients redirige après échec du refresh 401', async ({ page }) => {
  const requests = await mockCustomerFailure(page, { status: 401 });
  await page.goto('/clients');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
  expect(requests.refreshRequests).toBeGreaterThan(0);
});

Then('le parcours mock clients affiche un état vide après expiration', async ({ page }) => {
  const requests = await mockCustomerFailure(page, { timeout: true });
  await page.goto('/clients');
  await expect(page.getByText('Aucun client trouvé', { exact: true })).toBeVisible();
  expect(requests.customerRequests).toBeGreaterThan(0);
});

Given("l'API mock clients répond avec une latence variable", async ({ page }) => {
  await page.route(customersUrl, async route => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(customerResponse('mock-flaky-client', 'QA Flaky Client', 'Douala')),
    });
  });
});

When("j'ouvre la liste des clients pour le mock avec latence", async ({ page }) => {
  await page.goto('/clients');
});

Then('le client du mock avec latence est affiché', async ({ page }) => {
  await expect(page.getByText('QA Flaky Client', { exact: true })).toBeVisible();
});

Then('le parcours de diagnostic mock clients joint et vérifie la réponse', async ({ page, $testInfo }) => {
  const mockedResponse = customerResponse('mock-diagnostic-client', 'QA Diagnostic Client', 'Yaounde');

  await page.route(customersUrl, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockedResponse),
  }));

  await test.step('Ouvrir la liste des clients', async () => {
    await page.goto('/clients');
  });

  await test.step('Joindre la réponse API simulée au rapport', async () => {
    await $testInfo.attach('customers-api-response', {
      body: Buffer.from(JSON.stringify(mockedResponse, null, 2)),
      contentType: 'application/json',
    });
  });

  await test.step('Vérifier le client renvoyé par l’API', async () => {
    await expect(page.getByText('QA Diagnostic Client', { exact: true })).toBeVisible();
  });
});