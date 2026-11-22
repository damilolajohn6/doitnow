'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle, MessageSquareText } from 'lucide-react';

export default function ProjectApproval({
  projectId,
  approvedAt,
}: {
  projectId: string;
  approvedAt: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  async function update(action: 'approve' | 'revision') {
    if (action === 'revision' && note.trim().length < 5) {
      setMessage('Describe the revision you need.');
      return;
    }
    setPending(true);
    setMessage('');
    const response = await fetch(`/api/portal/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) setMessage(data.message || 'The project could not be updated.');
    else {
      setMessage(action === 'approve' ? 'Design approval recorded.' : 'Revision request recorded.');
      setNote('');
      router.refresh();
    }
    setPending(false);
  }
  return (
    <section className="project-approval">
      <span className="section-kicker">DESIGN REVIEW</span>
      <h2>{approvedAt ? 'Design approved' : 'Review and respond'}</h2>
      {approvedAt && (
        <p>
          Approved{' '}
          {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeZone: 'Africa/Lagos' }).format(
            new Date(approvedAt),
          )}
          . You can still request a revision for the team to review.
        </p>
      )}
      <div className="field">
        <label htmlFor="revision-note">Approval note or revision request</label>
        <textarea
          id="revision-note"
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add context for the design team."
        />
      </div>
      {message && (
        <div className="portal-message" role="status">
          {message}
        </div>
      )}
      <div className="project-approval-actions">
        <button type="button" className="button" disabled={pending} onClick={() => update('approve')}>
          {pending ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />} Approve current design
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={pending}
          onClick={() => update('revision')}
        >
          <MessageSquareText size={17} /> Request revision
        </button>
      </div>
    </section>
  );
}
