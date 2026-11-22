import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { DatabaseAdapter } from './db';

const directory = process.env.DO_IT_NOW_DATA_DIR
  ? path.resolve(process.env.DO_IT_NOW_DATA_DIR)
  : path.join(process.cwd(), 'data');
mkdirSync(directory, { recursive: true });
const database = new DatabaseSync(path.join(directory, 'enquiries.sqlite'));
database.exec('PRAGMA journal_mode = WAL;');
database.exec('PRAGMA busy_timeout = 5000;');
database.exec('PRAGMA foreign_keys = ON;');

export async function query<T>(statement: string, parameters: unknown[] = []): Promise<T[]> {
  return database.prepare(statement).all(...(parameters as never[])) as unknown as T[];
}

export async function run(statement: string, parameters: unknown[] = []): Promise<void> {
  database.prepare(statement).run(...(parameters as never[]));
}

export const adapter: DatabaseAdapter = { query, run };
export default adapter;
