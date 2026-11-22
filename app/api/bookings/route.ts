import { bookingInputSchema, createBooking } from '@/lib/bookings';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'booking'), 6, 60 * 60 * 1000);
  if (throttle.unavailable)
    return Response.json({ ok: false, message: 'Booking protection is unavailable.' }, { status: 503 });
  if (!throttle.allowed)
    return Response.json({ ok: false, message: 'Too many booking attempts. Please wait.' }, { status: 429 });
  const parsed = bookingInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { ok: false, message: 'Check your contact details and appointment.' },
      { status: 400 },
    );
  try {
    const result = await createBooking(parsed.data);
    return Response.json({ ok: true, ...result }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The booking could not be created.';
    const conflict =
      message.includes('no longer available') ||
      message.includes('duplicate') ||
      message.includes('UNIQUE constraint');
    return Response.json(
      {
        ok: false,
        message: conflict
          ? 'That appointment slot is no longer available.'
          : 'The booking could not be completed. Please try again.',
      },
      { status: conflict ? 409 : 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
