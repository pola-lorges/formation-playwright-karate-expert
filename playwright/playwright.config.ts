import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL est manquante. Copie .env.example en .env et configure-la.');
}

const uiBdd = defineBddConfig({ features: 'features/ui/**/*.feature', steps: ['steps/**/*.ts', 'fixtures/test.ts'], outputDir: '.features-gen/ui' });
const adminBdd = defineBddConfig({ features: 'features/admin/**/*.feature', steps: 'steps/**/*.ts', outputDir: '.features-gen/admin' });
const userBdd = defineBddConfig({ features: 'features/user/**/*.feature', steps: 'steps/**/*.ts', outputDir: '.features-gen/user' });

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
    ['allure-playwright', { resultsDir: 'test-results/allure-results' }],
  ],
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'admin',
      dependencies: ['setup'],
      testDir: adminBdd,
      use: { storageState: '.auth/admin.json' },
    },
    {
      name: 'user',
      dependencies: ['setup'],
      testDir: userBdd,
      use: { storageState: '.auth/user.json' },
    },
    {
      name: 'chromium',
      testDir: uiBdd,
    },
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
