import { cookies } from 'next/headers';
import { adminCookieName } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const store = await cookies();
  store.set(adminCookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
