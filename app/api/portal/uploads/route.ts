import { randomUUID } from 'node:crypto';
import { saveUpload } from '@/lib/file-storage';
import { platformQuery, platformRun } from '@/lib/platform-store';
import { getCustomerSession } from '@/lib/portal';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session)
    return Response.json({ ok: false, message: 'Your portal session has expired.' }, { status: 401 });
  const throttle = await checkRateLimit(requestKey(request, 'portal-upload'), 10, 60 * 60 * 1000);
  if (throttle.unavailable)
    return Response.json({ ok: false, message: 'Upload protection is unavailable.' }, { status: 503 });
  if (!throttle.allowed)
    return Response.json({ ok: false, message: 'Too many uploads. Please wait.' }, { status: 429 });
  try {
    const form = await request.formData();
    const projectId = String(form.get('projectId') || '');
    const file = form.get('file');
    if (!/^[a-f0-9-]{36}$/.test(projectId) || !(file instanceof File)) {
      return Response.json({ ok: false, message: 'Choose a valid project file.' }, { status: 400 });
    }
    const owner = await platformQuery<{ id: string }>(
      'SELECT id FROM enquiries WHERE id = ? AND LOWER(email) = LOWER(?) LIMIT 1',
      [projectId, session.email],
    );
    if (!owner[0]) return Response.json({ ok: false, message: 'Project not found.' }, { status: 404 });
    const upload = await saveUpload(file, projectId, 'portal', 'private');
    await platformRun(
      'INSERT INTO project_activities (id, enquiry_id, actor, action, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        randomUUID(),
        projectId,
        session.email,
        'Customer file uploaded',
        upload.filename,
        new Date().toISOString(),
      ],
    );
    return Response.json(
      { ok: true, file: { id: upload.id, filename: upload.filename, sizeBytes: upload.sizeBytes } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
