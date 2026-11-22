import { createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { platformQuery, platformRun } from './platform-store';

const scrypt = promisify(scryptCallback);

export interface AdminUserRecord {
  id: string;
  email: string;
  role: 'owner' | 'manager';
  mfaEnabled: boolean;
  active: boolean;
  createdAt: string;
}

interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  role: 'owner' | 'manager';
  totp_secret: string;
  totp_enabled: number;
  active: number;
  created_at: string;
}

function mapUser(row: AdminUserRow): AdminUserRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    mfaEnabled: Boolean(row.totp_enabled),
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('base64url')}:${hash.toString('base64url')}`;
}

async function verifyPassword(password: string, stored: string) {
  const [saltValue, hashValue] = stored.split(':');
  if (!saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, 'base64url');
  const actual = (await scrypt(password, Buffer.from(saltValue, 'base64url'), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(value: string) {
  let bits = 0;
  let accumulator = 0;
  const output: number[] = [];
  for (const character of value.replace(/=+$/, '').toUpperCase()) {
    const index = alphabet.indexOf(character);
    if (index < 0) continue;
    accumulator = (accumulator << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

export function totpCode(secret: string, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30_000);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary =
    ((digest[offset] & 127) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

export function verifyTotp(secret: string, candidate: string) {
  const normalized = candidate.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  return [-30_000, 0, 30_000].some((offset) => {
    const expected = Buffer.from(totpCode(secret, Date.now() + offset));
    const supplied = Buffer.from(normalized);
    return timingSafeEqual(expected, supplied);
  });
}

export async function createAdminUser(
  emailInput: string,
  password: string,
  role: 'owner' | 'manager',
  requireMfa: boolean,
) {
  const email = emailInput.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid admin email.');
  if (password.length < 14) throw new Error('Use at least 14 characters for the admin password.');
  const secret = requireMfa ? base32Encode(randomBytes(20)) : '';
  await platformRun(
    'INSERT INTO admin_users (id, email, password_hash, role, totp_secret, totp_enabled, active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
    [
      randomUUID(),
      email,
      await hashPassword(password),
      role,
      secret,
      requireMfa ? 1 : 0,
      new Date().toISOString(),
    ],
  );
  return {
    email,
    secret,
    otpauth: secret
      ? `otpauth://totp/Do%20It%20Now:${encodeURIComponent(email)}?secret=${secret}&issuer=Do%20It%20Now&algorithm=SHA1&digits=6&period=30`
      : '',
  };
}

export async function authenticateAdminUser(emailInput: string, password: string, code: string) {
  const rows = await platformQuery<AdminUserRow>(
    'SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [emailInput.trim()],
  );
  const user = rows[0];
  if (!user?.active || !(await verifyPassword(password, user.password_hash))) return null;
  if (user.totp_enabled && !verifyTotp(user.totp_secret, code)) return null;
  return { id: user.id, email: user.email, role: user.role };
}

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const rows = await platformQuery<AdminUserRow>('SELECT * FROM admin_users ORDER BY created_at ASC');
  return rows.map(mapUser);
}

export async function setAdminUserActive(id: string, active: boolean) {
  const rows = await platformQuery<AdminUserRow>('SELECT * FROM admin_users WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) throw new Error('Admin user not found.');
  if (!active && rows[0].role === 'owner') {
    const owners = await platformQuery<{ count: number }>(
      "SELECT COUNT(*) AS count FROM admin_users WHERE role = 'owner' AND active = 1",
    );
    if (Number(owners[0]?.count || 0) <= 1) throw new Error('At least one active owner is required.');
  }
  await platformRun('UPDATE admin_users SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
}
