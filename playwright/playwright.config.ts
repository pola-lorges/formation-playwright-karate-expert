import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL est manquante. Copie .env.example en .env et configure-la.');
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? Number(process.env.PLAYWRIGHT_WORKERS)
    : process.env.CI ? 2 : undefined,
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }],
  ],
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'admin',
      dependencies: ['setup'],
      testMatch: /admin\/.*\.spec\.ts/,
      use: { storageState: '.auth/admin.json' },
    },
    {
      name: 'user',
      dependencies: ['setup'],
      testMatch: /user\/.*\.spec\.ts/,
      use: { storageState: '.auth/user.json' },
    },
    {
      name: 'chromium',
      testMatch: /ui\/.*\.spec\.ts/,
    },
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
