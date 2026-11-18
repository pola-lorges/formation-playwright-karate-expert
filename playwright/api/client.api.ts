import type { Page } from '@playwright/test';

export interface PawkUser {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  roleName?: string;
  roleType?: string;
}

export interface PawkSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: PawkUser;
}

export class PawkAuthApi {
  constructor(
    private readonly page: Page,
    private readonly baseURL: string,
  ) {}

  async login(email: string, password: string): Promise<PawkSession> {
    const csrfToken = await this.page.evaluate(() => sessionStorage.getItem('csrf-token'));
    if (!csrfToken) {
      throw new Error('Jeton CSRF absent. La page de connexion doit être initialisée avant le login API.');
    }

    const result = await this.page.evaluate(async ({ baseURL, email, password, csrfToken }) => {
      const response = await fetch(`${baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ email, password, csrfToken }),
      });
      return { status: response.status, body: await response.json() };
    }, { baseURL: this.baseURL.replace(/\/$/, ''), email, password, csrfToken });

    if (result.status !== 200 || !result.body.success || !result.body.data?.accessToken) {
      throw new Error(`Connexion PAWK par API refusée (${result.status}).`);
    }

    return result.body.data as PawkSession;
  }

  async getCurrentUser(accessToken: string): Promise<PawkUser> {
    const result = await this.page.evaluate(async ({ baseURL, accessToken }) => {
      const response = await fetch(`${baseURL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return { status: response.status, body: await response.json() };
    }, { baseURL: this.baseURL.replace(/\/$/, ''), accessToken });

    if (result.status !== 200 || !result.body.success) {
      throw new Error(`Lecture de l'identité PAWK refusée (${result.status}).`);
    }

    return (result.body.data?.data ?? result.body.data) as PawkUser;
  }
}