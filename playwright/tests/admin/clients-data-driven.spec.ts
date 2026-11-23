import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

interface ClientCase {
  id: string;
  name: string;
  city: string;
  country: string;
}

const clients = JSON.parse(
  readFileSync(resolve(__dirname, '../../datas/clients.json'), 'utf8'),
) as ClientCase[];
const customersUrl = 'https://api-prod.intranet-pawk.com/api/v1/customers**';

for (const client of clients) {
  test(`afficher ${client.name} a ${client.city}`, { tag: ['@J08', '@regression'] }, async ({ page }) => {
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
              id: client.id,
              name: client.name,
              address1: { line: client.city, country: client.country },
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
    await expect(page.getByText(client.name, { exact: true })).toBeVisible();
    await expect(page.getByText(client.city, { exact: true })).toBeVisible();
    await expect(page.getByText(client.country, { exact: true })).toBeVisible();
    expect(interceptedRequests).toBeGreaterThan(0);
  });
}