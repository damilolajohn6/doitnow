import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { gmailConfigured, processEmailOutbox, queueEmail, cancelScheduledEmail } from './email-outbox';
import type { EnquiryInput } from './enquiries';
import { saveEnquiry } from './enquiries';
import {
  createGoogleEvent,
  deleteGoogleEvent,
  getGoogleBusyIntervals,
  updateGoogleEvent,
} from './google-calendar';
import { platformQuery, platformRun } from './platform-store';
import { absoluteUrl } from './site';
import { bookingServices, projectTypes } from './validation';

export const bookingInputSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(160).or(z.literal('')).default(''),
    phone: z.string().trim().max(30).default(''),
    service: z.enum(bookingServices),
    projectType: z.enum(projectTypes),
    startsAt: z.string().datetime({ offset: true }),
    notes: z.string().trim().max(1200).default(''),
  })
  .superRefine((value, context) => {
    if (!value.email && !value.phone)
      context.addIssue({ code: 'custom', message: 'Provide an email or phone number.' });
  });

export interface BookingRecord {
  id: string;
  enquiryId: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  startsAt: string;
  endsAt: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  googleEventId: string;
  createdAt: string;
  updatedAt: string;
}

interface BookingRow {
  id: string;
  enquiry_id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  starts_at: string;
  ends_at: string;
  status: BookingRecord['status'];
  manage_token_hash: string;
  google_event_id: string;
  created_at: string;
  updated_at: string;
}

function mapBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    enquiryId: row.enquiry_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    service: row.service,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    status: row.status,
    googleEventId: row.google_event_id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function lagosDate(value: Date) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export async function getAvailableSlots(startDate: string, days = 14) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('Invalid availability date.');
  const safeDays = Math.min(Math.max(Math.trunc(days), 1), 31);
  const first = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(first.getTime())) throw new Error('Invalid availability date.');
  const rangeStart = new Date(`${startDate}T00:00:00+01:00`);
  const rangeEnd = new Date(rangeStart.getTime() + safeDays * 86_400_000);
  const [reserved, googleBusy] = await Promise.all([
    platformQuery<{ starts_at: string }>(
      'SELECT starts_at FROM booking_slots WHERE starts_at >= ? AND starts_at < ?',
      [rangeStart.toISOString(), rangeEnd.toISOString()],
    ),
    getGoogleBusyIntervals(rangeStart.toISOString(), rangeEnd.toISOString()),
  ]);
  const reservedSet = new Set(reserved.map((item) => new Date(item.starts_at).toISOString()));
  const slots: Array<{ start: string; end: string; label: string }> = [];
  const earliest = Date.now() + 24 * 60 * 60 * 1000;
  for (let day = 0; day < safeDays; day += 1) {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + day);
    if (date.getUTCDay() === 0) continue;
    const dateString = date.toISOString().slice(0, 10);
    for (const time of ['09:00', '11:00', '14:00', '16:00']) {
      const start = new Date(`${dateString}T${time}:00+01:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      if (start.getTime() < earliest || reservedSet.has(start.toISOString())) continue;
      const busy = googleBusy.some(
        (interval) => start < new Date(interval.end) && end > new Date(interval.start),
      );
      if (!busy) {
        slots.push({
          start: start.toISOString(),
          end: end.toISOString(),
          label: new Intl.DateTimeFormat('en-NG', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Africa/Lagos',
          }).format(start),
        });
      }
    }
  }
  return slots;
}

function bookingEmail(title: string, booking: BookingRecord, manageUrl: string) {
  const when = new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(booking.startsAt));
  const text = `${title}\n\n${booking.service}\n${when} (Africa/Lagos)\nReference: ${booking.id}\n\nManage this booking: ${manageUrl}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;background:#f7f3eb;color:#252927"><h1 style="color:#9a6b3f;font-size:25px">${title}</h1><p><strong>${booking.service}</strong></p><p>${when} (Africa/Lagos)</p><p>Reference: ${booking.id}</p><p><a href="${manageUrl}" style="color:#9a6b3f;font-weight:bold">Manage this booking</a></p><p>Do It Now Furniture and Interior · +234 701 717 6611</p></div>`;
  return { subject: `${title} — ${booking.service}`, text, html };
}

async function scheduleConfirmation(booking: BookingRecord, token: string, reminder: boolean) {
  if (!booking.email || !gmailConfigured()) return;
  const manageUrl = absoluteUrl(`/bookings/manage/${token}`);
  await queueEmail(
    booking.id,
    'booking-confirmation',
    booking.email,
    bookingEmail('Your Do It Now booking', booking, manageUrl),
  );
  if (reminder && new Date(booking.startsAt).getTime() > Date.now() + 25 * 60 * 60 * 1000) {
    await queueEmail(
      booking.id,
      'booking-reminder',
      booking.email,
      bookingEmail('Reminder: your Do It Now appointment', booking, manageUrl),
      new Date(new Date(booking.startsAt).getTime() - 24 * 60 * 60 * 1000).toISOString(),
    );
  }
  await processEmailOutbox(10);
}

export async function createBooking(input: z.infer<typeof bookingInputSchema>) {
  const value = bookingInputSchema.parse(input);
  const startsAt = new Date(value.startsAt).toISOString();
  const endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
  const available = await getAvailableSlots(lagosDate(new Date(startsAt)), 1);
  if (!available.some((slot) => slot.start === startsAt))
    throw new Error('That appointment slot is no longer available.');
  const id = randomUUID();
  await platformRun('INSERT INTO booking_slots (starts_at, booking_id) VALUES (?, ?)', [startsAt, id]);
  const token = randomBytes(32).toString('base64url');
  const reference = `DIN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const enquiry: EnquiryInput = {
    id: randomUUID(),
    reference,
    createdAt: new Date().toISOString(),
    status: 'new',
    name: value.name,
    phone: value.phone,
    email: value.email,
    location: '',
    projectType: value.projectType,
    design: '',
    preferredContact: value.email ? 'Email' : 'Phone',
    message: `${value.service} requested for ${available.find((slot) => slot.start === startsAt)?.label || startsAt}.${value.notes ? `\n\n${value.notes}` : ''}`,
  };
  try {
    await saveEnquiry(enquiry);
    const now = new Date().toISOString();
    await platformRun(
      `INSERT INTO bookings (id, enquiry_id, name, email, phone, service, starts_at, ends_at,
        status, manage_token_hash, google_event_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, '', ?, ?)`,
      [
        id,
        enquiry.id,
        value.name,
        value.email,
        value.phone,
        value.service,
        startsAt,
        endsAt,
        tokenHash(token),
        now,
        now,
      ],
    );
    await platformRun(
      "INSERT INTO project_profiles (enquiry_id, stage, updated_at) VALUES (?, 'consultation', ?)",
      [enquiry.id, now],
    );
  } catch (error) {
    await platformRun('DELETE FROM booking_slots WHERE starts_at = ?', [startsAt]);
    throw error;
  }
  const row = await platformQuery<BookingRow>('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
  const booking = mapBooking(row[0]);
  try {
    const eventId = await createGoogleEvent({
      name: booking.name,
      service: booking.service,
      start: startsAt,
      end: endsAt,
      reference,
    });
    if (eventId) await platformRun('UPDATE bookings SET google_event_id = ? WHERE id = ?', [eventId, id]);
    await scheduleConfirmation(booking, token, true);
  } catch {
    console.error(`Post-booking integrations require attention for ${id}.`);
  }
  return { booking, manageUrl: `/bookings/manage/${token}`, icsUrl: `/api/bookings/${token}/ics` };
}

export async function getBookingByToken(token: string) {
  const rows = await platformQuery<BookingRow>('SELECT * FROM bookings WHERE manage_token_hash = ? LIMIT 1', [
    tokenHash(token),
  ]);
  return rows[0] ? mapBooking(rows[0]) : null;
}

export async function listBookings(email?: string): Promise<BookingRecord[]> {
  const rows = email
    ? await platformQuery<BookingRow>(
        'SELECT * FROM bookings WHERE LOWER(email) = LOWER(?) ORDER BY starts_at DESC LIMIT 100',
        [email],
      )
    : await platformQuery<BookingRow>('SELECT * FROM bookings ORDER BY starts_at DESC LIMIT 250');
  return rows.map(mapBooking);
}

export async function setBookingStatus(id: string, status: 'cancelled' | 'completed') {
  const rows = await platformQuery<BookingRow>('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  const booking = mapBooking(rows[0]);
  await platformRun('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    new Date().toISOString(),
    id,
  ]);
  if (status === 'cancelled') {
    await platformRun('DELETE FROM booking_slots WHERE booking_id = ?', [id]);
    await cancelScheduledEmail(id, 'booking-reminder');
    try {
      await deleteGoogleEvent(booking.googleEventId);
    } catch {
      console.error(`Google Calendar cancellation requires attention for ${id}.`);
    }
  }
  return { ...booking, status };
}

export async function changeBooking(token: string, action: 'cancel' | 'reschedule', newStart?: string) {
  const booking = await getBookingByToken(token);
  if (booking?.status !== 'confirmed') return null;
  if (action === 'cancel') {
    await platformRun("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?", [
      new Date().toISOString(),
      booking.id,
    ]);
    await platformRun('DELETE FROM booking_slots WHERE booking_id = ?', [booking.id]);
    await cancelScheduledEmail(booking.id, 'booking-reminder');
    try {
      await deleteGoogleEvent(booking.googleEventId);
    } catch {
      console.error(`Google Calendar cancellation requires attention for ${booking.id}.`);
    }
    return { ...booking, status: 'cancelled' as const };
  }
  if (!newStart) throw new Error('Choose a new appointment time.');
  const startsAt = new Date(newStart).toISOString();
  if (startsAt === booking.startsAt) return booking;
  const available = await getAvailableSlots(lagosDate(new Date(startsAt)), 1);
  if (!available.some((slot) => slot.start === startsAt))
    throw new Error('That appointment slot is no longer available.');
  const endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
  await platformRun('INSERT INTO booking_slots (starts_at, booking_id) VALUES (?, ?)', [
    startsAt,
    booking.id,
  ]);
  try {
    await platformRun('UPDATE bookings SET starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?', [
      startsAt,
      endsAt,
      new Date().toISOString(),
      booking.id,
    ]);
    await platformRun('DELETE FROM booking_slots WHERE booking_id = ? AND starts_at = ?', [
      booking.id,
      booking.startsAt,
    ]);
  } catch (error) {
    await platformRun('DELETE FROM booking_slots WHERE booking_id = ? AND starts_at = ?', [
      booking.id,
      startsAt,
    ]);
    throw error;
  }
  await cancelScheduledEmail(booking.id, 'booking-reminder');
  const updated = { ...booking, startsAt, endsAt, updatedAt: new Date().toISOString() };
  try {
    await updateGoogleEvent(booking.googleEventId, startsAt, endsAt);
    await scheduleConfirmation(updated, token, true);
  } catch {
    console.error(`Post-booking integrations require attention for ${booking.id}.`);
  }
  return updated;
}

export function bookingCalendarFile(booking: BookingRecord, token: string) {
  const stamp = (value: string) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const escapeIcs = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const manage = absoluteUrl(`/bookings/manage/${token}`);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Do It Now//Project Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}@do-it-now`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(booking.startsAt)}`,
    `DTEND:${stamp(booking.endsAt)}`,
    `SUMMARY:${escapeIcs(`${booking.service} — Do It Now`)}`,
    `DESCRIPTION:${escapeIcs(`Manage your booking: ${manage}`)}`,
    `STATUS:${booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
