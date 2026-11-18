import { expect, test } from '@playwright/test';
import { PawkAuthApi } from '../../api/client.api';
import { env } from '../../utils/env';

test.use({ storageState: { cookies: [], origins: [] } });

test('se connecter par API, lire /users/me et ouvrir Clients dans PAWK', { tag: '@J06' }, async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').waitFor();
  await page.waitForFunction(() => Boolean(sessionStorage.getItem('csrf-token')));

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

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Gestion des clients' })).toBeVisible();
});