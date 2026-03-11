import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('rag-hub smoke', () => {
  test('admin can log in and browse documents', async ({ page }) => {
    await login(page, 'tester', 'test123456');

    await expect(page.getByText('Customer Credit Policy')).toBeVisible();
    await page.getByRole('link', { name: 'Customer Credit Policy' }).click();
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await expect(page.getByText('v1.0')).toBeVisible();
  });

  test('search workbench returns seeded hit', async ({ page }) => {
    await login(page, 'tester', 'test123456');

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search Workbench' })).toBeVisible();
    await page.getByLabel('Query').fill('business license');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('p12')).toBeVisible();
    await expect(page.getByText('Customer Credit Policy')).toBeVisible();
  });

  test('qa workbench returns citations for seeded query', async ({ page }) => {
    await login(page, 'tester', 'test123456');

    await page.goto('/qa');
    await expect(page.getByRole('heading', { name: 'QA Workbench' })).toBeVisible();
    await page.getByRole('button', { name: 'Ask' }).click();
    await expect(page.getByText(/retrievedCount:\s*1/)).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Customer Credit Policy');
  });

  test('viewer sees permission denied on permissions page', async ({ page }) => {
    await login(page, 'viewer', 'viewer123');

    await page.goto('/permissions');
    await expect(page.getByRole('heading', { name: 'Permission denied' })).toBeVisible();
    await expect(page.getByText('Please log in with an admin account.')).toBeVisible();
  });
});