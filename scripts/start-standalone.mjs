import path from 'node:path';
import { pathToFileURL } from 'node:url';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
const root = process.cwd();
process.env.NODE_ENV = 'production';
loadEnvConfig(root);
process.env.DO_IT_NOW_DATA_DIR ||= path.join(root, 'data');
process.env.DO_IT_NOW_ASSET_ROOT ||= path.resolve(root, '..');

await import(pathToFileURL(path.join(root, '.next', 'standalone', 'server.js')).href);
