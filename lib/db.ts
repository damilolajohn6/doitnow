export interface DatabaseAdapter {
  query<T>(statement: string, parameters?: unknown[]): Promise<T[]>;
  run(statement: string, parameters?: unknown[]): Promise<void>;
}

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return import('./db-postgres');
  if (process.env.VERCEL === '1') throw new Error('DATABASE_URL is required on Vercel.');
  return import('./db-sqlite');
}
