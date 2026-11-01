'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Design } from '@/lib/designs';
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react';

const projectTypes = [
  'Wardrobes',
  'Kitchen',
  'Bedroom TV Wall',
  'Bedroom Furniture',
  'Living & Dining',
  'TV Feature Wall',
  'Bathroom',
  'Staircase',
  'Office & Storage',
  'Multiple Spaces',
  'Other',
];

interface FormState {
  name: string;
  phone: string;
  email: string;
  location: string;
  projectType: string;
  design: string;
  preferredContact: string;
  message: string;
  companyWebsite: string;
}

const initialState: FormState = {
  name: '',
  phone: '',
  email: '',
  location: '',
  projectType: '',
  design: '',
  preferredContact: 'Phone',
  message: '',
  companyWebsite: '',
};

type SubmissionStatus = 'idle' | 'submitting' | 'error' | 'success';

export default function EnquiryForm({
  designs,
  initialDesign = '',
}: {
  designs: Design[];
  initialDesign?: string;
}) {
  const [form, setForm] = useState<FormState>({ ...initialState, design: initialDesign });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');

  function update(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, contact: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    setErrors({});

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        errors?: Record<string, string>;
        reference?: string;
      };
      if (!response.ok || !data.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || 'Please check your details and try again.');
        setStatus('error');
        return;
      }
      setReference(data.reference || '');
      setStatus('success');
    } catch {
      setMessage('The connection was interrupted. Please try again or contact us directly.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={44} aria-hidden="true" />
        <span>Enquiry received</span>
        <h3>Thank you, {form.name.split(' ')[0]}.</h3>
        <p>Your project brief has been saved. We’ll contact you using the details you provided.</p>
        {reference && (
          <div className="reference-code">
            Reference <strong>{reference}</strong>
          </div>
        )}
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setForm({ ...initialState });
            setStatus('idle');
            setReference('');
          }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form className="enquiry-form" onSubmit={submit} noValidate>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="companyWebsite">Leave this field empty</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          value={form.companyWebsite}
          onChange={update}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className="form-heading">
        <span>PROJECT ENQUIRY</span>
        <h3>Tell us about your space.</h3>
        <p>
          Share what you know so far. Final dimensions and specifications are confirmed before production.
        </p>
      </div>
      {message && (
        <div className="form-error" role="alert">
          {message}
        </div>
      )}
      <div className="field-grid">
        <div className="field">
          <label htmlFor="name">Full name *</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={update}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <small>{errors.name}</small>}
        </div>
        <div className="field">
          <label htmlFor="location">City / location</label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={update}
            autoComplete="address-level2"
            placeholder="e.g. Ile-Ife"
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={update}
            autoComplete="tel"
            placeholder="0800 000 0000"
            aria-invalid={Boolean(errors.phone || errors.contact)}
          />
          {errors.phone && <small>{errors.phone}</small>}
        </div>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email || errors.contact)}
          />
          {errors.email && <small>{errors.email}</small>}
        </div>
      </div>
      <p className="field-hint">
        Provide at least one contact method: phone or email.{' '}
        {errors.contact && <strong>{errors.contact}</strong>}
      </p>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="projectType">Project type *</label>
          <select
            id="projectType"
            name="projectType"
            value={form.projectType}
            onChange={update}
            aria-invalid={Boolean(errors.projectType)}
          >
            <option value="">Select a space</option>
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.projectType && <small>{errors.projectType}</small>}
        </div>
        <div className="field">
          <label htmlFor="design">Preferred design</label>
          <select id="design" name="design" value={form.design} onChange={update}>
            <option value="">No specific design yet</option>
            {designs.map((design) => (
              <option key={design.slug} value={design.slug}>
                {design.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="contact-preference">
        <legend>Preferred contact method</legend>
        {['Phone', 'Email'].map((method) => (
          <label key={method} className={form.preferredContact === method ? 'selected' : ''}>
            <input
              type="radio"
              name="preferredContact"
              value={method}
              checked={form.preferredContact === method}
              onChange={update}
            />
            {method}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="message">Room details, dimensions and priorities *</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={form.message}
          onChange={update}
          placeholder="Tell us about the room, approximate measurements, storage needs and the design direction you prefer."
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <small>{errors.message}</small>}
      </div>
      <button className="button form-submit" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? (
          <>
            <LoaderCircle className="spin" size={19} /> Saving enquiry…
          </>
        ) : (
          <>
            Send project enquiry <Send size={18} />
          </>
        )}
      </button>
      <p className="privacy-note">Your details are used only to respond to this project enquiry.</p>
    </form>
  );
}
