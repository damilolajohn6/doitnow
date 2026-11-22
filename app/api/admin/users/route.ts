import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { createAdminUser, listAdminUsers } from '@/lib/admin-users';
import { recordAudit } from '@/lib/catalogue';

export const runtime = 'nodejs';

const userSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(14).max(200),
  role: z.enum(['owner', 'manager']),
  requireMfa: z.boolean(),
});

export async function GET() {
  const session = await getAdminSession();
  if (session?.role !== 'owner')
    return Response.json({ ok: false, message: 'Owner access required.' }, { status: 403 });
  return Response.json({ ok: true, users: await listAdminUsers() });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (session?.role !== 'owner')
    return Response.json({ ok: false, message: 'Owner access required.' }, { status: 403 });
  const parsed = userSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { ok: false, message: 'Use a valid email, role and password of at least 14 characters.' },
      { status: 400 },
    );
  try {
    const result = await createAdminUser(
      parsed.data.email,
      parsed.data.password,
      parsed.data.role,
      parsed.data.requireMfa,
    );
    await recordAudit(session.email, 'Created admin user', result.email, parsed.data.role);
    return Response.json({ ok: true, credentials: result }, { status: 201 });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : 'User could not be created.' },
      { status: 400 },
    );
  }
}
