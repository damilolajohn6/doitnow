'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/browser';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <main className="not-found container">
          <span className="section-kicker">SOMETHING WENT WRONG</span>
          <h1>The page could not be displayed.</h1>
          <p>Please try again. Your saved enquiries and project records are not removed by this error.</p>
          <button className="button" type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
