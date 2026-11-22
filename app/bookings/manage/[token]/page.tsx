import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BookingManager from '@/components/BookingManager';
import { getAvailableSlots, getBookingByToken } from '@/lib/bookings';

export const metadata: Metadata = { title: 'Manage Booking', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();
  const slots =
    booking.status === 'confirmed' ? await getAvailableSlots(new Date().toISOString().slice(0, 10), 21) : [];
  return (
    <section className="section booking-manage-page">
      <div className="container container-narrow">
        <BookingManager token={token} initialBooking={booking} slots={slots} />
      </div>
    </section>
  );
}
