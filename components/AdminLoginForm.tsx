'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LockKeyhole } from 'lucide-react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.message || 'Sign-in failed.');
        setPending(false);
        return;
      }
      router.replace('/admin');
      router.refresh();
    } catch {
      setMessage('The connection was interrupted. Please try again.');
      setPending(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <span className="admin-login-icon">
        <LockKeyhole size={26} />
      </span>
      <span className="section-kicker">PROTECTED DASHBOARD</span>
      <h1>Enquiry administration</h1>
      <p>Sign in to review project briefs and update their follow-up status.</p>
      {message && (
        <div className="form-error" role="alert">
          {message}
        </div>
      )}
      <div className="field">
        <label htmlFor="admin-password">Admin password</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <button className="button form-submit" type="submit" disabled={pending || !password}>
        {pending ? (
          <>
            <LoaderCircle className="spin" size={18} /> Signing in…
          </>
        ) : (
          'Sign in securely'
        )}
      </button>
    </form>
  );
}
