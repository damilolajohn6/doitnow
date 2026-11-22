import { getAdminSession } from '@/lib/auth';
import { retryEmail } from '@/lib/email-outbox';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  const result = await retryEmail(id);
  return Response.json({ ok: true, result });
}
