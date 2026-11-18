import { test as base, type Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { env } from '../utils/env';

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(env.userEmail, env.userPassword);

    await use(page);
  },
});

export { expect } from '@playwright/test';