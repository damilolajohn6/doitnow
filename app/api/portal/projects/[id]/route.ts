import { getCustomerSession, updateCustomerProject } from '@/lib/portal';

export const runtime = 'nodejs';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session)
    return Response.json({ ok: false, message: 'Your portal session has expired.' }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string; note?: unknown };
  if (body.action !== 'approve' && body.action !== 'revision') {
    return Response.json({ ok: false, message: 'Unsupported project action.' }, { status: 400 });
  }
  const project = await updateCustomerProject(
    session.email,
    id,
    body.action,
    typeof body.note === 'string' ? body.note.slice(0, 2000) : '',
  );
  if (!project) return Response.json({ ok: false, message: 'Project not found.' }, { status: 404 });
  return Response.json({ ok: true, project }, { headers: { 'Cache-Control': 'no-store' } });
}
