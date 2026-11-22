import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { platformQuery } from './platform-store';

export const adminCookieName = 'din_admin_session';
export const sessionDurationSeconds = 8 * 60 * 60;

export interface AdminSession {
  sub: string;
  role: 'owner' | 'manager';
  email: string;
  exp: number;
}

function signature(value: string): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not configured.');
  return createHmac('sha256', secret).update(value).digest();
}

export function createSessionToken(
  identity: { sub: string; role: 'owner' | 'manager'; email: string } = {
    sub: 'admin',
    role: 'owner',
    email: 'environment-owner',
  },
): string {
  const payload = Buffer.from(
    JSON.stringify({ ...identity, exp: Date.now() + sessionDurationSeconds * 1000 }),
  ).toString('base64url');
  return `${payload}.${signature(payload).toString('base64url')}`;
}

function sessionFromToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature) return null;
  try {
    const expected = signature(payload);
    const supplied = Buffer.from(suppliedSignature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<AdminSession>;
    if (
      typeof data.sub !== 'string' ||
      typeof data.email !== 'string' ||
      (data.role !== 'owner' && data.role !== 'manager') ||
      typeof data.exp !== 'number' ||
      data.exp <= Date.now()
    ) {
      return null;
    }
    return data as AdminSession;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined): boolean {
  return Boolean(sessionFromToken(token));
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const candidateHash = createHash('sha256').update(candidate).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const session = sessionFromToken(store.get(adminCookieName)?.value);
  if (!session || session.sub === 'admin') return session;
  const users = await platformQuery<{ email: string; role: 'owner' | 'manager'; active: number }>(
    'SELECT email, role, active FROM admin_users WHERE id = ? LIMIT 1',
    [session.sub.startsWith('admin-user:') ? session.sub.slice('admin-user:'.length) : session.sub],
  );
  const user = users[0];
  if (!user?.active) return null;
  return { ...session, email: user.email, role: user.role };
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return Boolean(await getAdminSession());
}
