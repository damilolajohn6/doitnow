import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
if (existsSync(path.join(root, '.env.local'))) process.loadEnvFile(path.join(root, '.env.local'));
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Set BLOB_READ_WRITE_TOKEN in .env.local before uploading. Never commit that token.');
  process.exit(1);
}

const collateralRoot = process.env.DO_IT_NOW_ASSET_ROOT || path.resolve(root, '..');
const assets = [
  ['catalogue.pdf', 'Do-It-Now-Catalogue.pdf'],
  ['do-it-now-catalogue-70-a4-pages-14pt.zip', 'Do-It-Now-A4-Pages-14pt.zip'],
  ['do-it-now-catalogue-a3-booklet-illustrator-artboards.zip', 'Do-It-Now-A3-Booklet.zip'],
  ['A5-Flyers-14pt.zip', 'Do-It-Now-A5-Flyers-14pt.zip'],
  ['do-it-now-business-card-front-back-14pt.zip', 'Do-It-Now-Business-Card-Front-Back-14pt.zip'],
  ['logo.png', 'Do-It-Now-Logo.png'],
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: process.env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Vercel CLI exited with status ${code}.`));
    });
  });
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
for (const [sourceName, downloadName] of assets) {
  const source = path.join(collateralRoot, sourceName);
  if (!existsSync(source)) throw new Error(`Missing collateral file: ${source}`);
  console.log(`Uploading ${downloadName}…`);
  await run(npx, [
    '--yes',
    'vercel',
    'blob',
    'put',
    source,
    '--pathname',
    `do-it-now/${downloadName}`,
    '--access',
    'public',
    '--force',
  ]);
}

console.log('\nAll six collateral files were uploaded to public Vercel Blob storage.');
const storeId = process.env.BLOB_STORE_ID?.replace(/^store_/, '');
if (storeId) {
  console.log(`Set DO_IT_NOW_BLOB_BASE_URL=https://${storeId}.public.blob.vercel-storage.com/do-it-now`);
} else {
  console.log('Set DO_IT_NOW_BLOB_BASE_URL=https://<your-store-id>.public.blob.vercel-storage.com/do-it-now');
}
console.log('Add that variable to Vercel Production and Preview, then deploy.');
