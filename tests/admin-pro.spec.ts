import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test, type Page } from '@playwright/test';
import { totpCode } from '../lib/admin-users';
import { cleanupAdmin, cleanupDesign, cleanupStory } from './qa-helpers';

async function loginOwner(page: Page) {
  const password = process.env.ADMIN_PASSWORD || '';
  test.skip(!password, 'Set ADMIN_PASSWORD to run Admin Pro QA.');
  await page.goto('/admin/login');
  await page.getByLabel('Admin password').fill(password);
  await page.getByRole('button', { name: 'Sign in securely' }).click();
  await page.waitForURL('**/admin');
}

test('owner can publish and unpublish a catalogue design without a deployment', async ({ page }) => {
  const slug = `qa-design-${Date.now()}`;
  const title = `QA Warm Minimal Design ${Date.now()}`;
  try {
    await loginOwner(page);
    await page.goto('/admin/content', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /New design/ }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('URL slug').fill(slug);
    await page.getByLabel('Image alt text').fill('Warm ivory wardrobe with walnut details');
    await page.getByLabel('Card summary').fill('A temporary catalogue publishing verification design.');
    await page
      .getByLabel('Full description')
      .fill('A detailed temporary design used to verify draft and published CMS behaviour before removal.');
    await page.getByLabel('Published on the public catalogue').check();
    const saveResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/admin/designs') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Save design/ }).click();
    expect((await saveResponse).status()).toBe(200);
    const publicPage = await page.request.get(`/designs/${slug}`);
    expect(publicPage.status()).toBe(200);
    expect(await publicPage.text()).toContain(title);
    const catalogue = await page.request.get('/api/designs');
    expect(JSON.stringify(await catalogue.json())).toContain(slug);
    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain(`/designs/${slug}</loc>`);

    await page.getByLabel('Published on the public catalogue').uncheck();
    const draftResponse = page.waitForResponse(
      (response) => response.url().endsWith('/api/admin/designs') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Save design/ }).click();
    expect((await draftResponse).status()).toBe(200);
    const hiddenPage = await page.request.get(`/designs/${slug}`);
    expect(hiddenPage.status()).toBe(404);
  } finally {
    cleanupDesign(slug);
  }
});

test('database admin MFA and role restrictions work, and deactivation revokes sessions', async ({
  page,
  request,
}) => {
  const stamp = Date.now();
  const email = `manager-${stamp}@example.com`;
  const password = `QA-${stamp}-secure-password`;
  try {
    await loginOwner(page);
    const created = await page.request.post('/api/admin/users', {
      data: { email, password, role: 'manager', requireMfa: true },
    });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.credentials.secret).toBeTruthy();
    const login = await request.post('/api/admin/login', {
      headers: { 'x-forwarded-for': '198.51.100.83' },
      data: { email, password, code: totpCode(createdBody.credentials.secret) },
    });
    expect(login.status()).toBe(200);
    expect((await request.get('/api/admin/users')).status()).toBe(403);
    expect((await request.delete('/api/admin/designs', { data: { slug: 'any-design' } })).status()).toBe(403);

    const users = await page.request.get('/api/admin/users');
    const userList = (await users.json()).users as Array<{ id: string; email: string }>;
    const user = userList.find((item) => item.email === email);
    expect(user).toBeTruthy();
    const deactivated = await page.request.patch(`/api/admin/users/${user?.id}`, { data: { active: false } });
    expect(deactivated.status()).toBe(200);
    const revoked = await request.patch('/api/admin/enquiries/not-a-real-id', { data: { status: 'closed' } });
    expect(revoked.status()).toBe(401);
  } finally {
    cleanupAdmin(email);
  }
});

test('enquiry pagination and Admin Pro project-stage editing are usable', async ({ page }) => {
  const stamp = Date.now();
  const prefix = `Pagination QA ${stamp}`;
  const database = new DatabaseSync(path.join(process.cwd(), 'data', 'enquiries.sqlite'));
  database.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  try {
    const insert = database.prepare(
      `INSERT INTO enquiries (id, reference, created_at, status, name, phone, email, location, project_type, design, preferred_contact, message) VALUES (?, ?, ?, 'new', ?, '', ?, 'Ile-Ife', 'Wardrobes', '', 'Email', ?)`,
    );
    for (let index = 0; index < 26; index += 1) {
      const id = randomUUID();
      insert.run(
        id,
        `DIN-QA-${stamp}-${index}`,
        new Date(Date.now() + index * 1000).toISOString(),
        `${prefix} ${index}`,
        `pagination-${stamp}-${index}@example.com`,
        'Temporary pagination and project pipeline test record.',
      );
    }
    await loginOwner(page);
    await page.getByRole('searchbox', { name: 'Search enquiries' }).fill(prefix);
    await expect(page.locator('tbody tr')).toHaveCount(25);
    await expect(page.locator('.admin-pagination')).toContainText('Page 1 of 2');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('.admin-pagination')).toContainText('Page 2 of 2');
    await page.getByRole('button', { name: 'Previous', exact: true }).click();
    await expect(page.locator('tbody tr')).toHaveCount(25);

    await page.goto('/admin/projects', { waitUntil: 'networkidle' });
    await page
      .locator('.admin-record-list button')
      .filter({ hasText: `${prefix} 25` })
      .click();
    await page.getByLabel('Project stage').selectOption('production');
    await page.getByLabel('Assigned to').fill('QA production coordinator');
    await page.getByLabel('Follow-up date').fill('2026-11-15T10:00');
    await page
      .getByLabel('Internal notes')
      .fill('Verify assignment, follow-up and internal-note persistence.');
    await page.getByRole('button', { name: 'Save project profile' }).click();
    await expect(page.getByText('Project profile saved.')).toBeVisible();
    const saved = database
      .prepare(
        'SELECT stage, assigned_to, internal_notes FROM project_profiles WHERE enquiry_id IN (SELECT id FROM enquiries WHERE name = ?)',
      )
      .get(`${prefix} 25`) as { stage: string; assigned_to: string; internal_notes: string };
    expect(saved.stage).toBe('production');
    expect(saved.assigned_to).toBe('QA production coordinator');
    expect(saved.internal_notes).toContain('persistence');
  } finally {
    database
      .prepare('DELETE FROM audit_logs WHERE entity_id IN (SELECT id FROM enquiries WHERE name LIKE ?)')
      .run(`${prefix}%`);
    database.prepare('DELETE FROM enquiries WHERE name LIKE ?').run(`${prefix}%`);
    database.close();
  }
});

test('genuine project-story CMS publishes before-and-after evidence without invented testimonials', async ({
  page,
}) => {
  const stamp = Date.now();
  const slug = `qa-story-${stamp}`;
  const title = `QA Project Story ${stamp}`;
  try {
    await loginOwner(page);
    await page.goto('/admin/stories', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /New project story/ }).click();
    await page.getByLabel('Story title').fill(title);
    await page.getByLabel('URL slug').fill(slug);
    await page.getByLabel('Project type', { exact: true }).fill('Wardrobe and storage');
    await page.getByLabel('General location (optional)').fill('Ile-Ife');
    await page
      .getByLabel('Public summary')
      .fill('Temporary verified story CMS content removed immediately after the automated test.');
    await page.getByLabel('Before image URL').fill('/images/designs/wardrobe-01.webp');
    await page.getByLabel('Before image alt text').fill('Wardrobe starting condition for story test');
    await page.getByLabel('After image URL').fill('/images/designs/wardrobe-02.webp');
    await page.getByLabel('After image alt text').fill('Completed wardrobe direction for story test');
    await page
      .getByLabel('The verified starting condition')
      .fill('The temporary test starting condition contains enough detail for validation.');
    await page
      .getByLabel('What the team designed and built')
      .fill('The temporary test design narrative documents the editable project solution field.');
    await page
      .getByLabel('Verified outcome')
      .fill('The temporary test outcome verifies that genuine project evidence can be published.');
    await page.getByLabel('Published on the public website').check();
    const saved = page.waitForResponse(
      (response) => response.url().endsWith('/api/admin/stories') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Save project story/ }).click();
    expect((await saved).status()).toBe(200);
    const publicStory = await page.request.get(`/stories/${slug}`);
    expect(publicStory.status()).toBe(200);
    const html = await publicStory.text();
    expect(html).toContain(title);
    expect(html).toContain('Before · verified starting condition');
    expect(html).toContain('After · completed project');
    expect(html).not.toContain('story-quote');
    expect(await (await page.request.get('/sitemap.xml')).text()).toContain(`/stories/${slug}</loc>`);
    await page.getByLabel('Published on the public website').uncheck();
    const draft = page.waitForResponse(
      (response) => response.url().endsWith('/api/admin/stories') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Save project story/ }).click();
    expect((await draft).status()).toBe(200);
    expect((await page.request.get(`/stories/${slug}`)).status()).toBe(404);
  } finally {
    cleanupStory(slug);
  }
});
