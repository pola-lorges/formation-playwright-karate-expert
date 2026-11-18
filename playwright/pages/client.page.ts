import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface ClientData {
  name: string;
  city: string;
  country: string;
}

export class ClientPage extends BasePage {
  readonly createButton: Locator;
  readonly nameInput: Locator;
  readonly cityInput: Locator;
  readonly countryInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createButton = page.getByRole('button', { name: 'Ajouter client' });
    const dialog = page.getByRole('dialog');
    this.nameInput = dialog.getByPlaceholder('Entrez le nom de votre client');
    this.cityInput = dialog.getByPlaceholder('Entrez la ville');
    this.countryInput = dialog.getByPlaceholder('Entrez le pays');
    this.submitButton = dialog.getByRole('button', { name: 'Soumettre' });
  }

  async waitForLoaded(): Promise<void> {
    await this.page.getByRole('heading', { name: 'Gestion des clients' }).waitFor();
  }

  async createClient(client: ClientData): Promise<void> {
    await this.createButton.click();
    const dialog = this.page.getByRole('dialog');
    await this.nameInput.fill(client.name);
    await this.cityInput.fill(client.city);
    await this.countryInput.fill(client.country);
    await this.submitButton.click();
    await dialog.waitFor({ state: 'hidden' });
  }

  clientRow(name: string): Locator {
    return this.page.getByRole('row').filter({ hasText: name });
  }
}