import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test } from '@playwright/test';

test('a project enquiry can be submitted, reviewed, updated, exported and signed out', async ({
  page,
  request,
}) => {
  const password = process.env.ADMIN_PASSWORD || '';
  test.skip(!password, 'Set ADMIN_PASSWORD to run the authenticated workflow.');

  const testName = `Browser QA ${Date.now()}`;
  try {
    await page.goto('/contact?design=white-marble-walnut-tv-wall#enquire', { waitUntil: 'networkidle' });
    await expect(page.getByLabel('Preferred design')).toHaveValue('white-marble-walnut-tv-wall');
    await page.getByLabel(/Full name/).fill(testName);
    await page.getByLabel('Phone number').fill('+234 800 000 0000');
    await page.getByLabel('City / location').fill('Ile-Ife');
    await page.getByLabel(/Project type/).selectOption('TV Feature Wall');
    await page
      .getByLabel(/Room details, dimensions and priorities/)
      .fill('Browser verification of the 9 ft by 101 in TV wall and door-free open shelves.');
    await page.getByRole('button', { name: /Send project enquiry/ }).click();
    await expect(page.getByText('Enquiry received')).toBeVisible();
    const reference = (await page.locator('.reference-code strong').textContent()) || '';
    expect(reference).toMatch(/^DIN-/);

    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.getByLabel('Admin password').fill(password);
    await page.getByRole('button', { name: 'Sign in securely' }).click();
    await page.waitForURL('**/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Project enquiries' })).toBeVisible();

    const row = page.locator('tbody tr').filter({ hasText: reference });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(testName);
    await expect(row.locator('select')).toHaveValue('new');

    const csvEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const csvDownload = await csvEvent;
    expect(csvDownload.suggestedFilename()).toBe('do-it-now-enquiries.csv');
    const csvPath = await csvDownload.path();
    expect(csvPath).toBeTruthy();
    const csv = await readFile(csvPath as string, 'utf8');
    expect(csv).toContain(reference);
    expect(csv).toContain(testName);

    const updateEvent = page.waitForResponse(
      (response) =>
        response.url().includes('/api/admin/enquiries/') && response.request().method() === 'PATCH',
    );
    await row.locator('select').selectOption('contacted');
    expect((await updateEvent).status()).toBe(200);
    await expect(row.locator('select')).toHaveValue('contacted');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/admin/login');
    await page.goto('/admin', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/admin\/login$/);

    const unauthenticatedUpdate = await request.patch('/api/admin/enquiries/not-a-real-id', {
      data: { status: 'closed' },
    });
    expect(unauthenticatedUpdate.status()).toBe(401);
  } finally {
    const database = new DatabaseSync(path.join(process.cwd(), 'data', 'enquiries.sqlite'));
    database.exec('PRAGMA busy_timeout = 5000;');
    database.prepare('DELETE FROM enquiries WHERE name = ?').run(testName);
    database.close();
  }
});
