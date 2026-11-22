import { getAdminSession } from '@/lib/auth';
import { setAdminUserActive } from '@/lib/admin-users';
import { recordAudit } from '@/lib/catalogue';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (session?.role !== 'owner')
    return Response.json({ ok: false, message: 'Owner access required.' }, { status: 403 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { active?: boolean };
  if (typeof body.active !== 'boolean')
    return Response.json({ ok: false, message: 'Invalid activation state.' }, { status: 400 });
  try {
    await setAdminUserActive(id, body.active);
    await recordAudit(session.email, body.active ? 'Activated admin user' : 'Deactivated admin user', id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : 'User could not be updated.' },
      { status: 400 },
    );
  }
}
