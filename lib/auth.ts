import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const adminCookieName = 'din_admin_session';
export const sessionDurationSeconds = 8 * 60 * 60;

function signature(value: string): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not configured.');
  return createHmac('sha256', secret).update(value).digest();
}

export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', exp: Date.now() + sessionDurationSeconds * 1000 }),
  ).toString('base64url');
  return `${payload}.${signature(payload).toString('base64url')}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, suppliedSignature] = token.split('.');
  if (!payload || !suppliedSignature) return false;

  try {
    const expected = signature(payload);
    const supplied = Buffer.from(suppliedSignature, 'base64url');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      exp?: number;
    };
    return data.sub === 'admin' && typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const candidateHash = createHash('sha256').update(candidate).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(adminCookieName)?.value);
}
