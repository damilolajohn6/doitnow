'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, LockKeyhole } from 'lucide-react';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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
        body: JSON.stringify({ email, password, code }),
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
      <p>Use the primary owner password, or enter your team email and authenticator code if enabled.</p>
      {message && (
        <div className="form-error" role="alert">
          {message}
        </div>
      )}
      <div className="field">
        <label htmlFor="admin-email">Team email (optional for primary owner)</label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
        />
      </div>
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
      <div className="field">
        <label htmlFor="admin-code">Authenticator code (if enabled)</label>
        <input
          id="admin-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
          autoComplete="one-time-code"
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
