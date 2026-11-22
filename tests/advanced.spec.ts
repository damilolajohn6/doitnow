import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { designs } from '../lib/designs';
import { cleanupProject } from './qa-helpers';

const pdfFixture = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

test('Studio creates a PDF brief and the customer can use the private portal', async ({ page, request }) => {
  test.setTimeout(120_000);
  const stamp = Date.now();
  const email = `studio-${stamp}@example.com`;
  const uploadName = `qa-room-${stamp}.pdf`;
  const portalUploadName = `qa-revision-${stamp}.pdf`;
  try {
    const config = { mode: 'wardrobe', width: 2.13, height: 2.49, doors: 3, shelves: 4, overhead: true };
    await page.goto(`/studio?config=${encodeURIComponent(JSON.stringify(config))}`, {
      waitUntil: 'networkidle',
    });
    await page.getByLabel('Full name').fill(`Advanced Studio QA ${stamp}`);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Phone / WhatsApp').fill('+234 800 000 0000');
    await page.getByLabel('City / location').fill('Ile-Ife');
    await page.getByLabel('Preferred contact').selectOption('Email');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByLabel('Bedroom', { exact: true }).check();
    await page.getByLabel('Wardrobe', { exact: true }).check();
    await page
      .getByLabel('Dimensions, walls and site notes')
      .fill(
        'Room 1 wardrobe: 7 ft wide by 8 ft 2 in high; maximum three main doors with separate overheads.',
      );
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByLabel('Warm minimal', { exact: true }).check();
    await page.getByLabel('Classic and simple', { exact: true }).check();
    await page.getByLabel('Indicative budget context').selectOption('Prefer to discuss');
    await page.getByLabel('Desired timeline').selectOption('1–3 months');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.locator('.studio-design-grid button').first().click();
    await expect(page.locator('.studio-config-summary')).toContainText('3D configuration attached');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page
      .getByLabel('Room use, priorities and practical requirements')
      .fill('Simpler and cleaner internal storage with separate overhead cabinets and no payment workflow.');
    await page
      .getByLabel('Upload room references')
      .setInputFiles({ name: uploadName, mimeType: 'application/pdf', buffer: pdfFixture });
    await page.getByRole('button', { name: /Save my project brief/ }).click();
    await expect(page.locator('.studio-success')).toBeVisible({ timeout: 30_000 });
    const reference = (await page.locator('.studio-success strong').first().textContent()) || '';
    expect(reference).toMatch(/^DIN-/);
    const briefUrl = await page.getByRole('link', { name: /Download PDF brief/ }).getAttribute('href');
    expect(briefUrl).toBeTruthy();
    const pdf = await request.get(briefUrl as string);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toContain('application/pdf');
    expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
    expect((await pdf.body()).byteLength).toBeGreaterThan(2000);

    const linkResponse = await request.post('/api/portal/request-link', {
      headers: { 'x-forwarded-for': '198.51.100.81' },
      data: { email },
    });
    expect(linkResponse.status()).toBe(200);
    const linkBody = await linkResponse.json();
    expect(linkBody.developmentUrl).toBeTruthy();
    const development = new URL(linkBody.developmentUrl);
    await page.goto(`${development.pathname}${development.search}`);
    await page.waitForURL('**/portal');
    const card = page.locator('.portal-project-card').filter({ hasText: reference });
    await expect(card).toHaveCount(1);
    await card.click();
    await expect(page.locator('.portal-project-header')).toContainText(reference);

    await page
      .getByLabel('Approval note or revision request')
      .fill('Please retain three main doors and simplify the internal shelf spacing.');
    await page.getByRole('button', { name: /Request revision/ }).click();
    await expect(page.getByText('Revision request recorded.')).toBeVisible();
    await page
      .getByLabel('Customer project file')
      .setInputFiles({ name: portalUploadName, mimeType: 'application/pdf', buffer: pdfFixture });
    await page.getByRole('button', { name: /Upload securely/ }).click();
    await expect(page.getByText(`${portalUploadName} was added to this project.`)).toBeVisible();
    const privateFile = page.locator('.portal-file-list a').filter({ hasText: portalUploadName });
    await expect(privateFile).toHaveCount(1);
    const privateHref = await privateFile.getAttribute('href');
    expect(privateHref).toBeTruthy();
    const allowedFile = await page.context().request.get(privateHref as string);
    expect(allowedFile.status()).toBe(200);
    const deniedFile = await request.get(privateHref as string);
    expect(deniedFile.status()).toBe(404);

    await page.getByRole('button', { name: /Approve current design/ }).click();
    await expect(page.getByText('Design approval recorded.')).toBeVisible();
    await expect(page.locator('.project-approval h2')).toHaveText('Design approved');
    await page.goto('/portal');
    await page.getByRole('button', { name: /Sign out/ }).click();
    await expect(page.locator('.portal-login')).toBeVisible();
  } finally {
    cleanupProject(email);
  }
});

test('booking rejects conflicts, reschedules, serves ICS and releases a cancelled slot', async ({
  page,
  request,
}) => {
  test.setTimeout(90_000);
  const stamp = Date.now();
  const email = `booking-${stamp}@example.com`;
  try {
    const availability = await request.get('/api/bookings/availability?days=21');
    expect(availability.status()).toBe(200);
    const { slots } = await availability.json();
    expect(slots.length).toBeGreaterThan(2);
    await page.goto('/book', { waitUntil: 'networkidle' });
    await page.locator(`.slot-grid button`).first().click();
    await page.getByLabel('Full name').fill(`Advanced Booking QA ${stamp}`);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Phone', { exact: true }).fill('+234 800 000 0000');
    await page
      .getByLabel('What should we prepare for?')
      .fill('Classic TV wall with a standing door-free open-shelf tower.');
    await page.getByRole('button', { name: 'Confirm appointment' }).click();
    await expect(page.locator('.booking-success')).toBeVisible({ timeout: 30_000 });
    const manageUrl = await page.getByRole('link', { name: 'Manage booking' }).getAttribute('href');
    expect(manageUrl).toBeTruthy();
    const token = (manageUrl as string).split('/').pop() as string;

    const conflict = await request.post('/api/bookings', {
      headers: { 'x-forwarded-for': '198.51.100.82' },
      data: {
        name: 'Conflicting QA',
        email: '',
        phone: '+2348000000000',
        service: 'Design consultation',
        projectType: 'TV Feature Wall',
        startsAt: slots[0].start,
        notes: '',
      },
    });
    expect(conflict.status()).toBe(409);

    await page.goto(manageUrl as string, { waitUntil: 'networkidle' });
    await page.getByLabel('Choose a new available time').selectOption(slots[1].start);
    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/bookings/${token}`) && response.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: 'Save new time' }).click();
    expect((await updateResponse).status()).toBe(200);
    const ics = await request.get(`/api/bookings/${token}/ics`);
    expect(ics.status()).toBe(200);
    expect(await ics.text()).toContain('BEGIN:VCALENDAR');
    const cancelled = await request.patch(`/api/bookings/${token}`, { data: { action: 'cancel' } });
    expect(cancelled.status()).toBe(200);
    expect((await cancelled.json()).booking.status).toBe('cancelled');
    const released = await request.get('/api/bookings/availability?days=21');
    const releasedSlots = (await released.json()).slots as Array<{ start: string }>;
    expect(releasedSlots.some((slot) => slot.start === slots[1].start)).toBe(true);
  } finally {
    cleanupProject(email);
  }
});

test('3D configurator changes mode and exports a real configuration', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/configurator', { waitUntil: 'networkidle' });
  await expect(page.locator('.configurator-canvas canvas')).toBeVisible();
  await page.getByRole('tab', { name: 'TV feature wall' }).click();
  await expect(page.locator('.configurator-controls h2')).toHaveText('TV-wall study');
  await page.getByRole('button', { name: 'Warm walnut' }).click();
  await expect(page.getByRole('button', { name: 'Warm walnut' })).toHaveClass(/active/);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export specification/ }).click();
  const download = await downloadEvent;
  const data = JSON.parse(await readFile((await download.path()) as string, 'utf8'));
  expect(data.mode).toBe('tv');
  expect(data.finish).toBe('walnut');
  expect(data.width).toBeGreaterThan(1);
  await page.getByRole('button', { name: /Use in Project Studio/ }).click();
  await page.waitForURL(/\/studio\?config=/);
  const config = JSON.parse(new URL(page.url()).searchParams.get('config') || '{}');
  expect(config.mode).toBe('tv');
  expect(errors).toEqual([]);
});

test('concierge returns only published catalogue recommendations and offers WhatsApp handoff', async ({
  page,
}) => {
  await page.goto('/concierge', { waitUntil: 'networkidle' });
  const responseEvent = page.waitForResponse((response) => response.url().endsWith('/api/concierge'));
  await page.getByRole('button', { name: 'I want a classic TV wall with open shelves.' }).click();
  const response = await responseEvent;
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.recommendations.length).toBeGreaterThan(0);
  for (const recommendation of body.recommendations) {
    expect(designs.some((design) => design.slug === recommendation.slug)).toBe(true);
  }
  expect(body.answer).not.toContain('₦');
  await expect(page.locator('.concierge-recommendations a').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Continue with the design team on WhatsApp/ })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/2347017176611/,
  );
});

test('advanced public workflows have no mobile horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/studio', '/configurator', '/book', '/concierge', '/stories', '/portal']) {
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, path).toBe(dimensions.viewport);
  }
});
