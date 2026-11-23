import { expect, test } from '@playwright/test';

test('USER ne voit pas le module Clients dans sa navigation', { tag: ['@J04', '@regression'] }, async ({ page }) => {
  await page.goto('/attendances');
  await expect(page.getByRole('link', { name: 'Présences', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clients', exact: true })).toHaveCount(0);
});

test('USER ne peut pas ouvrir directement le module Clients', { tag: ['@J04', '@regression'] }, async ({ page }) => {
  await page.goto('/clients');

  await expect(page).toHaveURL(/\/unauthorized/);
  await expect(page.getByRole('heading', { name: 'Accès Refusé' })).toBeVisible();
});