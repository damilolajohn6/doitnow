import { randomUUID } from 'node:crypto';
import { saveUpload } from '@/lib/file-storage';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'brief-upload'), 20, 60 * 60 * 1000);
  if (throttle.unavailable)
    return Response.json({ ok: false, message: 'Upload protection is unavailable.' }, { status: 503 });
  if (!throttle.allowed)
    return Response.json({ ok: false, message: 'Too many uploads. Please wait.' }, { status: 429 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    const suppliedDraft = form.get('draftId');
    const draftId =
      typeof suppliedDraft === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(suppliedDraft)
        ? suppliedDraft
        : randomUUID();
    if (!(file instanceof File))
      return Response.json({ ok: false, message: 'Choose a file.' }, { status: 400 });
    const upload = await saveUpload(file, draftId, 'brief', 'private');
    return Response.json(
      {
        ok: true,
        draftId,
        file: {
          id: upload.id,
          filename: upload.filename,
          sizeBytes: upload.sizeBytes,
          contentType: upload.contentType,
        },
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The file could not be uploaded.';
    return Response.json({ ok: false, message }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
