import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { PawkAuthApi } from '../api/client.api';
import { env } from '../utils/env';

const { Given, When, Then } = createBdd();

Given('la page de connexion API administrateur est initialisée', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').waitFor();
  await page.waitForFunction(() => Boolean(sessionStorage.getItem('csrf-token')));
});

When('je crée une session administrateur par API et vérifie son identité', async ({ page }) => {
  const authApi = new PawkAuthApi(page, env.apiBaseURL);
  const session = await authApi.login(env.adminEmail, env.adminPassword);
  const currentUser = await authApi.getCurrentUser(session.accessToken);

  expect(currentUser.email.toLowerCase()).toBe(env.adminEmail.toLowerCase());

  const csrfToken = await page.evaluate(() => sessionStorage.getItem('csrf-token'));
  await page.context().addCookies([{
    name: 'accessToken',
    value: session.accessToken,
    url: env.baseURL,
    sameSite: 'Strict',
  }]);

  await page.evaluate(({ session, csrfToken }) => {
    localStorage.setItem('accessToken', session.accessToken);
    localStorage.setItem('refreshToken', session.refreshToken);
    localStorage.setItem('user-session', JSON.stringify({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: Date.now() + session.expiresIn,
    }));
    localStorage.setItem('lastLoginEmail', session.user.email);
    if (csrfToken) sessionStorage.setItem('csrf-token', csrfToken);
  }, { session, csrfToken });
});

Then('le module Clients est visible après la connexion API administrateur', async ({ page }) => {
  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();
});