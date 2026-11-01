'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Inbox, LoaderCircle, LogOut, Search } from 'lucide-react';
import type { EnquiryRecord, EnquiryStatus } from '@/lib/enquiries';

const statusOptions: EnquiryStatus[] = ['new', 'contacted', 'closed'];
type StatusFilter = 'all' | EnquiryStatus;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(value));
}

function csvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function EnquiryDashboard({ initialEnquiries }: { initialEnquiries: EnquiryRecord[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialEnquiries);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [updating, setUpdating] = useState('');
  const [message, setMessage] = useState('');

  const counts = useMemo(
    () => ({
      total: items.length,
      new: items.filter((item) => item.status === 'new').length,
      contacted: items.filter((item) => item.status === 'contacted').length,
      closed: items.filter((item) => item.status === 'closed').length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!needle) return true;
      return [
        item.name,
        item.reference,
        item.phone,
        item.email,
        item.location,
        item.projectType,
        item.message,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [filter, items, query]);

  async function updateStatus(id: string, status: EnquiryStatus) {
    setUpdating(id);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as { ok: boolean; enquiry?: EnquiryRecord; message?: string };
      if (!response.ok || !data.ok || !data.enquiry) {
        setMessage(data.message || 'The status could not be updated.');
        return;
      }
      const updated = data.enquiry;
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch {
      setMessage('The connection was interrupted. Please try again.');
    } finally {
      setUpdating('');
    }
  }

  function exportCsv() {
    const headers = [
      'Reference',
      'Created',
      'Status',
      'Name',
      'Phone',
      'Email',
      'Location',
      'Project type',
      'Design',
      'Preferred contact',
      'Message',
    ];
    const rows = filtered.map((item) => [
      item.reference,
      item.createdAt,
      item.status,
      item.name,
      item.phone,
      item.email,
      item.location,
      item.projectType,
      item.design,
      item.preferredContact,
      item.message,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => csvCell(String(value))).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'do-it-now-enquiries.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <span className="section-kicker">DO IT NOW · WORKSPACE</span>
            <h1>Project enquiries</h1>
            <p>Review briefs, follow up with clients and keep the pipeline organised.</p>
          </div>
          <div className="admin-header-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={exportCsv}
              disabled={!filtered.length}
            >
              <Download size={17} /> Export CSV
            </button>
            <button type="button" className="button button-secondary" onClick={logout}>
              <LogOut size={17} /> Sign out
            </button>
          </div>
        </div>

        <div className="admin-stats">
          {(['total', 'new', 'contacted', 'closed'] as const).map((key) => (
            <div key={key}>
              <span>{key === 'total' ? 'Total briefs' : key}</span>
              <strong>{counts[key]}</strong>
            </div>
          ))}
        </div>

        <div className="admin-tools">
          <div className="search-field">
            <Search size={19} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, reference, location…"
              aria-label="Search enquiries"
            />
          </div>
          <fieldset className="category-tabs" aria-label="Filter enquiry status">
            {(['all', ...statusOptions] as StatusFilter[]).map((status) => (
              <button
                key={status}
                type="button"
                className={filter === status ? 'active' : ''}
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
              >
                {status === 'all' ? 'All enquiries' : status}
              </button>
            ))}
          </fieldset>
        </div>
        {message && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}

        {filtered.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Brief</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <span className="admin-reference">{item.reference}</span>
                      {item.phone && <a href={`tel:${item.phone}`}>{item.phone}</a>}
                      {item.email && <a href={`mailto:${item.email}`}>{item.email}</a>}
                      {item.location && <span>{item.location}</span>}
                    </td>
                    <td>
                      <strong>{item.projectType}</strong>
                      {item.design && <span>{item.design.replace(/-/g, ' ')}</span>}
                      <span>Prefer {item.preferredContact.toLowerCase()}</span>
                    </td>
                    <td>
                      <details>
                        <summary>Read project brief</summary>
                        <p>{item.message}</p>
                      </details>
                    </td>
                    <td>
                      <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                    </td>
                    <td>
                      <div className="status-control">
                        {updating === item.id && <LoaderCircle className="spin" size={16} />}
                        <select
                          className={`status-${item.status}`}
                          value={item.status}
                          disabled={updating === item.id}
                          onChange={(event) => updateStatus(item.id, event.target.value as EnquiryStatus)}
                          aria-label={`Status for ${item.reference}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state admin-empty">
            <Inbox size={38} />
            <h3>No enquiries found</h3>
            <p>
              New website briefs will appear here. Adjust the search or status filter if you expected an
              existing record.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
