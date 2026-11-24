import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('USER ouvre les présences', async ({ page }) => {
  await page.goto('/attendances');
});

Then('USER voit les présences mais pas le lien Clients', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Présences', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clients', exact: true })).toHaveCount(0);
});

When('USER ouvre directement les clients', async ({ page }) => {
  await page.goto('/clients');
});

Then("l'accès aux clients est refusé à USER", async ({ page }) => {
  await expect(page).toHaveURL(/\/unauthorized/);
  await expect(page.getByRole('heading', { name: 'Accès Refusé' })).toBeVisible();
});