import { neon } from '@neondatabase/serverless';
import type { DatabaseAdapter } from './db';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) throw new Error('DATABASE_URL is not configured.');
const sql = neon(connectionString);

function postgresStatement(statement: string) {
  let index = 0;
  return statement.replace(/\?/g, () => `$${++index}`);
}

export async function query<T>(statement: string, parameters: unknown[] = []): Promise<T[]> {
  return (await sql.query(postgresStatement(statement), parameters as never[])) as unknown as T[];
}

export async function run(statement: string, parameters: unknown[] = []): Promise<void> {
  await sql.query(postgresStatement(statement), parameters as never[]);
}

export const adapter: DatabaseAdapter = { query, run };
export default adapter;
