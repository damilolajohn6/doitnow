'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BookingRecord } from '@/lib/bookings';

export default function AdminBookings({ initialBookings }: { initialBookings: BookingRecord[] }) {
  const router = useRouter();
  const [pending, setPending] = useState('');
  async function update(id: string, status: 'cancelled' | 'completed') {
    setPending(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setPending('');
    router.refresh();
  }
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Appointment</th>
            <th>Customer</th>
            <th>Project / contact</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialBookings.map((booking) => (
            <tr key={booking.id}>
              <td>
                <strong>{booking.service}</strong>
                <time>
                  {new Intl.DateTimeFormat('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Africa/Lagos',
                  }).format(new Date(booking.startsAt))}
                </time>
                <span>Africa/Lagos</span>
              </td>
              <td>
                <strong>{booking.name}</strong>
                <a href={`mailto:${booking.email}`}>{booking.email}</a>
                <a href={`tel:${booking.phone}`}>{booking.phone}</a>
              </td>
              <td>
                <span>{booking.enquiryId}</span>
                <span>{booking.googleEventId ? 'Google Calendar synced' : 'Built-in calendar'}</span>
              </td>
              <td>
                <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
              </td>
              <td>
                <div className="admin-inline-actions">
                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={pending === booking.id}
                        onClick={() => update(booking.id, 'completed')}
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={pending === booking.id}
                        onClick={() => update(booking.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {initialBookings.length === 0 && (
        <div className="empty-state">
          <h2>No bookings yet</h2>
          <p>Customer appointments will appear here.</p>
        </div>
      )}
    </div>
  );
}
