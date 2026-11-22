import { getAdminSession } from '@/lib/auth';
import { recordAudit } from '@/lib/catalogue';
import { saveUpload } from '@/lib/file-storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    const requestedKind = String(form.get('kind') || 'design');
    const kind = requestedKind === 'portal' ? 'portal' : requestedKind === 'story' ? 'story' : 'design';
    const ownerId = String(form.get('ownerId') || '');
    if (!(file instanceof File))
      return Response.json({ ok: false, message: 'Choose a file.' }, { status: 400 });
    if (kind === 'portal' && !/^[a-f0-9-]{36}$/.test(ownerId)) {
      return Response.json({ ok: false, message: 'A valid project is required.' }, { status: 400 });
    }
    const upload = await saveUpload(
      file,
      ownerId || 'catalogue',
      kind,
      kind === 'design' || kind === 'story' ? 'public' : 'private',
    );
    await recordAudit(session.email, `Uploaded ${kind} file`, ownerId || upload.id, upload.filename);
    return Response.json({ ok: true, file: upload }, { status: 201 });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 400 },
    );
  }
}
