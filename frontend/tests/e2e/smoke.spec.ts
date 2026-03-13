import { test, expect } from '@playwright/test';
import { login, mockJsonError, seedInvalidSession, seedViewerSession } from './helpers';

const seededDocumentId = '11111111-1111-1111-1111-111111111111';
const currentVersionId = '22222222-2222-2222-2222-222222222222';
const sampleQueryLogId = '66666666-6666-6666-6666-666666666666';
const missingTaskId = '99999999-9999-9999-9999-999999999999';
const missingQueryLogId = '77777777-7777-7777-7777-777777777777';

test.describe('rag-hub core regression', () => {
  test('admin can log in and browse documents', async ({ page }) => {
    await login(page);

    await expect(page.getByText(seededDocumentId)).toBeVisible();
    await page.locator(`a[href="/documents/${seededDocumentId}"]`).first().click();
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await expect(page.getByText(currentVersionId)).toBeVisible();
  });

  test('search workbench returns search results', async ({ page }) => {
    await login(page);

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search Workbench' })).toBeVisible();
    await page.getByLabel('Query').fill('business license');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByRole('heading', { level: 3 }).filter({ hasText: /[1-9]/ })).toBeVisible();
    await expect(page.getByRole('table')).toContainText('chunk-1');
  });

  test('search workbench shows an inline failure prompt when search backend fails', async ({ page }) => {
    await login(page);
    await mockJsonError(page, '/api/search/query', 'POST', 503, 'KB-50300', 'search backend unavailable');

    await page.goto('/search');
    await page.getByLabel('Query').fill('business license');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('Search failed')).toBeVisible();
    await expect(page.getByText('search backend unavailable').first()).toBeVisible();
  });

  test('qa workbench returns citations for seeded query', async ({ page }) => {
    await login(page);

    await page.goto('/qa');
    await expect(page.getByRole('heading', { name: 'QA Workbench' })).toBeVisible();
    await page.getByRole('button', { name: 'Ask' }).click();
    await expect(page.getByText(/retrievedCount:\s*[1-9]/)).toBeVisible();
    await expect(page.getByRole('table')).toContainText('chunk-1');
  });

  test('qa workbench shows an inline failure prompt when qa backend fails', async ({ page }) => {
    await login(page);
    await mockJsonError(page, '/api/qa/query', 'POST', 503, 'KB-50301', 'qa backend unavailable');

    await page.goto('/qa');
    await page.getByRole('button', { name: 'Ask' }).click();

    await expect(page.getByText('QA request failed')).toBeVisible();
    await expect(page.getByText('qa backend unavailable').first()).toBeVisible();
  });

  test('admin can open the task center and inspect seeded tasks', async ({ page }) => {
    await login(page);

    await page.goto(`/tasks?documentId=${seededDocumentId}`);
    await expect(page.getByRole('heading', { name: 'Task Center' })).toBeVisible();
    await expect(page.getByRole('table')).toContainText(seededDocumentId);
    await expect(page.getByRole('table')).toContainText(/ingest|reparse|batch_import/);
    const firstTaskLink = page.locator('table a[href^="/tasks/"]').first();
    await expect(firstTaskLink).toBeVisible();
    const taskHref = await firstTaskLink.getAttribute('href');
    expect(taskHref).toBeTruthy();

    await firstTaskLink.click();
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page).toHaveURL(taskHref ? new RegExp(`${taskHref}$`) : /\/tasks\//);
  });

  test('task center quick views can focus failed and batch tasks', async ({ page }) => {
    await login(page);

    await page.goto('/tasks');
    await expect(page.getByRole('heading', { name: 'Task Center' })).toBeVisible();
    await page.getByRole('button', { name: 'Failed tasks' }).click();
    await expect(page).toHaveURL(/status=failed/);

    await page.getByRole('button', { name: 'Batch imports' }).click();
    await expect(page).toHaveURL(/taskType=batch_import/);
  });

  test('task center auto refresh can be enabled from quick controls', async ({ page }) => {
    await login(page);

    await page.goto('/tasks');
    await page.getByRole('switch').first().click();
    await expect(page.getByText('Auto refresh is enabled')).toBeVisible();
  });

  test('admin can open the sample task detail page', async ({ page }) => {
    await login(page);

    await page.goto(`/tasks?documentId=${seededDocumentId}`);
    const firstTaskLink = page.locator('table a[href^="/tasks/"]').first();
    await expect(firstTaskLink).toBeVisible();
    const taskHref = await firstTaskLink.getAttribute('href');
    const taskId = taskHref?.replace('/tasks/', '') ?? '';

    expect(taskId).not.toBe('');
    await page.goto(taskHref ?? `/tasks/${taskId}`);
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page.getByText('Task ID:')).toContainText(taskId);
    await expect(page.getByText(/pending|running|success|failed/).first()).toBeVisible();
  });

  test('task detail keeps task list follow-up links visible', async ({ page }) => {
    await login(page);

    await page.goto(`/tasks?documentId=${seededDocumentId}`);
    const firstTaskLink = page.locator('table a[href^="/tasks/"]').first();
    await firstTaskLink.click();

    await expect(page.getByRole('link', { name: /Open .* tasks/ }).first()).toBeVisible();
    await expect(page.getByText('Updated at')).toBeVisible();
  });

  test('admin can open the sample query log detail page', async ({ page }) => {
    await login(page);

    await page.goto(`/query-logs/${sampleQueryLogId}`);
    await expect(page.getByRole('heading', { name: 'Query Log Detail' })).toBeVisible();
    await expect(page.getByText(sampleQueryLogId)).toBeVisible();
    await expect(page.getByRole('table').nth(1)).toContainText('p12');
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

  test('admin can submit a batch import and open the created task', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: 'Batch import' }).click();
    await expect(page.getByRole('dialog', { name: 'Batch import' })).toBeVisible();
    await page.getByLabel('Source type').fill('s3');
    await page.getByLabel('Source URI').fill('s3://playwright/policies');
    await page.getByLabel('Domain').fill('risk');
    await page.getByLabel('Department').fill('automation');
    await page.getByRole('button', { name: 'Submit import' }).click();

    await expect(page.getByText('Batch import request submitted')).toBeVisible();
    const taskLink = page.locator('a[href^="/tasks/"]').filter({ hasText: 'Open task' }).last();
    await expect(taskLink).toBeVisible();
    await taskLink.click();

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page.getByText('batch_import', { exact: true }).first()).toBeVisible();
  });

  test('empty file upload shows a stable failure prompt', async ({ page }) => {
    await login(page);

    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByRole('dialog', { name: 'Upload document' })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'empty-upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.alloc(0),
    });
    await expect(page.getByText('Selected: empty-upload.txt')).toBeVisible();
    await page.getByRole('button', { name: 'Submit upload' }).click();

    await expect(page.getByText('Upload failed')).toBeVisible();
    await expect(page.getByText('uploaded file must not be empty', { exact: true }).first()).toBeVisible();
  });

  test('upload shows an inline failure prompt when ingest submission fails', async ({ page }) => {
    await login(page);
    await mockJsonError(page, '/api/documents/upload', 'POST', 500, 'KB-50020', 'upload storage unavailable');

    await page.getByRole('button', { name: 'Upload' }).click();
    await expect(page.getByRole('dialog', { name: 'Upload document' })).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'upload-failure.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('upload failure case\n'),
    });
    await page.getByLabel('Title').fill('Upload Failure Case');
    await page.getByRole('button', { name: 'Submit upload' }).click();

    await expect(page.getByText('Upload failed')).toBeVisible();
    await expect(page.getByText('upload storage unavailable').first()).toBeVisible();
  });

  test('admin can create a reparse task from document detail', async ({ page }) => {
    await login(page);

    await page.goto(`/documents/${seededDocumentId}`);
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await page.getByLabel('Reason').fill('playwright reparse regression');
    await page.getByRole('button', { name: 'Submit reparse' }).click();

    await expect(page.getByText('Reparse task created', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open task/ })).toBeVisible();
  });

  test('admin can activate the current version through the form', async ({ page }) => {
    await login(page);

    await page.goto(`/documents/${seededDocumentId}`);
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await page.getByRole('button', { name: 'Use current version ID' }).click();
    await page.getByLabel('Remark').fill('playwright activate regression');
    await page.getByRole('button', { name: 'Activate' }).click();

    await expect(page.getByText('Version activation submitted', { exact: true })).toBeVisible();
    await expect(page.getByText(currentVersionId, { exact: true }).first()).toBeVisible();
  });

  test('admin can submit permission binding policies', async ({ page }) => {
    await login(page);

    await page.goto('/permissions');
    await expect(page.getByText('Permission Binding')).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/permissions/bind') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.code).toBe('KB-00000');
    expect(payload.data.policy_count).toBeGreaterThanOrEqual(1);
  });

  test('permission binding shows an inline failure prompt when the backend rejects the request', async ({ page }) => {
    await login(page);
    await mockJsonError(page, '/api/permissions/bind', 'POST', 503, 'KB-50302', 'permission store unavailable');

    await page.goto('/permissions');
    await expect(page.getByText('Permission Binding')).toBeVisible();
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/permissions/bind') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit' }).click();
    await responsePromise;

    await expect(page.getByText('permission store unavailable').first()).toBeVisible({ timeout: 10000 });
  });

  test('missing task id shows an inline failure prompt', async ({ page }) => {
    await login(page);

    await page.goto(`/tasks/${missingTaskId}`);
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page.getByText('Failed to load task')).toBeVisible();
    await expect(page.getByText('task not found')).toBeVisible();
  });

  test('missing query log id shows an inline failure prompt', async ({ page }) => {
    await login(page);

    await page.goto(`/query-logs/${missingQueryLogId}`);
    await expect(page.getByRole('heading', { name: 'Query Log Detail' })).toBeVisible();
    await expect(page.getByText('Failed to load query log')).toBeVisible();
    await expect(page.getByText('query log not found')).toBeVisible();
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
