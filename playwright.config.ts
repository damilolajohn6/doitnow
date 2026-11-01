import { defineConfig } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './tests',
  outputDir: './qa/test-results',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npx --yes node@24 node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000',
        url: 'http://127.0.0.1:3000/api/health',
        cwd: process.cwd(),
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
