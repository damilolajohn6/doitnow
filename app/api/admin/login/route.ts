import { cookies } from 'next/headers';
import { adminCookieName, createSessionToken, sessionDurationSeconds, verifyAdminPassword } from '@/lib/auth';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'admin-login'), 8, 15 * 60 * 1000);
  if (throttle.unavailable) {
    return Response.json(
      { ok: false, message: 'Sign-in protection is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!throttle.allowed) {
    return Response.json(
      { ok: false, message: 'Too many sign-in attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfter), 'Cache-Control': 'no-store' } },
    );
  }
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== 'string' || !verifyAdminPassword(body.password)) {
      return Response.json(
        { ok: false, message: 'The password is incorrect or admin access is not configured.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const store = await cookies();
    store.set(adminCookieName, createSessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: sessionDurationSeconds,
    });
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { ok: false, message: 'Sign-in is not available. Please check the server configuration.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
