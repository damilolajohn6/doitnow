import { changeBooking, getAvailableSlots, getBookingByToken } from '@/lib/bookings';
import { captureServerException } from '@/lib/monitoring-server';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) return Response.json({ ok: false, message: 'Booking not found.' }, { status: 404 });
  const slots =
    booking.status === 'confirmed' ? await getAvailableSlots(new Date().toISOString().slice(0, 10), 21) : [];
  return Response.json({ ok: true, booking, slots }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string; startsAt?: string };
  if (body.action !== 'cancel' && body.action !== 'reschedule') {
    return Response.json({ ok: false, message: 'Unsupported booking action.' }, { status: 400 });
  }
  try {
    const booking = await changeBooking(token, body.action, body.startsAt);
    if (!booking)
      return Response.json({ ok: false, message: 'Booking not found or already closed.' }, { status: 404 });
    return Response.json({ ok: true, booking }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message === 'Choose a new appointment time.' ||
      message === 'That appointment slot is no longer available.'
    ) {
      return Response.json({ ok: false, message }, { status: 409 });
    }
    await captureServerException(error, { route: '/api/bookings/[token]', method: 'PATCH' });
    return Response.json(
      { ok: false, message: 'The booking could not be updated. Please try again.' },
      { status: 500 },
    );
  }
}
