import { expect, type Page } from '@playwright/test';

const adminUsername = process.env.PLAYWRIGHT_ADMIN_USERNAME || 'dockeradmin';
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'DockerAdmin123!';

export async function login(page: Page, username = adminUsername, password = adminPassword) {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Login to rag-hub' })).toBeVisible();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function seedInvalidSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'rag-hub-auth',
      JSON.stringify({
        tokenType: 'Bearer',
        accessToken: 'invalid-playwright-token',
        expiresInSeconds: 3600,
        user: {
          userId: 'playwright-user',
          username: 'dockeradmin',
          displayName: 'Playwright Invalid Session',
          roleCode: 'admin',
        },
      }),
    );
  });
}

export async function seedViewerSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'rag-hub-auth',
      JSON.stringify({
        tokenType: 'Bearer',
        accessToken: 'viewer-ui-only',
        expiresInSeconds: 3600,
        user: {
          userId: 'playwright-viewer',
          username: 'viewer',
          displayName: 'Playwright Viewer',
          roleCode: 'viewer',
        },
      }),
    );
  });
}