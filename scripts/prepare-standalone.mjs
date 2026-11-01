import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';

if (process.env.VERCEL === '1') {
  console.log('Vercel uses its native Next.js output; standalone asset preparation skipped.');
} else {
  const root = process.cwd();
  const standalone = path.join(root, '.next', 'standalone');
  await mkdir(path.join(standalone, '.next'), { recursive: true });
  await cp(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), {
    recursive: true,
    force: true,
  });
  await cp(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true, force: true });
  console.log('Prepared standalone static and public assets.');
}
