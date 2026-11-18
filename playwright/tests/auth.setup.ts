import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test as setup } from '@playwright/test';
import { env } from '../utils/env';

const roles = [
  { name: 'admin', email: env.adminEmail, password: env.adminPassword },
  { name: 'user', email: env.roleUserEmail, password: env.roleUserPassword },
];

for (const role of roles) {
  setup(`authentifier le rôle ${role.name}`, { tag: ['@J04', '@J05', '@J06', '@J07', '@J08'] }, async ({ page }) => {
    await mkdir(resolve('.auth'), { recursive: true });
    await page.goto('/login');
    await page.getByLabel('Email').fill(role.email);
    await page.getByLabel('Mot de passe').fill(role.password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));
    await page.context().storageState({ path: resolve('.auth', `${role.name}.json`) });
  });
}