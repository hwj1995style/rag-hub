import { test, expect } from '@playwright/test';
import { login, mockJsonError, seedInvalidSession } from './helpers';

const seededDocumentId = '11111111-1111-1111-1111-111111111111';
const currentVersionId = '22222222-2222-2222-2222-222222222222';
const sampleQueryLogId = '66666666-6666-6666-6666-666666666666';
const missingTaskId = '99999999-9999-9999-9999-999999999999';
const missingQueryLogId = '77777777-7777-7777-7777-777777777777';

test.describe('rag-hub core regression', () => {
  test('language switcher can toggle to Chinese and persist after reload', async ({ page }) => {
    await page.goto('/login');

    await page.locator('.ant-segmented').first().locator('.ant-segmented-item').nth(1).click();
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('rag-hub-locale'))).toBe('zh-CN');
    await expect.poll(() => page.evaluate(() => document.body.innerText.includes('\u767b\u5f55 rag-hub'))).toBeTruthy();
    await expect.poll(() => page.evaluate(() => document.body.innerText.includes('\u7528\u6237\u540d'))).toBeTruthy();

    await page.reload();
    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('rag-hub-locale'))).toBe('zh-CN');
    await expect.poll(() => page.evaluate(() => document.body.innerText.includes('\u767b\u5f55 rag-hub'))).toBeTruthy();
  });

  test('chinese locale renders menu and qa page labels without question marks', async ({ page }) => {
    await page.goto('/login');
    await page.locator('.ant-segmented').first().locator('.ant-segmented-item').nth(1).click();
    await expect(page.getByRole('heading', { name: '\u767b\u5f55 rag-hub' })).toBeVisible();
    await page.getByLabel('\u7528\u6237\u540d').fill('dockeradmin');
    await page.getByLabel('\u5bc6\u7801').fill('DockerAdmin123!');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/documents$/);

    await expect(page.getByRole('menu')).toContainText('\u95ee\u7b54');
    await expect(page.getByRole('menu')).toContainText('\u6587\u6863');

    await page.goto('/qa');
    await expect(page.getByRole('heading', { name: 'QA \u5de5\u4f5c\u53f0' })).toBeVisible();
    await expect(page.getByText('\u63d0\u95ee')).toBeVisible();
    await expect(page.getByRole('menu')).not.toContainText(/\?{2,}/);
  });

  test('admin can log in and browse documents', async ({ page }) => {
    await login(page);

    await expect(page.getByText(seededDocumentId)).toBeVisible();
    await page.locator(`a[href="/documents/${seededDocumentId}"]`).first().click();
    await expect(page.getByRole('heading', { name: 'Document Detail' })).toBeVisible();
    await expect(page.getByText(currentVersionId)).toBeVisible();
  });


  test('admin can jump from document detail into permission governance', async ({ page }) => {
    await login(page);

    await page.goto(`/documents/${seededDocumentId}`);
    await page.getByText('Manage permissions').click();

    await expect(page).toHaveURL(new RegExp(`/permissions\?resourceType=document&resourceId=${seededDocumentId}`.replace(/\?/g, '\\?')));
    await expect(page.getByText(`resource=document:${seededDocumentId}`)).toBeVisible();
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


  test('viewer sees a permission error on restricted document detail', async ({ page }) => {
    await login(page, 'viewer', 'viewer123');

    await page.goto(`/documents/${seededDocumentId}`);
    await expect(page.getByText('Failed to load document')).toBeVisible();
    await expect(page.getByText('permission denied')).toBeVisible();
  });

  test('viewer search shows no accessible results for restricted documents', async ({ page }) => {
    await login(page, 'viewer', 'viewer123');

    await page.goto('/search');
    await page.getByLabel('Query').fill('business license');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('No accessible results')).toBeVisible();
    await expect(page.getByRole('table')).not.toContainText('chunk-1');
  });

  test('viewer qa shows no accessible evidence for restricted documents', async ({ page }) => {
    await login(page, 'viewer', 'viewer123');

    await page.goto('/qa');
    await page.getByRole('button', { name: 'Ask' }).click();

    await expect(page.getByText('No accessible evidence')).toBeVisible();
    await expect(page.getByText(/retrievedCount:\s*0/)).toBeVisible();
    await expect(page.getByRole('table')).not.toContainText('Customer Credit Policy');
  });  test('search workbench shows an inline failure prompt when search backend fails', async ({ page }) => {
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

  test('admin can browse the query log list and open a detail record', async ({ page }) => {
    await login(page);

    await page.goto('/query-logs');
    await expect(page.getByRole('heading', { name: 'Query Logs' })).toBeVisible();
    await page.getByLabel('Session ID').fill('frontend-session-001');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/sessionId=frontend-session-001/);
    const logLink = page.locator('table a[href^="/query-logs/"]').first();
    await expect(logLink).toBeVisible();
    const href = await logLink.getAttribute('href');
    expect(href).toBeTruthy();
    await logLink.click();
    await expect(page.getByRole('heading', { name: 'Query Log Detail' })).toBeVisible();
    await expect(page).toHaveURL(/\/query-logs\//);
  });

  test('qa workbench links into session query logs', async ({ page }) => {
    await login(page);

    await page.goto('/qa');
    await page.getByRole('button', { name: 'Ask' }).click();
    await expect(page.getByRole('link', { name: 'Open session logs' })).toBeVisible();
    await page.getByRole('link', { name: 'Open session logs' }).click();
    await expect(page).toHaveURL(/\/query-logs\?sessionId=frontend-session-001/);
    await expect(page.getByRole('heading', { name: 'Query Logs' })).toBeVisible();
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
    await expect(page.getByRole('link', { name: 'Open same-source tasks' })).toBeVisible();
    await page.getByRole('link', { name: 'Open same-source tasks' }).click();
    await expect(page).toHaveURL(/taskType=batch_import/);
    await expect(page).toHaveURL(/sourceKeyword=s3%3A%2F%2Fplaywright%2Fpolicies/);
    await expect(page.getByRole('table')).toContainText('s3://playwright/policies');

    const taskLink = page.locator('a[href^="/tasks/"]').first();
    await expect(taskLink).toBeVisible();
    await taskLink.click();

    await expect(page).toHaveURL(/\/tasks\//);
    await expect(page.getByRole('heading', { name: 'Task Detail' })).toBeVisible();
    await expect(page.getByText('batch_import', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Batch import follow-up')).toBeVisible();
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

    await expect(page.getByText('Version activation submitted', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(currentVersionId, { exact: true }).first()).toBeVisible();
  });

  test('admin can submit permission binding policies', async ({ page }) => {
    await login(page);

    await page.goto('/permissions');
    await expect(page.getByText('Permission Binding')).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/permissions/bind') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit policy set' }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.code).toBe('KB-00000');
    expect(payload.data.policy_count).toBeGreaterThanOrEqual(1);
  });

  test('admin can load and delete a single permission policy', async ({ page }) => {
    await login(page);

    await page.goto('/permissions');
    await expect(page.getByText('Permission Binding')).toBeVisible();
    await page.getByTestId('policy-row-subject-type-0').locator('.ant-select-selector').click();
    await page.locator('.ant-select-dropdown:visible [title="user"]').click();
    await page.getByTestId('policy-row-subject-value-0').fill('playwright-delete-check');
    await page.getByTestId('policy-row-effect-0').locator('.ant-select-selector').click();
    await page.locator('.ant-select-dropdown:visible [title="deny"]').click();
    await page.getByRole('button', { name: 'Submit policy set' }).click();

    await expect(page.getByText('Stored 1 policies').first()).toBeVisible();
    await page.getByRole('button', { name: 'Load policies' }).click();
    await expect(page.getByRole('table')).toContainText('playwright-delete-check');

    const row = page.locator('tr').filter({ hasText: 'playwright-delete-check' }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).last().click();

    await expect(page.getByText('Policy deleted').first()).toBeVisible();
    await expect(page.getByRole('table')).not.toContainText('playwright-delete-check');
  });


  test('admin can query permission policies from the subject view', async ({ page }) => {
    await login(page);

    await page.goto(`/permissions?resourceType=document&resourceId=${seededDocumentId}`);
    await page.getByTestId('policy-row-subject-type-0').locator('.ant-select-selector').click();
    await page.locator('.ant-select-dropdown:visible [title="role"]').click();
    await page.getByTestId('policy-row-subject-value-0').fill('playwright-subject-view');
    await page.getByTestId('policy-row-effect-0').locator('.ant-select-selector').click();
    await page.locator('.ant-select-dropdown:visible [title="allow"]').click();
    await page.getByRole('button', { name: 'Submit policy set' }).click();
    await expect(page.getByText('Stored 1 policies').first()).toBeVisible();

    await page.getByTestId('permission-filter-subject-type').locator('.ant-select-selector').click();
    await page.locator('.ant-select-dropdown:visible [title="role"]').click();
    await page.getByTestId('permission-filter-subject-value').fill('playwright-subject-view');
    await page.getByRole('button', { name: 'Load policies' }).click();

    await expect(page).toHaveURL(/subjectType=role/);
    await expect(page).toHaveURL(/subjectValue=playwright-subject-view/);
    await expect(page.getByText('subject=role:playwright-subject-view')).toBeVisible();
    await expect(page.getByRole('table')).toContainText('playwright-subject-view');
  });

  test('permission binding shows an inline failure prompt when the backend rejects the request', async ({ page }) => {
    await login(page);
    await mockJsonError(page, '/api/permissions/bind', 'POST', 503, 'KB-50302', 'permission store unavailable');

    await page.goto('/permissions');
    await expect(page.getByText('Permission Binding')).toBeVisible();
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/permissions/bind') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Submit policy set' }).click();
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
    await login(page, 'viewer', 'viewer123');
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
