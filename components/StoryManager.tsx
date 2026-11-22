'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, FileUp, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import type { StoryInput, StoryRecord } from '@/lib/stories';

const blank: StoryInput = {
  slug: '',
  title: '',
  location: '',
  projectType: '',
  summary: '',
  beforeImage: '',
  beforeAlt: '',
  afterImage: '',
  afterAlt: '',
  challenge: '',
  solution: '',
  outcome: '',
  testimonial: '',
  clientName: '',
  published: false,
};

export default function StoryManager({ items, owner }: { items: StoryRecord[]; owner: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<StoryRecord | undefined>(items[0]);
  const [form, setForm] = useState<StoryInput>(() =>
    items[0] ? { ...items[0].story, published: items[0].published } : blank,
  );
  const [files, setFiles] = useState<{ before: File | null; after: File | null }>({
    before: null,
    after: null,
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  function choose(item?: StoryRecord) {
    setSelected(item);
    setForm(item ? { ...item.story, published: item.published } : blank);
    setFiles({ before: null, after: null });
    setMessage('');
  }
  function update<K extends keyof StoryInput>(key: K, value: StoryInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function upload(kind: 'before' | 'after') {
    const file = files[kind];
    if (!file) return;
    setPending(true);
    setMessage('');
    const body = new FormData();
    body.set('kind', 'story');
    body.set('file', file);
    const response = await fetch('/api/admin/uploads', { method: 'POST', body });
    const data = await response.json();
    if (response.ok && data.ok) {
      update(kind === 'before' ? 'beforeImage' : 'afterImage', `/api/files/${data.file.id}`);
      setFiles((current) => ({ ...current, [kind]: null }));
      setMessage('Image uploaded. Save the story to apply it.');
    } else setMessage(data.message || 'Image upload failed.');
    setPending(false);
  }
  async function save() {
    setPending(true);
    setMessage('');
    const response = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      setSelected({ story: data.story, published: data.published, updatedAt: new Date().toISOString() });
      setMessage(data.published ? 'Project story published.' : 'Project-story draft saved.');
      router.refresh();
    } else setMessage(data.message || 'The story could not be saved.');
    setPending(false);
  }
  async function remove() {
    if (!selected || !window.confirm('Remove this project story permanently?')) return;
    setPending(true);
    const response = await fetch('/api/admin/stories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: selected.story.slug }),
    });
    const data = await response.json();
    setMessage(
      response.ok && data.ok ? 'Project story removed.' : data.message || 'The story could not be removed.',
    );
    if (response.ok && data.ok) choose(undefined);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="admin-workspace-grid story-workspace">
      <section className="admin-record-list">
        <button type="button" className="admin-new-record" onClick={() => choose(undefined)}>
          <Plus size={17} /> New project story
        </button>
        {items.map((item) => (
          <button
            type="button"
            key={item.story.slug}
            className={selected?.story.slug === item.story.slug ? 'active' : ''}
            onClick={() => choose(item)}
          >
            <span>{item.published ? 'Published' : 'Draft'}</span>
            <strong>{item.story.title}</strong>
            <small>{item.story.projectType}</small>
          </button>
        ))}
        {!items.length && (
          <div className="empty-state">
            <p>No stories yet. Add only genuine, permissioned project material.</p>
          </div>
        )}
      </section>
      <section className="admin-editor">
        <div className="admin-section-heading">
          <div>
            <span className="section-kicker">GENUINE PROJECT EVIDENCE</span>
            <h2>{form.title || 'New project story'}</h2>
          </div>
          {form.slug && (
            <a className="text-link" href={`/stories/${form.slug}`} target="_blank" rel="noreferrer">
              <Eye size={16} /> Preview
            </a>
          )}
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="story-title">Story title</label>
            <input id="story-title" value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="story-slug">URL slug</label>
            <input
              id="story-slug"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            />
          </div>
          <div className="field">
            <label htmlFor="story-type">Project type</label>
            <input
              id="story-type"
              value={form.projectType}
              onChange={(e) => update('projectType', e.target.value)}
              placeholder="Kitchen, wardrobe, TV wall…"
            />
          </div>
          <div className="field">
            <label htmlFor="story-location">General location (optional)</label>
            <input
              id="story-location"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Ile-Ife"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="story-summary">Public summary</label>
          <textarea
            id="story-summary"
            rows={3}
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
          />
        </div>
        {(['before', 'after'] as const).map((kind) => {
          const imageKey = kind === 'before' ? 'beforeImage' : 'afterImage';
          const altKey = kind === 'before' ? 'beforeAlt' : 'afterAlt';
          return (
            <fieldset className="story-image-editor" key={kind}>
              <legend>{kind === 'before' ? 'Before evidence' : 'After evidence'}</legend>
              <div className="field">
                <label htmlFor={`story-${kind}-image`}>
                  {kind === 'before' ? 'Before image URL' : 'After image URL'}
                </label>
                <input
                  id={`story-${kind}-image`}
                  value={form[imageKey]}
                  onChange={(e) => update(imageKey, e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`story-${kind}-alt`}>
                  {kind === 'before' ? 'Before image alt text' : 'After image alt text'}
                </label>
                <input
                  id={`story-${kind}-alt`}
                  value={form[altKey]}
                  onChange={(e) => update(altKey, e.target.value)}
                />
              </div>
              {form[imageKey] && (
                <div className="cms-image-preview">
                  <Image
                    src={form[imageKey]}
                    alt={form[altKey] || `${kind} preview`}
                    width={900}
                    height={600}
                    unoptimized={form[imageKey].startsWith('http')}
                  />
                </div>
              )}
              <div className="admin-upload-panel">
                <FileUp size={22} />
                <div>
                  <strong>Upload {kind} photograph</strong>
                  <p>Use a genuine project image with permission. Maximum 4 MB.</p>
                </div>
                <input
                  aria-label={`${kind} project photograph`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) =>
                    setFiles((current) => ({ ...current, [kind]: e.target.files?.[0] || null }))
                  }
                />
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={!files[kind] || pending}
                  onClick={() => upload(kind)}
                >
                  Upload {kind} image
                </button>
              </div>
            </fieldset>
          );
        })}
        <div className="field">
          <label htmlFor="story-challenge">The verified starting condition</label>
          <textarea
            id="story-challenge"
            rows={4}
            value={form.challenge}
            onChange={(e) => update('challenge', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="story-solution">What the team designed and built</label>
          <textarea
            id="story-solution"
            rows={4}
            value={form.solution}
            onChange={(e) => update('solution', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="story-outcome">Verified outcome</label>
          <textarea
            id="story-outcome"
            rows={4}
            value={form.outcome}
            onChange={(e) => update('outcome', e.target.value)}
          />
        </div>
        <div className="story-testimonial-note">
          <strong>Optional client voice</strong>
          <p>
            Publish a testimonial only with the client’s permission and approved attribution. Leave both
            fields empty when none is available.
          </p>
        </div>
        <div className="field">
          <label htmlFor="story-testimonial">Approved testimonial (optional)</label>
          <textarea
            id="story-testimonial"
            rows={4}
            value={form.testimonial}
            onChange={(e) => update('testimonial', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="story-client">Approved client attribution</label>
          <input
            id="story-client"
            value={form.clientName}
            onChange={(e) => update('clientName', e.target.value)}
            placeholder="Required only when a testimonial is included"
          />
        </div>
        <label className="config-toggle">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update('published', e.target.checked)}
          />
          <span>Published on the public website</span>
        </label>
        {message && (
          <div className="portal-message" role="status">
            {message}
          </div>
        )}
        <div className="cms-actions">
          <button type="button" className="button" disabled={pending} onClick={save}>
            {pending ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} Save project story
          </button>
          {owner && selected && (
            <button type="button" className="button button-secondary" disabled={pending} onClick={remove}>
              <Trash2 size={16} /> Remove story
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
