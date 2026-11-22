import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminBookings from '@/components/AdminBookings';
import AdminNav from '@/components/AdminNav';
import { isAdminAuthenticated } from '@/lib/auth';
import { listBookings } from '@/lib/bookings';

export const metadata: Metadata = { title: 'Booking Administration', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
  return (
    <>
      <AdminNav />
      <section className="admin-page">
        <div className="container">
          <div className="admin-header">
            <div>
              <span className="section-kicker">ADMIN PRO · CALENDAR</span>
              <h1>Consultation bookings</h1>
              <p>Review appointment details, calendar synchronization, completion and cancellations.</p>
            </div>
          </div>
          <AdminBookings initialBookings={await listBookings()} />
        </div>
      </section>
    </>
  );
}
