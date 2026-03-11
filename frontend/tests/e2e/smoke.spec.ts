import { test, expect } from '@playwright/test';
import { login, seedInvalidSession, seedViewerSession } from './helpers';

const seededDocumentId = '11111111-1111-1111-1111-111111111111';
const seededHistoryVersionId = '22222222-2222-2222-2222-222222222223';
const sampleTaskId = '44444444-4444-4444-4444-444444444444';
const sampleQueryLogId = '66666666-6666-6666-6666-666666666666';

test.describe('rag-hub core regression', () => {
  test('admin can log in and browse documents', async ({ page }) => {
    await login(page);

    await expect(page.getByText('Customer Credit Policy')).toBeVisible();
    await page.getByRole('link', { name: 'Customer Credit Policy' }).click();
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await expect(page.getByText('v1.0')).toBeVisible();
  });

  test('search workbench returns seeded hit', async ({ page }) => {
    await login(page);

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search Workbench' })).toBeVisible();
    await page.getByLabel('Query').fill('business license');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('p12')).toBeVisible();
    await expect(page.getByText('Customer Credit Policy')).toBeVisible();
  });

  test('qa workbench returns citations for seeded query', async ({ page }) => {
    await login(page);

    await page.goto('/qa');
    await expect(page.getByRole('heading', { name: 'QA Workbench' })).toBeVisible();
    await page.getByRole('button', { name: 'Ask' }).click();
    await expect(page.getByText(/retrievedCount:\s*1/)).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Customer Credit Policy');
  });

  test('admin can open the sample task detail page', async ({ page }) => {
    await login(page);

    await page.goto(`/tasks/${sampleTaskId}`);
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page.getByText('Task ID:')).toContainText(sampleTaskId);
    await expect(page.getByText('success')).toBeVisible();
  });

  test('admin can open the sample query log detail page', async ({ page }) => {
    await login(page);

    await page.goto(`/query-logs/${sampleQueryLogId}`);
    await expect(page.getByRole('heading', { name: 'Query Log Detail' })).toBeVisible();
    await expect(page.getByText(sampleQueryLogId)).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Customer Credit Policy');
  });

  test('admin can upload a document and open the created task', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByRole('dialog', { name: 'Upload document' })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'playwright-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('playwright upload document\n'),
    });
    await expect(page.getByText('Selected: playwright-upload.txt')).toBeVisible();
    await page.getByLabel('Title').fill('Playwright Upload Document');
    await page.getByLabel('Domain').fill('qa');
    await page.getByLabel('Department').fill('automation');
    await page.getByLabel('Owner').fill('playwright');
    await page.getByRole('button', { name: 'Submit upload' }).click();

    await expect(page.getByText('Upload request submitted')).toBeVisible();
    const taskLink = page.locator('a[href^="/tasks/"]').filter({ hasText: 'Open task' }).first();
    await expect(taskLink).toBeVisible();
    const href = await taskLink.getAttribute('href');
    await taskLink.click();

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page.getByText('Task ID:')).toContainText(href?.replace('/tasks/', '') ?? '');
  });

  test('admin can create a reparse task from document detail', async ({ page }) => {
    await login(page);

    await page.goto(`/documents/${seededDocumentId}`);
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await page.getByLabel('Reason').fill('playwright reparse regression');
    await page.getByRole('button', { name: 'Submit reparse' }).click();

    await expect(page.getByText('Reparse task created')).toBeVisible();
    await expect(page.getByRole('link', { name: /Open task/ })).toBeVisible();
  });

  test('admin can activate the seeded history version', async ({ page }) => {
    await login(page);

    await page.goto(`/documents/${seededDocumentId}`);
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await page.getByRole('button', { name: 'Use seeded history version' }).click();
    await page.getByLabel('Remark').fill('playwright activate regression');
    await page.getByRole('button', { name: 'Activate' }).click();

    await expect(page.getByText('Version activation submitted')).toBeVisible();
    await expect(page.getByText(seededHistoryVersionId)).toBeVisible();
  });

  test('admin can submit permission binding policies', async ({ page }) => {
    await login(page);

    await page.goto('/permissions');
    await expect(page.getByRole('heading', { name: 'Permission Binding' })).toBeVisible();
    await page.getByRole('button', { name: 'Add policy' }).click();
    await page.getByLabel('Subject value').nth(1).fill('viewer');
    await page.getByLabel('Effect').nth(1).click();
    await page.getByRole('option', { name: 'deny' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Stored 2 policies')).toBeVisible();
  });

  test('viewer role is blocked from the permissions form', async ({ page }) => {
    await seedViewerSession(page);
    await page.goto('/permissions');

    await expect(page.getByRole('heading', { name: 'Permission denied' })).toBeVisible();
    await expect(page.getByText('Please log in with an admin account.')).toBeVisible();
  });

  test('invalid stored token is redirected back to login on 401', async ({ page }) => {
    await seedInvalidSession(page);
    await page.goto('/documents');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Login to rag-hub' })).toBeVisible();
  });
});