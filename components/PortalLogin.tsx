'use client';

import { useState } from 'react';
import { LoaderCircle, Mail } from 'lucide-react';

export default function PortalLogin({ error = '' }: { error?: string }) {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [developmentUrl, setDevelopmentUrl] = useState('');
  async function submit() {
    setPending(true);
    setMessage('');
    setDevelopmentUrl('');
    const response = await fetch('/api/portal/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) setMessage(data.message || 'The sign-in link could not be requested.');
    else {
      setMessage(data.message);
      setDevelopmentUrl(data.developmentUrl || '');
    }
    setPending(false);
  }
  return (
    <div className="portal-login">
      <span className="admin-login-icon">
        <Mail size={25} />
      </span>
      <span className="section-kicker">PASSWORDLESS CUSTOMER ACCESS</span>
      <h1>Open your project portal.</h1>
      <p>
        Enter the email used on your enquiry or booking. We will prepare a private link that expires in 30
        minutes.
      </p>
      {error && (
        <div className="form-error" role="alert">
          That sign-in link is invalid, expired or already used. Request a new one.
        </div>
      )}
      <div className="field">
        <label htmlFor="portal-email">Project email address</label>
        <input
          id="portal-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <button
        type="button"
        className="button form-submit"
        disabled={pending || !email.includes('@')}
        onClick={submit}
      >
        {pending ? (
          <>
            <LoaderCircle className="spin" size={18} />
            Preparing link…
          </>
        ) : (
          'Send my private sign-in link'
        )}
      </button>
      {message && (
        <div className="portal-message" role="status">
          {message}
        </div>
      )}
      {developmentUrl && (
        <a className="button button-secondary" href={developmentUrl}>
          Open development sign-in link
        </a>
      )}
    </div>
  );
}
