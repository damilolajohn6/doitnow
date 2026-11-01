import { expect, test } from '@playwright/test';

const corePages = [
  { path: '/designs', label: 'Designs', heading: 'Design directions.', schema: 'CollectionPage' },
  { path: '/about', label: 'About', heading: 'Made for the way you live.', schema: 'AboutPage' },
  { path: '/services', label: 'Services', heading: 'One room or a whole plan.', schema: 'WebPage' },
  { path: '/process', label: 'Process', heading: 'A calm route from first measurement.', schema: 'HowTo' },
  { path: '/contact', label: 'Contact', heading: 'Bring the room.', schema: 'ContactPage' },
];

test('all five core pages have unique content, metadata, active navigation and working 3D scenes', async ({
  page,
  request,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  for (const item of corePages) {
    const response = await request.get(item.path);
    expect(response.status(), item.path).toBe(200);
    await page.goto(item.path, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(item.heading);
    await expect(page.locator('.spatial-scene')).toBeVisible();
    await expect(page.locator('.desktop-nav a.active')).toHaveText(item.label);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${item.path}$`));
    const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(structuredData.some((script) => script.includes(`"@type":"${item.schema}"`))).toBe(true);
    const dimensions = await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBe(dimensions.viewport);
  }
  expect(runtimeErrors).toEqual([]);
});

test('service explorer switches content and keeps the active image loaded', async ({ page }) => {
  await page.goto('/services', { waitUntil: 'networkidle' });
  const kitchenButton = page.getByRole('button', { name: /Kitchen design/ });
  await kitchenButton.focus();
  await kitchenButton.press('Enter');
  await expect(page.locator('.service-panel-body h2')).toHaveText('Kitchen design');
  await expect(page.getByRole('link', { name: 'Explore kitchen directions' })).toHaveAttribute(
    'href',
    '/designs/ivory-walnut-kitchen-island',
  );
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll<HTMLImageElement>('.service-panel-image img')];
    return images.filter((image) => image.alt).every((image) => image.complete && image.naturalWidth > 0);
  });
  expect(await page.locator('.service-panel-image img:not([alt=""])').count()).toBe(1);

  await page.getByRole('button', { name: /Wardrobes & storage/ }).click();
  await expect(page.locator('.service-panel-body h2')).toHaveText('Wardrobes & storage');
  await expect(page.locator('.service-panel-body')).toContainText('Internal storage zoning');
});

test('material studio crossfades palettes without blank images and honours reduced motion', async ({
  page,
}) => {
  await page.goto('/about', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Sage \+ oak/ }).click();
  await expect(page.locator('.palette-active-copy h3')).toHaveText('Sage + oak');
  await page.waitForFunction(() => {
    const images = [...document.querySelectorAll<HTMLImageElement>('.palette-image-layer img')];
    return images.filter((image) => image.alt).every((image) => image.complete && image.naturalWidth > 0);
  });
  await expect(page.locator('.palette-active-copy')).toContainText('Muted sage cabinetry');
  expect(await page.locator('.palette-image-layer img:not([alt=""])').count()).toBe(1);

  await page.getByRole('button', { name: /Greige \+ darkwood/ }).click();
  await expect(page.locator('.palette-active-copy h3')).toHaveText('Greige + darkwood');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.scroll-progress')).toHaveCount(0);
  await expect(page.locator('.palette-controls')).toBeVisible();
});

test('process stages and FAQs are interactive and readable', async ({ page }) => {
  await page.goto('/process', { waitUntil: 'networkidle' });
  const buildButton = page.getByRole('button', { name: /Build \+ coordinate/ });
  await buildButton.focus();
  await buildButton.press('Space');
  await expect(page.locator('.process-detail-heading h2')).toHaveText('Build + coordinate');
  await expect(page.locator('.process-alignment')).toContainText(
    'Site readiness and relevant trade coordination',
  );
  await page.getByRole('button', { name: /Next: Install \+ handover/ }).click();
  await expect(page.locator('.process-detail-heading h2')).toHaveText('Install + handover');

  const pricingQuestion = page.getByRole('button', { name: /How is the project price determined/ });
  await pricingQuestion.focus();
  await pricingQuestion.press('Enter');
  await expect(page.locator('#faq-answer-2')).toContainText(
    'Pricing depends on scope, dimensions, materials',
  );
  await pricingQuestion.focus();
  await pricingQuestion.press('Enter');
  await expect(page.locator('.faq-answer')).toHaveCount(0);
});

test('contact page preselects a design and preserves direct contact actions and form styling', async ({
  page,
}) => {
  await page.goto('/contact?design=white-marble-walnut-tv-wall#enquire', { waitUntil: 'networkidle' });
  await expect(page.getByLabel('Preferred design')).toHaveValue('white-marble-walnut-tv-wall');
  await expect(page.getByRole('link', { name: 'Call this line' })).toHaveAttribute(
    'href',
    'tel:+2347017176611',
  );
  await expect(page.getByRole('link', { name: 'Start an email' })).toHaveAttribute(
    'href',
    'mailto:gabdidi52@gmail.com',
  );
  await expect(page.locator('.enquiry-wrap')).toHaveCSS('background-color', 'rgb(247, 243, 235)');
  await expect(page.locator('.enquiry-wrap')).toBeVisible();
});
