import { getAdminSession } from '@/lib/auth';
import { setBookingStatus } from '@/lib/bookings';
import { recordAudit } from '@/lib/catalogue';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (body.status !== 'cancelled' && body.status !== 'completed')
    return Response.json({ ok: false, message: 'Unsupported status.' }, { status: 400 });
  const booking = await setBookingStatus(id, body.status);
  if (!booking) return Response.json({ ok: false, message: 'Booking not found.' }, { status: 404 });
  await recordAudit(session.email, `Marked booking ${body.status}`, id);
  return Response.json({ ok: true, booking });
}
