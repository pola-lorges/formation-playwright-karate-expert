import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

const vividPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAABL0lEQVR4nO3SMQEAIAzAsHlBHf4FDBkc' +
    'zZG/R2fPXbrmdwAGwAAYAANgAAyAATAABsAAGAADYAAMgAEwAAbAABgAA2AADIABMAAGwAAYAANgAAyA' +
    'ATAABsAAGAADYAAMgAEwAAbAABggzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDO' +
    'AHEGiDNAnAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEG' +
    'iDNAnAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEGiDNA' +
    'nAHiDBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0CcAeIMEGeAOAPEGSDOAHEGiDNAnAHi' +
    'DBBngDgDxBkgzgBxBogzQJwB4gwQZ4A4A8QZIM4AcQaIM0DcA6jziX+RcChjAAAAAElFTkSuQmCC',
  'base64',
);

Given("l'administrateur ouvre son tableau de bord", async ({ page }) => {
  await page.goto('/dashboard');
});

Then('le tableau de bord et le lien Clients administrateur sont visibles', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clients', exact: true })).toBeVisible();
});

When("l'administrateur ouvre le module Clients", async ({ page }) => {
  await page.goto('/clients');
});

Then('la gestion des clients administrateur est visible', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();
});

Given("l'administrateur ouvre le formulaire d'ajout de client", async ({ page }) => {
  await page.goto('/clients');
  await page.getByRole('button', { name: 'Ajouter client' }).click();
});

When("l'administrateur charge un logo PNG", async ({ page }) => {
  await page.locator('#logo-upload').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: vividPng,
  });
});

Then("le logo PNG est prévisualisé et l'ajout est annulé après 4 secondes", async ({ page }) => {
  const dialog = page.getByRole('dialog');
  const preview = dialog.getByRole('img', { name: 'Logo preview' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  await page.waitForTimeout(4_000);
  await dialog.getByRole('button', { name: 'Annuler' }).click();
});

Then('le client simulé administrateur {string} nommé {string} à {string} dans {string} est affiché', async ({ page }, id: string, name: string, city: string, country: string) => {
  let interceptedRequests = 0;

  await page.route('https://api-prod.intranet-pawk.com/api/v1/customers**', async route => {
    interceptedRequests++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Customers retrieved successfully',
        data: {
          content: [{ id, name, address1: { line: city, country }, address2: null, address3: null, logoUrl: null }],
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
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText(city, { exact: true })).toBeVisible();
  await expect(page.getByText(country, { exact: true })).toBeVisible();
  expect(interceptedRequests).toBeGreaterThan(0);
});