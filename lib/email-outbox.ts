import { randomUUID } from 'node:crypto';
import { createTransport, type SendMailOptions, type Transporter } from 'nodemailer';
import { buildAdminNotification, buildCustomerAcknowledgement } from './enquiry-email';
import type { EnquiryInput } from './enquiries';
import { platformQuery, platformRun } from './platform-store';

export interface OutboxMessage {
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface OutboxRecord {
  id: string;
  reference: string;
  kind: string;
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  lastError: string;
  createdAt: string;
  sentAt: string;
}

interface OutboxRow {
  id: string;
  reference: string;
  kind: string;
  recipient: string;
  payload: string;
  status: OutboxRecord['status'];
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  last_error: string;
  created_at: string;
  sent_at: string;
}

let transporter: Transporter | undefined;

export function gmailConfigured() {
  return Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
}

function getMailer() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

export async function queueEmail(
  reference: string,
  kind: string,
  recipient: string,
  message: OutboxMessage,
  nextAttemptAt = new Date().toISOString(),
) {
  const id = randomUUID();
  await platformRun(
    `INSERT INTO email_outbox (id, reference, kind, recipient, payload, status, attempts,
      max_attempts, next_attempt_at, last_error, created_at, sent_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, 5, ?, '', ?, '')`,
    [id, reference, kind, recipient, JSON.stringify(message), nextAttemptAt, new Date().toISOString()],
  );
  return id;
}

export async function queueEnquiryEmails(enquiry: EnquiryInput) {
  if (!gmailConfigured()) {
    if (process.env.VERCEL === '1')
      console.warn('Gmail enquiry notifications were skipped because Gmail is not configured.');
    return;
  }
  const sender = process.env.GMAIL_USER?.trim() as string;
  const recipient = process.env.ENQUIRY_NOTIFICATION_EMAIL?.trim() || sender;
  await queueEmail(enquiry.reference, 'enquiry-admin', recipient, {
    ...buildAdminNotification(enquiry),
    replyTo: enquiry.email || undefined,
  });
  if (enquiry.email && process.env.ENQUIRY_SEND_ACKNOWLEDGEMENT !== 'false') {
    await queueEmail(
      enquiry.reference,
      'enquiry-acknowledgement',
      enquiry.email,
      buildCustomerAcknowledgement(enquiry),
    );
  }
  await processEmailOutbox(10);
}

export async function processEmailOutbox(limit = 20) {
  const mailer = getMailer();
  if (!mailer) return { sent: 0, failed: 0, pending: 0 };
  const now = new Date().toISOString();
  const rows = await platformQuery<OutboxRow>(
    "SELECT * FROM email_outbox WHERE status = 'pending' AND next_attempt_at <= ? ORDER BY created_at LIMIT ?",
    [now, Math.min(Math.max(limit, 1), 100)],
  );
  let sent = 0;
  let failed = 0;
  const sender = process.env.GMAIL_USER?.trim() as string;
  for (const row of rows) {
    if (row.kind === 'booking-reminder') {
      const booking = await platformQuery<{ status: string; starts_at: string }>(
        'SELECT status, starts_at FROM bookings WHERE id = ? LIMIT 1',
        [row.reference],
      );
      const currentBooking = booking[0];
      if (currentBooking?.status !== 'confirmed' || currentBooking.starts_at <= now) {
        await platformRun("UPDATE email_outbox SET status = 'cancelled' WHERE id = ?", [row.id]);
        continue;
      }
    }
    try {
      const message = JSON.parse(row.payload) as OutboxMessage;
      const options: SendMailOptions = {
        ...message,
        from: `Do It Now Furniture and Interior <${sender}>`,
        to: row.recipient,
      };
      await mailer.sendMail(options);
      await platformRun(
        "UPDATE email_outbox SET status = 'sent', attempts = attempts + 1, sent_at = ?, last_error = '' WHERE id = ?",
        [new Date().toISOString(), row.id],
      );
      sent += 1;
    } catch (error) {
      const attempts = Number(row.attempts) + 1;
      const exhausted = attempts >= Number(row.max_attempts);
      const delayMinutes = Math.min(2 ** Math.max(0, attempts - 1), 60);
      const next = new Date(Date.now() + delayMinutes * 60_000).toISOString();
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String(error.code).slice(0, 80)
          : 'SMTP_ERROR';
      await platformRun(
        'UPDATE email_outbox SET status = ?, attempts = ?, next_attempt_at = ?, last_error = ? WHERE id = ?',
        [exhausted ? 'failed' : 'pending', attempts, next, code, row.id],
      );
      failed += 1;
      console.error(`Gmail ${row.kind} delivery failed for ${row.reference} [${code}].`);
    }
  }
  const pending = await platformQuery<{ count: number }>(
    "SELECT COUNT(*) AS count FROM email_outbox WHERE status = 'pending'",
  );
  return { sent, failed, pending: Number(pending[0]?.count || 0) };
}

export async function listEmailOutbox(limit = 100): Promise<OutboxRecord[]> {
  const rows = await platformQuery<OutboxRow>('SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT ?', [
    Math.min(Math.max(limit, 1), 250),
  ]);
  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    kind: row.kind,
    recipient: row.recipient,
    status: row.status,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    nextAttemptAt: row.next_attempt_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    sentAt: row.sent_at,
  }));
}

export async function retryEmail(id: string) {
  await platformRun(
    "UPDATE email_outbox SET status = 'pending', next_attempt_at = ?, last_error = '', max_attempts = max_attempts + 2 WHERE id = ?",
    [new Date().toISOString(), id],
  );
  return processEmailOutbox(20);
}

export async function cancelScheduledEmail(reference: string, kind: string) {
  await platformRun(
    "UPDATE email_outbox SET status = 'cancelled' WHERE reference = ? AND kind = ? AND status = 'pending'",
    [reference, kind],
  );
}
