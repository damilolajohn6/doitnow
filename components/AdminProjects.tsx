'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, LoaderCircle } from 'lucide-react';
import type { EnquiryRecord } from '@/lib/enquiries';
import { projectStages, type ProjectProfile, type ProjectStage } from '@/lib/project-shared';

export interface AdminProjectItem {
  enquiry: EnquiryRecord;
  profile: ProjectProfile;
}

export default function AdminProjects({ initialProjects }: { initialProjects: AdminProjectItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<AdminProjectItem | null>(initialProjects[0] || null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  function updateProfile<K extends keyof ProjectProfile>(key: K, value: ProjectProfile[K]) {
    setSelected((current) =>
      current ? { ...current, profile: { ...current.profile, [key]: value } } : current,
    );
  }
  async function save() {
    if (!selected) return;
    setPending(true);
    setMessage('');
    const response = await fetch(`/api/admin/projects/${selected.enquiry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selected.profile),
    });
    const data = await response.json();
    setMessage(
      response.ok && data.ok ? 'Project profile saved.' : data.message || 'Project could not be saved.',
    );
    setPending(false);
    router.refresh();
  }
  async function upload() {
    if (!selected || !file) return;
    setPending(true);
    setMessage('');
    const body = new FormData();
    body.set('file', file);
    body.set('kind', 'portal');
    body.set('ownerId', selected.enquiry.id);
    const response = await fetch('/api/admin/uploads', { method: 'POST', body });
    const data = await response.json();
    setMessage(
      response.ok && data.ok
        ? `${data.file.filename} is now available in the customer portal.`
        : data.message || 'Upload failed.',
    );
    if (response.ok) setFile(null);
    setPending(false);
  }
  return (
    <div className="admin-workspace-grid">
      <section className="admin-record-list">
        <div className="admin-section-heading">
          <h2>Project pipeline</h2>
          <span>{initialProjects.length} records</span>
        </div>
        {initialProjects.map((item) => (
          <button
            key={item.enquiry.id}
            type="button"
            className={selected?.enquiry.id === item.enquiry.id ? 'active' : ''}
            onClick={() => setSelected(item)}
          >
            <span>{item.enquiry.reference}</span>
            <strong>{item.enquiry.name}</strong>
            <small>
              {item.enquiry.projectType} · {item.profile.stage}
            </small>
          </button>
        ))}
      </section>
      <section className="admin-editor">
        {selected ? (
          <>
            <div className="admin-section-heading">
              <div>
                <span className="section-kicker">{selected.enquiry.reference}</span>
                <h2>{selected.enquiry.name}</h2>
              </div>
              <a className="text-link" href={`/api/project-briefs/${selected.enquiry.reference}/pdf`}>
                Download brief
              </a>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="project-stage">Project stage</label>
                <select
                  id="project-stage"
                  value={selected.profile.stage}
                  onChange={(e) => updateProfile('stage', e.target.value as ProjectStage)}
                >
                  {projectStages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="project-assigned">Assigned to</label>
                <input
                  id="project-assigned"
                  value={selected.profile.assignedTo}
                  onChange={(e) => updateProfile('assignedTo', e.target.value)}
                  placeholder="Team member or email"
                />
              </div>
              <div className="field">
                <label htmlFor="project-followup">Follow-up date</label>
                <input
                  id="project-followup"
                  type="datetime-local"
                  value={selected.profile.followUpAt}
                  onChange={(e) => updateProfile('followUpAt', e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="project-notes">Internal notes</label>
              <textarea
                id="project-notes"
                rows={6}
                value={selected.profile.internalNotes}
                onChange={(e) => updateProfile('internalNotes', e.target.value)}
              />
            </div>
            {selected.profile.revisionNotes && (
              <div className="admin-customer-note">
                <strong>Customer revision request</strong>
                <p>{selected.profile.revisionNotes}</p>
              </div>
            )}
            {selected.profile.approvedAt && (
              <p className="admin-approved">
                Design approved by customer: {new Date(selected.profile.approvedAt).toLocaleString('en-NG')}
              </p>
            )}
            <button type="button" className="button" disabled={pending} onClick={save}>
              {pending ? <LoaderCircle className="spin" size={17} /> : 'Save project profile'}
            </button>
            {message && (
              <div className="portal-message" role="status">
                {message}
              </div>
            )}
            <div className="admin-upload-panel">
              <FileUp size={24} />
              <div>
                <strong>Add a customer portal document</strong>
                <p>Proposals, drawings, reference images or care guides. Maximum 4 MB.</p>
              </div>
              <input
                aria-label="Portal document"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="button button-secondary"
                disabled={!file || pending}
                onClick={upload}
              >
                Upload to portal
              </button>
            </div>
            <details className="admin-original-brief">
              <summary>Read original enquiry</summary>
              <p>{selected.enquiry.message}</p>
              <a href={`mailto:${selected.enquiry.email}`}>{selected.enquiry.email}</a>
            </details>
          </>
        ) : (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>New enquiries will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
