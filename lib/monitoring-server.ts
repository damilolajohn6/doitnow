export async function captureServerException(
  error: unknown,
  context: { route?: string; method?: string } = {},
) {
  const dsnValue = process.env.SENTRY_DSN;
  if (!dsnValue) return;
  try {
    const dsn = new URL(dsnValue);
    const projectId = dsn.pathname.replace(/^\//, '');
    if (!dsn.username || !projectId) return;
    const eventId = crypto.randomUUID().replace(/-/g, '');
    const endpoint = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/`;
    const exception = error instanceof Error ? error : new Error('Unknown server error');
    const event = {
      event_id: eventId,
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      level: 'error',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      logger: 'do-it-now-server',
      exception: { values: [{ type: exception.name, value: exception.message.slice(0, 500) }] },
      request: context.route ? { url: context.route, method: context.method || 'GET' } : undefined,
      tags: { runtime: 'nodejs' },
    };
    const envelope = `${JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString(), dsn: dsnValue })}\n${JSON.stringify({ type: 'event' })}\n${JSON.stringify(event)}`;
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7,sentry_client=do-it-now/1.0,sentry_key=${dsn.username}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Monitoring must never affect the application response.
  }
}
