'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import type { BookingRecord } from '@/lib/bookings';

interface Slot {
  start: string;
  end: string;
  label: string;
}

export default function BookingManager({
  token,
  initialBooking,
  slots,
}: {
  token: string;
  initialBooking: BookingRecord;
  slots: Slot[];
}) {
  const router = useRouter();
  const [booking, setBooking] = useState(initialBooking);
  const [selected, setSelected] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  async function update(action: 'cancel' | 'reschedule') {
    setPending(true);
    setMessage('');
    const response = await fetch(`/api/bookings/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, startsAt: selected || undefined }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) setMessage(data.message || 'The booking could not be updated.');
    else {
      setBooking(data.booking);
      setSelected('');
      router.refresh();
    }
    setPending(false);
  }
  const when = new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(booking.startsAt));
  return (
    <div className="booking-manager">
      <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
      <h1>{booking.service}</h1>
      <p className="booking-when">{when} · Africa/Lagos</p>
      <p>
        Booking reference: <strong>{booking.id}</strong>
      </p>
      <a className="button button-secondary" href={`/api/bookings/${token}/ics`}>
        Download calendar file
      </a>
      {booking.status === 'confirmed' && (
        <>
          <section className="booking-reschedule">
            <h2>Reschedule</h2>
            <div className="field">
              <label htmlFor="new-booking-time">Choose a new available time</label>
              <select id="new-booking-time" value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">Select a time</option>
                {slots.map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="button"
              disabled={!selected || pending}
              onClick={() => update('reschedule')}
            >
              {pending ? <LoaderCircle className="spin" /> : 'Save new time'}
            </button>
          </section>
          <section className="booking-cancel">
            <h2>Need to cancel?</h2>
            <p>The reserved slot will be released and any scheduled reminder cancelled.</p>
            <button
              type="button"
              className="button button-secondary"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Cancel this appointment?')) update('cancel');
              }}
            >
              Cancel appointment
            </button>
          </section>
        </>
      )}
      {message && (
        <div className="form-error" role="alert">
          {message}
        </div>
      )}
    </div>
  );
}
