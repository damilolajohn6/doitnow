import { isAdminAuthenticated } from '@/lib/auth';
import { getUpload, readUpload } from '@/lib/file-storage';
import { getCustomerSession } from '@/lib/portal';
import { platformQuery } from '@/lib/platform-store';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const upload = await getUpload(id);
  if (!upload) return new Response('Not found', { status: 404 });
  if (upload.visibility === 'private') {
    let allowed = await isAdminAuthenticated();
    if (!allowed) {
      const session = await getCustomerSession();
      if (session) {
        const owner = await platformQuery<{ id: string }>(
          'SELECT id FROM enquiries WHERE id = ? AND LOWER(email) = LOWER(?)',
          [upload.ownerId, session.email],
        );
        allowed = Boolean(owner[0]);
      }
    }
    if (!allowed) return new Response('Not found', { status: 404 });
  } else if (process.env.VERCEL === '1' && upload.url.startsWith('https://')) {
    return Response.redirect(upload.url, 302);
  }
  try {
    const result = await readUpload(upload);
    if (!result) return new Response('Not found', { status: 404 });
    const headers = {
      'Content-Type': result.contentType,
      'Content-Disposition': `inline; filename="${upload.filename.replace(/"/g, '')}"`,
      'Cache-Control':
        upload.visibility === 'private' ? 'private, no-store' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    };
    if (result.stream) return new Response(result.stream, { headers });
    if (result.bytes) return new Response(new Uint8Array(result.bytes), { headers });
    return new Response('Not found', { status: 404 });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
