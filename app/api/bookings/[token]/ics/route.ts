import { bookingCalendarFile, getBookingByToken } from '@/lib/bookings';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) return new Response('Not found', { status: 404 });
  return new Response(bookingCalendarFile(booking, token), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="Do-It-Now-${booking.id}.ics"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
