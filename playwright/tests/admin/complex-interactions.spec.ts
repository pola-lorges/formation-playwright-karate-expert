import { expect, test } from '@playwright/test';

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

test('prévisualiser le logo client sans créer de client', { tag: ['@J05', '@regression'] }, async ({ page }) => {
  await page.goto('/clients');
  await page.getByRole('button', { name: 'Ajouter client' }).click();

  const dialog = page.getByRole('dialog');
  await page.locator('#logo-upload').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: vividPng,
  });

  const preview = dialog.getByRole('img', { name: 'Logo preview' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  await page.waitForTimeout(4_000);
  await dialog.getByRole('button', { name: 'Annuler' }).click();
});