import type { Metadata } from 'next';
import BookingCalendar from '@/components/BookingCalendar';

export const metadata: Metadata = {
  title: 'Book a Design Consultation',
  description:
    'Choose a live design consultation, site measurement or project review appointment with Do It Now. Reschedule or cancel through your private booking link.',
  alternates: { canonical: '/book' },
};

export default function BookPage() {
  return (
    <section className="section booking-page">
      <div className="container">
        <div className="section-heading">
          <span className="section-kicker">CONSULTATION BOOKING</span>
          <h1>Put a useful conversation in the calendar.</h1>
          <p>
            Choose a design consultation, site measurement or project review. No payment is collected on this
            website.
          </p>
        </div>
        <BookingCalendar />
      </div>
    </section>
  );
}
