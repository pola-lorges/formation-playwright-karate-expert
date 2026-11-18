import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Mot de passe');
    this.submitButton = page.getByRole('button', { name: 'Se connecter' });
  }

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async waitForLoaded(): Promise<void> {
    await this.page.getByRole('heading', { name: 'Connexion' }).waitFor();
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL(/\/dashboard/);
  }
}
