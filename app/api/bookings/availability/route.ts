import { getAvailableSlots } from '@/lib/bookings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const start = parameters.get('start') || new Date().toISOString().slice(0, 10);
  const days = Number(parameters.get('days') || 14);
  try {
    const slots = await getAvailableSlots(start, Number.isFinite(days) ? days : 14);
    return Response.json({ ok: true, slots }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { ok: false, message: 'Appointment availability is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
