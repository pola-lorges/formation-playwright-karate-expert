import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { env } from '../utils/env';

const { Given, When, Then } = createBdd();

Given('la page de connexion est ouverte', async ({ page }) => {
  await new LoginPage(page).open();
});

When('je me connecte avec le compte de test', async ({ page }) => {
  await new LoginPage(page).login(env.userEmail, env.userPassword);
});

Then('le tableau de bord est affiché', async ({ page }) => {
  await expect(page).toHaveURL(/dashboard/);
  await expect(new DashboardPage(page).title).toBeVisible();
});

When('je me déconnecte', async ({ page }) => {
  await new DashboardPage(page).header.signOut();
});

Then('je suis redirigé vers la connexion', async ({ page }) => {
  await expect(page).toHaveURL(/login/);
});