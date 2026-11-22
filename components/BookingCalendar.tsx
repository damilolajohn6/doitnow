'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { CalendarCheck, CalendarDays, Check, LoaderCircle } from 'lucide-react';
import { bookingServices, projectTypes } from '@/lib/validation';
import type { BookingRecord } from '@/lib/bookings';

interface Slot {
  start: string;
  end: string;
  label: string;
}

export default function BookingCalendar() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ booking: BookingRecord; manageUrl: string; icsUrl: string } | null>(
    null,
  );
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: bookingServices[0],
    projectType: 'Wardrobes',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/bookings/availability?days=21')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setSlots(data.slots);
      })
      .catch((error) => setMessage(error.message || 'Availability could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!selected) {
      setMessage('Choose an appointment time.');
      return;
    }
    if (form.name.trim().length < 2 || (!form.email && !form.phone)) {
      setMessage('Enter your name and at least one contact method.');
      return;
    }
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, startsAt: selected }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || 'The appointment could not be booked.');
      setResult(data);
      track('consultation_booked', { service: form.service });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The appointment could not be booked.');
    } finally {
      setPending(false);
    }
  }

  if (result)
    return (
      <div className="booking-success">
        <span className="success-icon">
          <Check size={30} />
        </span>
        <span className="section-kicker">APPOINTMENT CONFIRMED</span>
        <h2>Your consultation is in the project calendar.</h2>
        <p>
          <strong>{result.booking.service}</strong>
          <br />
          {new Intl.DateTimeFormat('en-NG', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Africa/Lagos',
          }).format(new Date(result.booking.startsAt))}{' '}
          · Africa/Lagos
        </p>
        <p>
          Save your private management link. Email confirmation and reminders are sent when Gmail is
          configured.
        </p>
        <div className="studio-success-actions">
          <Link className="button" href={result.manageUrl}>
            Manage booking
          </Link>
          <a className="button button-secondary" href={result.icsUrl}>
            Download calendar file
          </a>
          <Link className="text-link" href="/portal">
            Open customer portal
          </Link>
        </div>
      </div>
    );

  return (
    <div className="booking-layout">
      <section className="booking-slots" aria-labelledby="available-times">
        <div className="booking-section-heading">
          <CalendarDays size={25} />
          <div>
            <span className="section-kicker">LIVE AVAILABILITY</span>
            <h2 id="available-times">Choose a suitable hour.</h2>
          </div>
        </div>
        <p>Monday–Saturday, 09:00–16:00 starts · 60 minutes · Africa/Lagos · at least 24 hours ahead.</p>
        {loading ? (
          <div className="configurator-loading">
            <LoaderCircle className="spin" />
            Checking the calendar…
          </div>
        ) : (
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                className={selected === slot.start ? 'selected' : ''}
                onClick={() => {
                  setSelected(slot.start);
                  setMessage('');
                }}
              >
                <CalendarCheck size={17} />
                {slot.label}
              </button>
            ))}
          </div>
        )}
        {!loading && slots.length === 0 && (
          <div className="empty-state">
            <h3>No times are currently available</h3>
            <p>Please check again later or contact us directly on WhatsApp.</p>
          </div>
        )}
      </section>
      <section className="booking-form" aria-labelledby="booking-details">
        <span className="section-kicker">YOUR DETAILS</span>
        <h2 id="booking-details">Confirm the consultation.</h2>
        <div className="field">
          <label htmlFor="booking-service">Appointment type</label>
          <select
            id="booking-service"
            value={form.service}
            onChange={(e) => update('service', e.target.value)}
          >
            {bookingServices.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="booking-project">Project type</label>
          <select
            id="booking-project"
            value={form.projectType}
            onChange={(e) => update('projectType', e.target.value)}
          >
            {projectTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="booking-name">Full name</label>
          <input
            id="booking-name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="booking-email">Email</label>
            <input
              id="booking-email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="booking-phone">Phone</label>
            <input
              id="booking-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="booking-notes">What should we prepare for?</label>
          <textarea
            id="booking-notes"
            rows={4}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
        </div>
        {selected && (
          <div className="booking-selected">
            <strong>Selected time</strong>
            {slots.find((slot) => slot.start === selected)?.label}
          </div>
        )}
        {message && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}
        <button type="button" className="button form-submit" disabled={pending || loading} onClick={submit}>
          {pending ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Reserving…
            </>
          ) : (
            'Confirm appointment'
          )}
        </button>
      </section>
    </div>
  );
}
