import { createHash, timingSafeEqual } from 'node:crypto';
import { processEmailOutbox } from '@/lib/email-outbox';
import { platformRun } from '@/lib/platform-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(value: string, expected: string) {
  const left = createHash('sha256').update(value).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || '';
  if (process.env.VERCEL === '1' && !secret) {
    return Response.json({ ok: false, message: 'CRON_SECRET is required.' }, { status: 503 });
  }
  if (secret) {
    const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!authorized(supplied, secret))
      return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }
  const now = new Date().toISOString();
  const email = await processEmailOutbox(50);
  await platformRun('DELETE FROM portal_sessions WHERE expires_at <= ?', [now]);
  await platformRun(
    "DELETE FROM portal_tokens WHERE expires_at <= ? OR (used_at != '' AND created_at <= ?)",
    [now, new Date(Date.now() - 86_400_000).toISOString()],
  );
  await platformRun(
    "UPDATE bookings SET status = 'completed', updated_at = ? WHERE status = 'confirmed' AND ends_at <= ?",
    [now, now],
  );
  await platformRun('DELETE FROM booking_slots WHERE starts_at <= ?', [
    new Date(Date.now() - 86_400_000).toISOString(),
  ]);
  return Response.json({ ok: true, email, completedAt: now }, { headers: { 'Cache-Control': 'no-store' } });
}
