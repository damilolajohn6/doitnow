import { isAdminAuthenticated } from '@/lib/auth';
import { listUploads } from '@/lib/file-storage';
import { generateProjectBriefPdf, getBriefByReference, validProjectBriefToken } from '@/lib/project-briefs';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!(await isAdminAuthenticated()) && !validProjectBriefToken(reference, token)) {
    return new Response('Not found', { status: 404 });
  }
  const record = await getBriefByReference(reference);
  if (!record) return new Response('Not found', { status: 404 });
  const files = await listUploads(record.enquiry.id, 'brief');
  const bytes = await generateProjectBriefPdf(
    record.enquiry,
    record.brief,
    files.map((file) => file.filename),
  );
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Do-It-Now-${reference}-Project-Brief.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
