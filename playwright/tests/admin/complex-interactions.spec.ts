import { expect, test } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l2sAAAAASUVORK5CYII=',
  'base64',
);

test('prévisualiser le logo client sans créer de client', { tag: '@J05' }, async ({ page }) => {
  await page.goto('/clients');
  await page.getByRole('button', { name: 'Ajouter client' }).click();

  const dialog = page.getByRole('dialog');
  await page.locator('#logo-upload').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: tinyPng,
  });

  const preview = dialog.getByRole('img', { name: 'Logo preview' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('src', /^data:image\/png;base64,/);
  await dialog.getByRole('button', { name: 'Annuler' }).click();
});