import { getAdminSession } from '@/lib/auth';
import { processEmailOutbox } from '@/lib/email-outbox';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  const result = await processEmailOutbox(50);
  return Response.json({ ok: true, result });
}
