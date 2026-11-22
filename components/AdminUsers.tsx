'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, ShieldCheck, UserPlus } from 'lucide-react';
import type { AdminUserRecord } from '@/lib/admin-users';

export default function AdminUsers({ initialUsers }: { initialUsers: AdminUserRecord[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', role: 'manager', requireMfa: true });
  const [credentials, setCredentials] = useState<{ email: string; secret: string; otpauth: string } | null>(
    null,
  );
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  async function create() {
    setPending(true);
    setMessage('');
    setCredentials(null);
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      setCredentials(data.credentials);
      setMessage(
        'Admin created. Share the temporary password and authenticator setup through a secure channel.',
      );
      setForm({ email: '', password: '', role: 'manager', requireMfa: true });
      router.refresh();
    } else setMessage(data.message || 'Admin could not be created.');
    setPending(false);
  }
  async function toggle(id: string, active: boolean) {
    setPending(true);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    setPending(false);
    router.refresh();
  }
  return (
    <div className="admin-users-layout">
      <section className="admin-editor">
        <div className="admin-section-heading">
          <h2>Team accounts</h2>
          <span>{initialUsers.length} database accounts</span>
        </div>
        <div className="admin-user-list">
          {initialUsers.map((user) => (
            <article key={user.id}>
              <ShieldCheck size={22} />
              <div>
                <strong>{user.email}</strong>
                <span>
                  {user.role} · {user.mfaEnabled ? 'TOTP enabled' : 'Password only'}
                </span>
              </div>
              <button
                type="button"
                className="button button-secondary"
                disabled={pending}
                onClick={() => toggle(user.id, !user.active)}
              >
                {user.active ? 'Deactivate' : 'Activate'}
              </button>
            </article>
          ))}
        </div>
        {initialUsers.length === 0 && (
          <div className="empty-state">
            <p>No additional team accounts yet. The primary environment owner can still sign in.</p>
          </div>
        )}
      </section>
      <section className="admin-editor">
        <span className="section-kicker">ADD TEAM MEMBER</span>
        <h2>Create an admin account</h2>
        <div className="field">
          <label htmlFor="new-admin-email">Email</label>
          <input
            id="new-admin-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="new-admin-password">Temporary password (14+ characters)</label>
          <input
            id="new-admin-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="new-admin-role">Role</label>
          <select
            id="new-admin-role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <label className="config-toggle">
          <input
            type="checkbox"
            checked={form.requireMfa}
            onChange={(e) => setForm({ ...form, requireMfa: e.target.checked })}
          />
          <span>Require authenticator-app code</span>
        </label>
        <button
          type="button"
          className="button"
          disabled={pending || form.password.length < 14 || !form.email.includes('@')}
          onClick={create}
        >
          {pending ? <LoaderCircle className="spin" size={17} /> : <UserPlus size={17} />} Create account
        </button>
        {message && <div className="portal-message">{message}</div>}
        {credentials?.secret && (
          <div className="mfa-setup">
            <strong>One-time authenticator setup</strong>
            <p>
              Secret: <code>{credentials.secret}</code>
            </p>
            <label htmlFor="otpauth">Authenticator URI</label>
            <textarea id="otpauth" readOnly rows={4} value={credentials.otpauth} />
          </div>
        )}
      </section>
    </div>
  );
}
