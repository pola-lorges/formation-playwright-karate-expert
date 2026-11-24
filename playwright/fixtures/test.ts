import type { Page } from '@playwright/test';
import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env';

type Fixtures = {
  authenticatedPage: Page;
  clientName: string;
};

export const test = base.extend<Fixtures>({
  clientName: async ({}, use, testInfo) => {
    await use(`QA-Client-W${testInfo.workerIndex}-${Date.now()}`);
  },
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(env.userEmail, env.userPassword);

    await use(page);
  },
});

export { expect } from '@playwright/test';