import { expect, test } from '@playwright/test';
import { designs } from '../lib/designs';

test('homepage renders brand content, metadata and structured data without runtime errors', async ({
  page,
  request,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN');
  expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(response.headers()['permissions-policy']).toContain('camera=()');

  await page.goto('/');
  await expect(page).toHaveTitle('Do It Now Furniture and Interior | Design. Build. Deliver.');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Furniture that');
  await expect(page.locator('.design-card')).toHaveCount(9);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /https?:\/\//);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-do-it-now\.jpg/);

  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(scripts.length).toBeGreaterThanOrEqual(2);
  for (const script of scripts) {
    const data = JSON.parse(script) as { '@type'?: string; '@graph'?: Array<{ '@type'?: string }> };
    expect(data['@type'] || data['@graph']?.length).toBeTruthy();
  }

  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const brokenImages = await page.locator('img').evaluateAll((elements) => {
    const images = elements as HTMLImageElement[];
    return images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src);
  });
  expect(brokenImages).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('catalogue category filtering and search return the expected designs', async ({ page }) => {
  await page.goto('/#designs', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Kitchens', exact: true }).click();
  await expect(page.locator('.design-card')).toHaveCount(6);
  await expect(page.locator('.results-status')).toHaveText('6 designs');

  const search = page.getByRole('searchbox', { name: 'Search designs' });
  await search.fill('Ivory + Walnut Kitchen + Island');
  await expect(page.locator('.design-card')).toHaveCount(1);
  await expect(page.locator('.design-card h3')).toHaveText('Ivory + Walnut Kitchen + Island');

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.locator('.design-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.design-card')).toHaveCount(9);
  await page.getByRole('button', { name: 'Show more designs' }).click();
  await expect(page.locator('.design-card')).toHaveCount(18);
});

test('mobile navigation opens, closes and has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.getByRole('link', { name: 'Designs', exact: true }).last().click();
  await expect(page.locator('#mobile-navigation')).toBeHidden();
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBe(dimensions.viewport);
});

test('all 26 design pages and SEO routes are available', async ({ request }) => {
  for (const design of designs) {
    const response = await request.get(`/designs/${design.slug}`);
    expect(response.status(), design.slug).toBe(200);
    expect(await response.text()).toContain(design.title);
  }

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  const sitemapXml = await sitemap.text();
  for (const path of ['/designs', '/services', '/about', '/process', '/contact']) {
    expect(sitemapXml).toContain(`${path}</loc>`);
  }
  expect((sitemapXml.match(/<loc>/g) || []).length).toBe(32);
  for (const design of designs) expect(sitemapXml).toContain(`/designs/${design.slug}</loc>`);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');

  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.status()).toBe(200);
  const manifestData = (await manifest.json()) as {
    name: string;
    icons: Array<{ src: string; sizes: string }>;
  };
  expect(manifestData.name).toContain('Do It Now');
  expect(manifestData.icons.map((icon) => icon.sizes)).toEqual(['192x192', '512x512']);

  const socialImage = await request.get('/images/og-do-it-now.jpg');
  expect(socialImage.status()).toBe(200);
  expect(socialImage.headers()['content-type']).toBe('image/jpeg');
});

test('health, validation, honeypot and rate-limit APIs behave safely', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ ok: true, service: 'Do It Now web', designs: 26, downloads: 6 });

  const invalid = await request.post('/api/enquiries', {
    headers: { 'x-forwarded-for': '198.51.100.10' },
    data: {},
  });
  expect(invalid.status()).toBe(400);
  const invalidBody = (await invalid.json()) as { ok: boolean; errors: Record<string, string> };
  expect(invalidBody.ok).toBe(false);
  expect(invalidBody.errors.name).toBeTruthy();
  expect(invalidBody.errors.message).toBeTruthy();

  const honeypot = await request.post('/api/enquiries', {
    headers: { 'x-forwarded-for': '198.51.100.11' },
    data: { companyWebsite: 'https://spam.invalid' },
  });
  expect(honeypot.status()).toBe(200);
  expect(await honeypot.json()).toEqual({ ok: true, reference: null });

  const throttleAddress = '198.51.100.12';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.post('/api/enquiries', {
      headers: { 'x-forwarded-for': throttleAddress },
      data: {},
    });
    expect(response.status()).toBe(400);
  }
  const throttled = await request.post('/api/enquiries', {
    headers: { 'x-forwarded-for': throttleAddress },
    data: {},
  });
  expect(throttled.status()).toBe(429);
  expect(Number(throttled.headers()['retry-after'])).toBeGreaterThan(0);
});

test('every approved collateral download is served with the correct disposition', async ({ request }) => {
  const downloads = [
    ['catalogue', 'application/pdf', 'Do-It-Now-Catalogue.pdf'],
    ['a4-pages', 'application/zip', 'Do-It-Now-A4-Pages-14pt.zip'],
    ['a3-booklet', 'application/zip', 'Do-It-Now-A3-Booklet.zip'],
    ['a5-flyers', 'application/zip', 'Do-It-Now-A5-Flyers-14pt.zip'],
    ['business-card', 'application/zip', 'Do-It-Now-Business-Card-Front-Back-14pt.zip'],
    ['logo', 'image/png', 'Do-It-Now-Logo.png'],
  ] as const;

  for (const [asset, contentType, filename] of downloads) {
    const response = await request.get(`/api/downloads/${asset}`);
    expect(response.status(), asset).toBe(200);
    expect(response.headers()['content-type']).toBe(contentType);
    expect(response.headers()['content-disposition']).toContain(`attachment; filename="${filename}"`);
    expect((await response.body()).byteLength).toBeGreaterThan(1000);
  }

  const inline = await request.get('/api/downloads/catalogue?inline=1');
  expect(inline.headers()['content-disposition']).toContain('inline;');
  const missing = await request.get('/api/downloads/not-a-real-file');
  expect(missing.status()).toBe(404);
});
