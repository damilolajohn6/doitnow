import { getDatabase } from './db';
import { checkEnquiryStore } from './enquiries';

const schema = [
  `CREATE TABLE IF NOT EXISTS project_briefs (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL UNIQUE REFERENCES enquiries(id) ON DELETE CASCADE,
    rooms TEXT NOT NULL DEFAULT '[]',
    dimensions TEXT NOT NULL DEFAULT '',
    budget TEXT NOT NULL DEFAULT '',
    timeline TEXT NOT NULL DEFAULT '',
    styles TEXT NOT NULL DEFAULT '[]',
    favourites TEXT NOT NULL DEFAULT '[]',
    configuration TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    filename TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    url TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    service TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    ends_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    manage_token_hash TEXT NOT NULL UNIQUE,
    google_event_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS booking_slots (
    starts_at TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS portal_tokens (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS portal_sessions (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS project_profiles (
    enquiry_id TEXT PRIMARY KEY REFERENCES enquiries(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'enquiry',
    assigned_to TEXT NOT NULL DEFAULT '',
    follow_up_at TEXT NOT NULL DEFAULT '',
    internal_notes TEXT NOT NULL DEFAULT '',
    approved_at TEXT NOT NULL DEFAULT '',
    revision_notes TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS project_activities (
    id TEXT PRIMARY KEY,
    enquiry_id TEXT NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS design_overrides (
    slug TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS project_stories (
    slug TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager')),
    totp_secret TEXT NOT NULL DEFAULT '',
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS email_outbox (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    kind TEXT NOT NULL,
    recipient TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    next_attempt_at TEXT NOT NULL,
    last_error TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    sent_at TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS uploads_owner_idx ON uploads (owner_id)',
  'CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (email)',
  'CREATE INDEX IF NOT EXISTS bookings_start_idx ON bookings (starts_at)',
  'CREATE INDEX IF NOT EXISTS portal_tokens_email_idx ON portal_tokens (email)',
  'CREATE INDEX IF NOT EXISTS portal_sessions_email_idx ON portal_sessions (email)',
  'CREATE INDEX IF NOT EXISTS project_activities_enquiry_idx ON project_activities (enquiry_id, created_at)',
  'CREATE INDEX IF NOT EXISTS email_outbox_due_idx ON email_outbox (status, next_attempt_at)',
  'CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC)',
];

let initialization: Promise<void> | undefined;

async function initialize() {
  await checkEnquiryStore();
  const database = await getDatabase();
  for (const statement of schema) await database.run(statement);
}

export async function ensurePlatformSchema() {
  if (!initialization) {
    initialization = initialize().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

export async function platformQuery<T>(statement: string, parameters: unknown[] = []): Promise<T[]> {
  await ensurePlatformSchema();
  return (await getDatabase()).query<T>(statement, parameters);
}

export async function platformRun(statement: string, parameters: unknown[] = []): Promise<void> {
  await ensurePlatformSchema();
  await (await getDatabase()).run(statement, parameters);
}
