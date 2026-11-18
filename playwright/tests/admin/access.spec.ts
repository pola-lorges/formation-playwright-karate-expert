import { expect, test } from '@playwright/test';

test('ADMIN accède au tableau de bord et au module Clients', { tag: '@J04' }, async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clients', exact: true })).toBeVisible();

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();
});