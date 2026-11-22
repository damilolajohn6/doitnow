'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, FileUp, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react';
import { categories, type Design, type DesignCategory } from '@/lib/designs';

export interface CmsItem {
  design: Design;
  published: boolean;
  custom: boolean;
  updatedAt: string;
}
interface EditorState extends Omit<Design, 'facts' | 'materials' | 'planning'> {
  facts: string;
  materials: string;
  planning: string;
  published: boolean;
}

function editorValue(item?: CmsItem): EditorState {
  const design = item?.design;
  return {
    slug: design?.slug || '',
    title: design?.title || '',
    category: design?.category || 'Living & Dining',
    image: design?.image || '/images/designs/living-01.webp',
    alt: design?.alt || '',
    summary: design?.summary || '',
    description: design?.description || '',
    facts: design?.facts.join('\n') || 'Made to measure',
    materials: design?.materials.join('\n') || 'Material confirmed with the client',
    planning: design?.planning.join('\n') || 'Confirm actual site dimensions before production.',
    lighting: design?.lighting || 'Layer warm ambient and task lighting.',
    published: item?.published ?? false,
  };
}

export default function CmsManager({ items, owner }: { items: CmsItem[]; owner: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<CmsItem | undefined>(items[0]);
  const [form, setForm] = useState<EditorState>(() => editorValue(items[0]));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  function choose(item?: CmsItem) {
    setSelected(item);
    setForm(editorValue(item));
    setMessage('');
    setImageFile(null);
  }
  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function uploadImage() {
    if (!imageFile) return;
    setPending(true);
    setMessage('');
    const body = new FormData();
    body.set('file', imageFile);
    body.set('kind', 'design');
    const response = await fetch('/api/admin/uploads', { method: 'POST', body });
    const data = await response.json();
    if (response.ok && data.ok) {
      update('image', `/api/files/${data.file.id}`);
      setMessage('Image uploaded. Save the design to publish this change.');
      setImageFile(null);
    } else setMessage(data.message || 'Image upload failed.');
    setPending(false);
  }
  async function save() {
    setPending(true);
    setMessage('');
    const response = await fetch('/api/admin/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        facts: form.facts.split('\n').filter(Boolean),
        materials: form.materials.split('\n').filter(Boolean),
        planning: form.planning.split('\n').filter(Boolean),
      }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      setMessage(form.published ? 'Design published and public pages revalidated.' : 'Draft saved.');
      setSelected({
        design: data.design,
        published: data.published,
        custom: true,
        updatedAt: new Date().toISOString(),
      });
      router.refresh();
    } else setMessage(data.message || 'Design could not be saved.');
    setPending(false);
  }
  async function remove() {
    if (
      !selected ||
      !window.confirm('Remove this CMS override? The approved base design will be restored where one exists.')
    )
      return;
    setPending(true);
    const response = await fetch('/api/admin/designs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: selected.design.slug }),
    });
    const data = await response.json();
    setMessage(
      response.ok && data.ok ? 'CMS override removed.' : data.message || 'Override could not be removed.',
    );
    setPending(false);
    router.refresh();
  }
  return (
    <div className="admin-workspace-grid cms-workspace">
      <section className="admin-record-list">
        <button type="button" className="admin-new-record" onClick={() => choose(undefined)}>
          <Plus size={17} /> New design
        </button>
        {items.map((item) => (
          <button
            key={item.design.slug}
            type="button"
            className={selected?.design.slug === item.design.slug ? 'active' : ''}
            onClick={() => choose(item)}
          >
            <span>{item.published ? 'Published' : 'Draft'}</span>
            <strong>{item.design.title}</strong>
            <small>{item.design.category}</small>
          </button>
        ))}
      </section>
      <section className="admin-editor cms-editor">
        <div className="admin-section-heading">
          <div>
            <span className="section-kicker">CONTENT MANAGEMENT</span>
            <h2>{form.title || 'New design'}</h2>
          </div>
          {form.slug && (
            <a className="text-link" href={`/designs/${form.slug}`} target="_blank" rel="noreferrer">
              <Eye size={16} /> Preview
            </a>
          )}
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="cms-title">Title</label>
            <input id="cms-title" value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cms-slug">URL slug</label>
            <input
              id="cms-slug"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="unique-design-slug"
            />
          </div>
          <div className="field">
            <label htmlFor="cms-category">Category</label>
            <select
              id="cms-category"
              value={form.category}
              onChange={(e) => update('category', e.target.value as DesignCategory)}
            >
              {categories.slice(1).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cms-image">Image URL</label>
            <input id="cms-image" value={form.image} onChange={(e) => update('image', e.target.value)} />
          </div>
        </div>
        <div className="admin-upload-panel">
          <FileUp size={22} />
          <div>
            <strong>Upload catalogue image</strong>
            <p>Public JPEG, PNG or WebP, maximum 4 MB.</p>
          </div>
          <input
            aria-label="CMS image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            className="button button-secondary"
            disabled={!imageFile || pending}
            onClick={uploadImage}
          >
            Upload image
          </button>
        </div>
        {form.image && (
          <div className="cms-image-preview">
            <Image
              src={form.image}
              alt="Design preview"
              width={900}
              height={600}
              unoptimized={form.image.startsWith('http')}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="cms-alt">Image alt text</label>
          <input id="cms-alt" value={form.alt} onChange={(e) => update('alt', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="cms-summary">Card summary</label>
          <textarea
            id="cms-summary"
            rows={3}
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cms-description">Full description</label>
          <textarea
            id="cms-description"
            rows={5}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="cms-facts">Facts (one per line)</label>
            <textarea
              id="cms-facts"
              rows={5}
              value={form.facts}
              onChange={(e) => update('facts', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="cms-materials">Materials (one per line)</label>
            <textarea
              id="cms-materials"
              rows={5}
              value={form.materials}
              onChange={(e) => update('materials', e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cms-planning">Planning guidance (one per line)</label>
          <textarea
            id="cms-planning"
            rows={5}
            value={form.planning}
            onChange={(e) => update('planning', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cms-lighting">Lighting guidance</label>
          <textarea
            id="cms-lighting"
            rows={3}
            value={form.lighting}
            onChange={(e) => update('lighting', e.target.value)}
          />
        </div>
        <label className="config-toggle">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => update('published', e.target.checked)}
          />
          <span>Published on the public catalogue</span>
        </label>
        {message && (
          <div className="portal-message" role="status">
            {message}
          </div>
        )}
        <div className="cms-actions">
          <button type="button" className="button" disabled={pending} onClick={save}>
            {pending ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} Save design
          </button>
          {owner && selected && (
            <button type="button" className="button button-secondary" disabled={pending} onClick={remove}>
              <Trash2 size={16} /> Remove override
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
