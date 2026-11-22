'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { track } from '@vercel/analytics';
import { ArrowLeft, ArrowRight, Check, FileUp, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import type { Design } from '@/lib/designs';
import { projectTypes } from '@/lib/validation';
import { WHATSAPP_URL } from '@/lib/contact';

const steps = ['Contact', 'Your space', 'Direction', 'Shortlist', 'Brief'];
const roomOptions = [
  'Bedroom',
  'Kitchen',
  'Living / dining',
  'TV wall',
  'Wardrobe',
  'Bathroom',
  'Office',
  'Staircase',
];
const styleOptions = [
  'Warm minimal',
  'Classic and simple',
  'Ivory + walnut',
  'Soft curves',
  'Sage + oak',
  'Darkwood accents',
];
const budgets = [
  'Still exploring',
  'Under ₦1 million',
  '₦1–3 million',
  '₦3–5 million',
  'Above ₦5 million',
  'Prefer to discuss',
];
const timelines = ['Flexible', 'Within 1 month', '1–3 months', '3–6 months', 'Planning ahead'];

interface UploadedFile {
  id: string;
  filename: string;
  sizeBytes: number;
}

export default function ProjectStudio({
  designs,
  initialConfiguration = {},
}: {
  designs: Design[];
  initialConfiguration?: Record<string, unknown>;
}) {
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [briefUrl, setBriefUrl] = useState('');
  const [draftId, setDraftId] = useState(() => crypto.randomUUID());
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [favouritesReady, setFavouritesReady] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    preferredContact: 'Phone',
    projectType: 'Wardrobes',
    rooms: [] as string[],
    dimensions: '',
    budget: budgets[0],
    timeline: timelines[0],
    styles: [] as string[],
    favourites: [] as string[],
    design: '',
    notes: '',
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('do-it-now-favourites') || '[]');
      if (Array.isArray(stored)) {
        setForm((current) => ({
          ...current,
          favourites: stored.filter((item): item is string => typeof item === 'string').slice(0, 6),
        }));
      }
    } catch {
      // A damaged local preference should not block the studio.
    }
    setFavouritesReady(true);
  }, []);

  useEffect(() => {
    if (favouritesReady) localStorage.setItem('do-it-now-favourites', JSON.stringify(form.favourites));
  }, [favouritesReady, form.favourites]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  }

  function toggle(key: 'rooms' | 'styles' | 'favourites', value: string) {
    const current = form[key];
    if (!current.includes(value) && key === 'favourites' && current.length >= 6) {
      setMessage('Shortlist up to six designs.');
      return;
    }
    update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function validateStep() {
    if (step === 0 && (form.name.trim().length < 2 || (!form.email.trim() && !form.phone.trim()))) {
      setMessage('Enter your name and at least one contact method.');
      return false;
    }
    if (step === 1 && !form.projectType) {
      setMessage('Choose a project type.');
      return false;
    }
    if (step === 4 && form.notes.trim().length < 10) {
      setMessage('Add a short project note of at least 10 characters.');
      return false;
    }
    return true;
  }

  async function submit() {
    if (!validateStep()) return;
    setPending(true);
    setMessage('');
    try {
      let currentDraft = draftId;
      const uploadedFiles: UploadedFile[] = [];
      for (const file of files) {
        const body = new FormData();
        body.set('file', file);
        body.set('draftId', currentDraft);
        const response = await fetch('/api/uploads', { method: 'POST', body });
        const data = (await response.json()) as {
          ok: boolean;
          draftId?: string;
          file?: UploadedFile;
          message?: string;
        };
        if (!response.ok || !data.ok || !data.file)
          throw new Error(data.message || `Could not upload ${file.name}.`);
        currentDraft = data.draftId || currentDraft;
        uploadedFiles.push(data.file);
      }
      setDraftId(currentDraft);
      setUploaded(uploadedFiles);
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          location: form.location,
          preferredContact: form.preferredContact,
          projectType: form.projectType,
          design: form.design || form.favourites[0] || '',
          message: form.notes,
          draftId: currentDraft,
          studio: {
            rooms: form.rooms,
            dimensions: form.dimensions,
            budget: form.budget,
            timeline: form.timeline,
            styles: form.styles,
            favourites: form.favourites,
            configuration: initialConfiguration,
          },
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        reference?: string;
        briefUrl?: string;
        message?: string;
      };
      if (!response.ok || !data.ok || !data.reference)
        throw new Error(data.message || 'The brief could not be submitted.');
      setReference(data.reference);
      setBriefUrl(data.briefUrl || '');
      track('project_studio_submit', { projectType: form.projectType, shortlisted: form.favourites.length });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The brief could not be submitted.');
    } finally {
      setPending(false);
    }
  }

  if (reference) {
    return (
      <div className="studio-success">
        <span className="success-icon">
          <Check size={30} />
        </span>
        <span className="section-kicker">PROJECT BRIEF SAVED</span>
        <h2>Your project now has a clear starting point.</h2>
        <p>
          Keep reference <strong>{reference}</strong>. The team can review your brief, shortlist and
          configuration.
        </p>
        {uploaded.length > 0 && (
          <p>
            {uploaded.length} reference file{uploaded.length === 1 ? '' : 's'} attached securely.
          </p>
        )}
        <div className="studio-success-actions">
          {briefUrl && (
            <a className="button" href={briefUrl}>
              Download PDF brief <ArrowRight size={17} />
            </a>
          )}
          <Link className="button button-secondary" href="/book">
            Book a consultation
          </Link>
          <Link className="button button-secondary" href="/portal">
            Open customer portal
          </Link>
          <a className="text-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Continue on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="project-studio">
      <ol className="studio-progress" aria-label="Project brief progress">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? 'active' : index < step ? 'complete' : ''}>
            <span>{index < step ? <Check size={14} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="studio-panel">
        {step === 0 && (
          <section aria-labelledby="studio-contact">
            <span className="section-kicker">STEP 01 · CONTACT</span>
            <h2 id="studio-contact">Who should we talk to?</h2>
            <div className="form-grid">
              <div className="field field-full">
                <label htmlFor="studio-name">Full name</label>
                <input
                  id="studio-name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="studio-email">Email address</label>
                <input
                  id="studio-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label htmlFor="studio-phone">Phone / WhatsApp</label>
                <input
                  id="studio-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  autoComplete="tel"
                />
              </div>
              <div className="field">
                <label htmlFor="studio-location">City / location</label>
                <input
                  id="studio-location"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div className="field">
                <label htmlFor="studio-preference">Preferred contact</label>
                <select
                  id="studio-preference"
                  value={form.preferredContact}
                  onChange={(e) => update('preferredContact', e.target.value)}
                >
                  <option>Phone</option>
                  <option>Email</option>
                </select>
              </div>
            </div>
          </section>
        )}
        {step === 1 && (
          <section aria-labelledby="studio-space">
            <span className="section-kicker">STEP 02 · YOUR SPACE</span>
            <h2 id="studio-space">What are we planning?</h2>
            <div className="field">
              <label htmlFor="studio-project">Primary project type</label>
              <select
                id="studio-project"
                value={form.projectType}
                onChange={(e) => update('projectType', e.target.value)}
              >
                {projectTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <fieldset className="studio-choice-grid">
              <legend>Spaces involved</legend>
              {roomOptions.map((room) => (
                <label key={room} className={form.rooms.includes(room) ? 'selected' : ''}>
                  <input
                    type="checkbox"
                    checked={form.rooms.includes(room)}
                    onChange={() => toggle('rooms', room)}
                  />
                  {room}
                </label>
              ))}
            </fieldset>
            <div className="field">
              <label htmlFor="studio-dimensions">Dimensions, walls and site notes</label>
              <textarea
                id="studio-dimensions"
                rows={5}
                value={form.dimensions}
                onChange={(e) => update('dimensions', e.target.value)}
                placeholder="Approximate sizes are welcome. Include awkward corners, windows or existing fixtures."
              />
            </div>
          </section>
        )}
        {step === 2 && (
          <section aria-labelledby="studio-direction">
            <span className="section-kicker">STEP 03 · DIRECTION</span>
            <h2 id="studio-direction">Set the design context.</h2>
            <fieldset className="studio-choice-grid">
              <legend>Preferred style directions</legend>
              {styleOptions.map((style) => (
                <label key={style} className={form.styles.includes(style) ? 'selected' : ''}>
                  <input
                    type="checkbox"
                    checked={form.styles.includes(style)}
                    onChange={() => toggle('styles', style)}
                  />
                  {style}
                </label>
              ))}
            </fieldset>
            <div className="form-grid studio-two-fields">
              <div className="field">
                <label htmlFor="studio-budget">Indicative budget context</label>
                <select
                  id="studio-budget"
                  value={form.budget}
                  onChange={(e) => update('budget', e.target.value)}
                >
                  {budgets.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="studio-timeline">Desired timeline</label>
                <select
                  id="studio-timeline"
                  value={form.timeline}
                  onChange={(e) => update('timeline', e.target.value)}
                >
                  {timelines.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="studio-note">
              Budget context helps guide scope. It is not a payment request or an automated quotation.
            </p>
          </section>
        )}
        {step === 3 && (
          <section aria-labelledby="studio-shortlist">
            <span className="section-kicker">STEP 04 · SHORTLIST</span>
            <h2 id="studio-shortlist">Choose directions worth discussing.</h2>
            <p>Select up to six. Your shortlist is saved on this device.</p>
            <div className="studio-design-grid">
              {designs.map((design) => (
                <button
                  key={design.slug}
                  type="button"
                  className={form.favourites.includes(design.slug) ? 'selected' : ''}
                  onClick={() => toggle('favourites', design.slug)}
                >
                  <Image
                    src={design.image}
                    alt=""
                    width={400}
                    height={270}
                    unoptimized={design.image.startsWith('http')}
                  />
                  <span>{design.title}</span>
                  <small>{design.category}</small>
                  <i>{form.favourites.includes(design.slug) && <Check size={16} />}</i>
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="studio-primary">Primary catalogue direction (optional)</label>
              <select
                id="studio-primary"
                value={form.design}
                onChange={(e) => update('design', e.target.value)}
              >
                <option value="">No single preference</option>
                {form.favourites.map((slug) => (
                  <option key={slug} value={slug}>
                    {designs.find((item) => item.slug === slug)?.title || slug}
                  </option>
                ))}
              </select>
            </div>
            <Link href="/configurator" className="studio-configurator-link">
              <Sparkles size={20} />
              <span>
                <strong>Open the 3D configurator</strong>Adjust dimensions and finishes, then return with a
                configuration.
              </span>
            </Link>
            {Object.keys(initialConfiguration).length > 0 && (
              <div className="studio-config-summary">
                <strong>3D configuration attached</strong>
                {Object.entries(initialConfiguration).map(([key, value]) => (
                  <span key={key}>
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}
        {step === 4 && (
          <section aria-labelledby="studio-brief">
            <span className="section-kicker">STEP 05 · FINAL BRIEF</span>
            <h2 id="studio-brief">Add the details that make it yours.</h2>
            <div className="field">
              <label htmlFor="studio-notes">Room use, priorities and practical requirements</label>
              <textarea
                id="studio-notes"
                rows={7}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Tell us what the room needs to do, what you want to keep and what should change."
              />
            </div>
            <div className="studio-upload">
              <FileUp size={25} />
              <div>
                <strong>Room photos, inspiration or PDF sketches</strong>
                <p>Up to six files, 4 MB each. JPEG, PNG, WebP or PDF.</p>
              </div>
              <input
                aria-label="Upload room references"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length > 6 || selected.some((file) => file.size > 4 * 1024 * 1024)) {
                    setMessage('Use up to six files, each no larger than 4 MB.');
                    e.target.value = '';
                    return;
                  }
                  setFiles(selected);
                  setMessage('');
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="studio-file-list">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    {file.name}
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {message && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}
        <div className="studio-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={step === 0 || pending}
            onClick={() => {
              setStep((value) => Math.max(0, value - 1));
              setMessage('');
            }}
          >
            <ArrowLeft size={17} /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              className="button"
              onClick={() => {
                if (validateStep()) setStep((value) => value + 1);
              }}
            >
              Continue <ArrowRight size={17} />
            </button>
          ) : (
            <button type="button" className="button" disabled={pending} onClick={submit}>
              {pending ? (
                <>
                  <LoaderCircle className="spin" size={18} /> Building your brief…
                </>
              ) : (
                <>
                  Save my project brief <ArrowRight size={17} />
                </>
              )}
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              className="studio-reset"
              onClick={() => {
                setStep(0);
                setMessage('');
              }}
            >
              <RotateCcw size={15} /> Review from start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
