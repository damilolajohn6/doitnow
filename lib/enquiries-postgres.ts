import { neon } from '@neondatabase/serverless';
import type { EnquiryInput, EnquiryRecord, EnquiryStatus } from './enquiries';

interface EnquiryRow {
  id: string;
  reference: string;
  created_at: string | Date;
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

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) throw new Error('DATABASE_URL is not configured.');
const sql = neon(connectionString);

let initialization: Promise<void> | undefined;

function ensureSchema() {
  if (!initialization) {
    initialization = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS enquiries (
          id TEXT PRIMARY KEY,
          reference TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
          name TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          email TEXT NOT NULL DEFAULT '',
          location TEXT NOT NULL DEFAULT '',
          project_type TEXT NOT NULL,
          design TEXT NOT NULL DEFAULT '',
          preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('Phone', 'Email')),
          message TEXT NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status)`;
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

function mapRow(row: EnquiryRow): EnquiryRecord {
  return {
    id: row.id,
    reference: row.reference,
    createdAt: new Date(row.created_at).toISOString(),
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

export async function saveEnquiry(entry: EnquiryInput): Promise<EnquiryRecord> {
  await ensureSchema();
  await sql`
    INSERT INTO enquiries (
      id, reference, created_at, status, name, phone, email, location,
      project_type, design, preferred_contact, message
    ) VALUES (
      ${entry.id}, ${entry.reference}, ${entry.createdAt}, ${entry.status}, ${entry.name},
      ${entry.phone}, ${entry.email}, ${entry.location}, ${entry.projectType}, ${entry.design},
      ${entry.preferredContact}, ${entry.message}
    )
  `;
  return entry;
}

export async function listEnquiries(limit = 250): Promise<EnquiryRecord[]> {
  await ensureSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
  const rows = (await sql`
    SELECT * FROM enquiries ORDER BY created_at DESC LIMIT ${safeLimit}
  `) as unknown as EnquiryRow[];
  return rows.map(mapRow);
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<EnquiryRecord | null> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE enquiries SET status = ${status} WHERE id = ${id} RETURNING *
  `) as unknown as EnquiryRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function checkEnquiryStore(): Promise<void> {
  await ensureSchema();
  await sql`SELECT 1`;
}
