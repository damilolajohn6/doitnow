'use client';

import { RefreshCw } from 'lucide-react';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="not-found">
      <div className="container">
        <span className="section-kicker">SOMETHING WENT WRONG</span>
        <h1>We could not load this page.</h1>
        <p>Please try again. If the problem continues, contact us directly.</p>
        <button type="button" className="button" onClick={reset}>
          <RefreshCw size={18} /> Try again
        </button>
      </div>
    </section>
  );
}
