import type { Locator, Page } from '@playwright/test';
import { Header } from '../components/header.component';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  readonly title: Locator;
  readonly header: Header;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Tableau de bord' });
    this.header = new Header(page);
  }

  async waitForLoaded(): Promise<void> {
    await this.title.waitFor();
  }

  async goToClients(): Promise<void> {
    await this.page.getByRole('link', { name: 'Clients' }).click();
    await this.page.waitForURL(/\/clients/);
  }
}