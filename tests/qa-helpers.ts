import { rmSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

function openDatabase() {
  const database = new DatabaseSync(path.join(process.cwd(), 'data', 'enquiries.sqlite'));
  database.exec('PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  return database;
}

export function cleanupProject(email: string) {
  const database = openDatabase();
  try {
    const enquiries = database
      .prepare('SELECT id, reference FROM enquiries WHERE LOWER(email) = LOWER(?)')
      .all(email) as Array<{ id: string; reference: string }>;
    for (const enquiry of enquiries) {
      database
        .prepare(
          'DELETE FROM booking_slots WHERE booking_id IN (SELECT id FROM bookings WHERE enquiry_id = ?)',
        )
        .run(enquiry.id);
      database
        .prepare(
          'DELETE FROM email_outbox WHERE reference = ? OR reference IN (SELECT id FROM bookings WHERE enquiry_id = ?)',
        )
        .run(enquiry.reference, enquiry.id);
      const uploads = database.prepare('SELECT id FROM uploads WHERE owner_id = ?').all(enquiry.id) as Array<{
        id: string;
      }>;
      for (const upload of uploads)
        rmSync(path.join(process.cwd(), 'data', 'uploads', upload.id), { force: true });
      database.prepare('DELETE FROM uploads WHERE owner_id = ?').run(enquiry.id);
      database
        .prepare('DELETE FROM audit_logs WHERE entity_id = ? OR entity_id = ?')
        .run(enquiry.id, enquiry.reference);
      database.prepare('DELETE FROM enquiries WHERE id = ?').run(enquiry.id);
    }
    database.prepare('DELETE FROM portal_tokens WHERE LOWER(email) = LOWER(?)').run(email);
    database.prepare('DELETE FROM portal_sessions WHERE LOWER(email) = LOWER(?)').run(email);
  } finally {
    database.close();
  }
}

export function cleanupDesign(slug: string) {
  const database = openDatabase();
  try {
    database.prepare('DELETE FROM design_overrides WHERE slug = ?').run(slug);
    database.prepare('DELETE FROM audit_logs WHERE entity_id = ?').run(slug);
  } finally {
    database.close();
  }
}

export function cleanupStory(slug: string) {
  const database = openDatabase();
  try {
    database.prepare('DELETE FROM project_stories WHERE slug = ?').run(slug);
    database.prepare('DELETE FROM audit_logs WHERE entity_id = ?').run(slug);
  } finally {
    database.close();
  }
}

export function cleanupAdmin(email: string) {
  const database = openDatabase();
  try {
    database.prepare('DELETE FROM admin_users WHERE LOWER(email) = LOWER(?)').run(email);
  } finally {
    database.close();
  }
}
