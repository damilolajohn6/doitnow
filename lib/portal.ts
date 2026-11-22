import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { gmailConfigured, processEmailOutbox, queueEmail } from './email-outbox';
import { listUploads, type UploadRecord } from './file-storage';
import { getProjectBrief, type StudioBrief } from './project-briefs';
import { platformQuery, platformRun } from './platform-store';
import { absoluteUrl } from './site';
import type { EnquiryRecord } from './enquiries';
import type { ProjectProfile, ProjectStage } from './project-shared';

export { projectStages } from './project-shared';
export type { ProjectProfile, ProjectStage } from './project-shared';

export const customerCookieName = 'din_customer_session';
interface EnquiryRow {
  id: string;
  reference: string;
  created_at: string;
  status: EnquiryRecord['status'];
  name: string;
  phone: string;
  email: string;
  location: string;
  project_type: string;
  design: string;
  preferred_contact: 'Phone' | 'Email';
  message: string;
}

function mapEnquiry(row: EnquiryRow): EnquiryRecord {
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

interface ProfileRow {
  enquiry_id: string;
  stage: ProjectStage;
  assigned_to: string;
  follow_up_at: string;
  internal_notes: string;
  approved_at: string;
  revision_notes: string;
  updated_at: string;
}

function mapProfile(row?: ProfileRow): ProjectProfile {
  return {
    stage: row?.stage || 'enquiry',
    assignedTo: row?.assigned_to || '',
    followUpAt: row?.follow_up_at || '',
    internalNotes: row?.internal_notes || '',
    approvedAt: row?.approved_at || '',
    revisionNotes: row?.revision_notes || '',
    updatedAt: row?.updated_at || '',
  };
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestPortalLink(emailInput: string) {
  const parsed = z.string().trim().email().max(160).safeParse(emailInput);
  if (!parsed.success) return { developmentUrl: '' };
  const email = parsed.data.toLowerCase();
  const existing = await platformQuery<{ id: string }>(
    'SELECT id FROM enquiries WHERE LOWER(email) = ? LIMIT 1',
    [email],
  );
  if (!existing[0]) return { developmentUrl: '' };
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  await platformRun("UPDATE portal_tokens SET used_at = ? WHERE LOWER(email) = ? AND used_at = ''", [
    now.toISOString(),
    email,
  ]);
  await platformRun(
    "INSERT INTO portal_tokens (id, email, token_hash, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, '', ?)",
    [
      randomUUID(),
      email,
      hashToken(token),
      new Date(now.getTime() + 30 * 60_000).toISOString(),
      now.toISOString(),
    ],
  );
  const url = absoluteUrl(`/api/portal/verify?token=${token}`);
  if (gmailConfigured()) {
    await queueEmail(email, 'portal-login', email, {
      subject: 'Your Do It Now customer portal link',
      text: `Use this private link within 30 minutes to open your Do It Now customer portal:\n\n${url}\n\nIf you did not request it, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;background:#f7f3eb;color:#252927"><h1 style="color:#9a6b3f;font-size:25px">Your customer portal</h1><p>This private sign-in link expires in 30 minutes.</p><p><a href="${url}" style="color:#9a6b3f;font-weight:bold">Open my projects</a></p><p>If you did not request this link, you can ignore it.</p></div>`,
    });
    await processEmailOutbox(10);
  }
  return { developmentUrl: process.env.PORTAL_DEV_MAGIC_LINKS === 'true' ? url : '' };
}

export async function verifyPortalToken(token: string) {
  const rows = await platformQuery<{ id: string; email: string; expires_at: string; used_at: string }>(
    'SELECT * FROM portal_tokens WHERE token_hash = ? LIMIT 1',
    [hashToken(token)],
  );
  const record = rows[0];
  if (!record || record.used_at || new Date(record.expires_at).getTime() <= Date.now()) return false;
  const now = new Date().toISOString();
  await platformRun("UPDATE portal_tokens SET used_at = ? WHERE id = ? AND used_at = ''", [now, record.id]);
  const session = randomBytes(32).toString('base64url');
  const sessionHash = hashToken(session);
  await platformRun(
    'INSERT INTO portal_sessions (token_hash, email, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [sessionHash, record.email, new Date(Date.now() + 7 * 86_400_000).toISOString(), now],
  );
  const store = await cookies();
  store.set(customerCookieName, session, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 86_400,
  });
  return true;
}

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(customerCookieName)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await platformQuery<{ email: string; expires_at: string }>(
    'SELECT email, expires_at FROM portal_sessions WHERE token_hash = ? LIMIT 1',
    [tokenHash],
  );
  if (!rows[0] || new Date(rows[0].expires_at).getTime() <= Date.now()) return null;
  return { email: rows[0].email, tokenHash };
}

export async function logoutCustomer() {
  const session = await getCustomerSession();
  if (session) await platformRun('DELETE FROM portal_sessions WHERE token_hash = ?', [session.tokenHash]);
  (await cookies()).delete(customerCookieName);
}

export async function listCustomerProjects(email: string) {
  const rows = await platformQuery<EnquiryRow>(
    'SELECT * FROM enquiries WHERE LOWER(email) = LOWER(?) ORDER BY created_at DESC LIMIT 100',
    [email],
  );
  return Promise.all(
    rows.map(async (row) => {
      const profiles = await platformQuery<ProfileRow>(
        'SELECT * FROM project_profiles WHERE enquiry_id = ? LIMIT 1',
        [row.id],
      );
      return { enquiry: mapEnquiry(row), profile: mapProfile(profiles[0]) };
    }),
  );
}

export async function getCustomerProject(email: string, enquiryId: string) {
  const rows = await platformQuery<EnquiryRow>(
    'SELECT * FROM enquiries WHERE id = ? AND LOWER(email) = LOWER(?) LIMIT 1',
    [enquiryId, email],
  );
  if (!rows[0]) return null;
  const enquiry = mapEnquiry(rows[0]);
  const [profiles, brief, files, activities] = await Promise.all([
    platformQuery<ProfileRow>('SELECT * FROM project_profiles WHERE enquiry_id = ? LIMIT 1', [enquiryId]),
    getProjectBrief(enquiryId),
    listUploads(enquiryId),
    platformQuery<{ id: string; actor: string; action: string; note: string; created_at: string }>(
      'SELECT * FROM project_activities WHERE enquiry_id = ? ORDER BY created_at DESC LIMIT 100',
      [enquiryId],
    ),
  ]);
  return {
    enquiry,
    profile: mapProfile(profiles[0]),
    brief: brief as StudioBrief,
    files: files as UploadRecord[],
    activities: activities.map((item) => ({
      id: item.id,
      actor: item.actor,
      action: item.action,
      note: item.note,
      createdAt: item.created_at,
    })),
  };
}

export async function updateCustomerProject(
  email: string,
  enquiryId: string,
  action: 'approve' | 'revision',
  note: string,
) {
  const project = await getCustomerProject(email, enquiryId);
  if (!project) return null;
  const now = new Date().toISOString();
  if (action === 'approve') {
    await platformRun(
      `INSERT INTO project_profiles (enquiry_id, approved_at, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(enquiry_id) DO UPDATE SET approved_at = excluded.approved_at, updated_at = excluded.updated_at`,
      [enquiryId, now, now],
    );
  } else {
    await platformRun(
      `INSERT INTO project_profiles (enquiry_id, revision_notes, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(enquiry_id) DO UPDATE SET revision_notes = excluded.revision_notes, updated_at = excluded.updated_at`,
      [enquiryId, note.slice(0, 2000), now],
    );
  }
  await platformRun(
    'INSERT INTO project_activities (id, enquiry_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [
      randomUUID(),
      enquiryId,
      email,
      action === 'approve' ? 'Design approved' : 'Revision requested',
      note.slice(0, 2000),
      now,
    ],
  );
  return getCustomerProject(email, enquiryId);
}

export async function listAdminProjects() {
  const rows = await platformQuery<EnquiryRow>('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 250');
  return Promise.all(
    rows.map(async (row) => {
      const profiles = await platformQuery<ProfileRow>(
        'SELECT * FROM project_profiles WHERE enquiry_id = ? LIMIT 1',
        [row.id],
      );
      return { enquiry: mapEnquiry(row), profile: mapProfile(profiles[0]) };
    }),
  );
}

export async function updateAdminProject(
  enquiryId: string,
  input: { stage: ProjectStage; assignedTo: string; followUpAt: string; internalNotes: string },
  actor: string,
) {
  const now = new Date().toISOString();
  await platformRun(
    `INSERT INTO project_profiles (enquiry_id, stage, assigned_to, follow_up_at, internal_notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(enquiry_id) DO UPDATE SET stage = excluded.stage, assigned_to = excluded.assigned_to,
       follow_up_at = excluded.follow_up_at, internal_notes = excluded.internal_notes, updated_at = excluded.updated_at`,
    [enquiryId, input.stage, input.assignedTo, input.followUpAt, input.internalNotes, now],
  );
  await platformRun(
    'INSERT INTO project_activities (id, enquiry_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), enquiryId, actor, `Stage updated to ${input.stage}`, '', now],
  );
}
