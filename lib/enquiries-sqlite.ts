import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { EnquiryInput, EnquiryRecord, EnquiryStatus } from './enquiries';

interface EnquiryRow {
  id: string;
  reference: string;
  created_at: string;
  status: EnquiryStatus;
  name: string;
  phone: string;
  email: string;
  location: string;
  project_type: string;
  design: string;
  preferred_contact: 'Phone' | 'Email';
  message: string;
}

const dataDirectory = process.env.DO_IT_NOW_DATA_DIR
  ? path.resolve(process.env.DO_IT_NOW_DATA_DIR)
  : path.join(process.cwd(), 'data');
mkdirSync(dataDirectory, { recursive: true });
const database = new DatabaseSync(path.join(dataDirectory, 'enquiries.sqlite'));
database.exec('PRAGMA journal_mode = WAL;');
database.exec('PRAGMA foreign_keys = ON;');
database.exec('PRAGMA busy_timeout = 5000;');
database.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    project_type TEXT NOT NULL,
    design TEXT NOT NULL DEFAULT '',
    preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('Phone', 'Email')),
    message TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);
  CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);
`);

function mapRow(row: EnquiryRow): EnquiryRecord {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: row.created_at,
    status: row.status,
    name: row.name,
    phone: row.phone,
    email: row.email,
    location: row.location,
    projectType: row.project_type,
    design: row.design,
    preferredContact: row.preferred_contact,
    message: row.message,
  };
}

export function saveEnquiry(entry: EnquiryInput): EnquiryRecord {
  database
    .prepare(`
      INSERT INTO enquiries (
        id, reference, created_at, status, name, phone, email, location,
        project_type, design, preferred_contact, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      entry.id,
      entry.reference,
      entry.createdAt,
      entry.status,
      entry.name,
      entry.phone,
      entry.email,
      entry.location,
      entry.projectType,
      entry.design,
      entry.preferredContact,
      entry.message,
    );
  return entry;
}

export function listEnquiries(limit = 250): EnquiryRecord[] {
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  const rows = database
    .prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT ?')
    .all(safeLimit) as unknown as EnquiryRow[];
  return rows.map(mapRow);
}

export function updateEnquiryStatus(id: string, status: EnquiryStatus): EnquiryRecord | null {
  const result = database.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, id);
  if (!result.changes) return null;
  const row = database.prepare('SELECT * FROM enquiries WHERE id = ?').get(id) as unknown as
    | EnquiryRow
    | undefined;
  return row ? mapRow(row) : null;
}

export function checkEnquiryStore(): void {
  database.prepare('SELECT 1').get();
}
