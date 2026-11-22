'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import type { OutboxRecord } from '@/lib/email-outbox';

interface AuditItem {
  id: string;
  actor: string;
  action: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export default function AdminSystem({ emails, audits }: { emails: OutboxRecord[]; audits: AuditItem[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function run(url: string) {
    setPending(true);
    await fetch(url, { method: 'POST' });
    setPending(false);
    router.refresh();
  }
  return (
    <div className="admin-system-grid">
      <section>
        <div className="admin-section-heading">
          <div>
            <span className="section-kicker">DURABLE EMAIL OUTBOX</span>
            <h2>Delivery and retries</h2>
          </div>
          <button
            type="button"
            className="button button-secondary"
            disabled={pending}
            onClick={() => run('/api/admin/outbox')}
          >
            {pending ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} Process due
            emails
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id}>
                  <td>
                    <strong>{email.kind}</strong>
                    <span>{email.reference}</span>
                    <time>{new Date(email.createdAt).toLocaleString('en-NG')}</time>
                  </td>
                  <td>{email.recipient}</td>
                  <td>
                    <span className={`booking-status status-${email.status}`}>{email.status}</span>
                    {email.lastError && <small>{email.lastError}</small>}
                  </td>
                  <td>
                    {email.attempts} / {email.maxAttempts}
                  </td>
                  <td>
                    {email.status !== 'sent' && email.status !== 'cancelled' && (
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={pending}
                        onClick={() => run(`/api/admin/outbox/${email.id}`)}
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {emails.length === 0 && (
            <div className="empty-state">
              <p>No email messages have been queued.</p>
            </div>
          )}
        </div>
      </section>
      <aside className="audit-panel">
        <span className="section-kicker">AUDIT LOG</span>
        <h2>Administrative activity</h2>
        <ol>
          {audits.map((item) => (
            <li key={item.id}>
              <strong>{item.action}</strong>
              <span>{item.actor}</span>
              <small>
                {item.entity_id}
                {item.details ? ` · ${item.details}` : ''}
              </small>
              <time>{new Date(item.created_at).toLocaleString('en-NG')}</time>
            </li>
          ))}
        </ol>
        {audits.length === 0 && <p>Admin actions will be recorded here.</p>}
      </aside>
    </div>
  );
}
