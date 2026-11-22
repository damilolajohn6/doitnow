import { z } from 'zod';
import { getAdminSession } from '@/lib/auth';
import { recordAudit } from '@/lib/catalogue';
import { projectStages, updateAdminProject } from '@/lib/portal';

export const runtime = 'nodejs';

const updateSchema = z.object({
  stage: z.enum(projectStages),
  assignedTo: z.string().trim().max(160),
  followUpAt: z.string().trim().max(40),
  internalNotes: z.string().trim().max(4000),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ ok: false, message: 'Check the project fields.' }, { status: 400 });
  await updateAdminProject(id, parsed.data, session.email);
  await recordAudit(session.email, 'Updated project profile', id, parsed.data.stage);
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
