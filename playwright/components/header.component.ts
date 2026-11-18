import type { Locator, Page } from '@playwright/test';

export class Header {
  readonly profileLink: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    this.profileLink = page.getByRole('link', { name: 'Mon compte' });
    this.signOutButton = page.getByRole('button', { name: 'Déconnexion' });
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }
}