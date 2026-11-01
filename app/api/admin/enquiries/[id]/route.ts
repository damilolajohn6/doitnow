import { isAdminAuthenticated } from '@/lib/auth';
import { enquiryStatuses, updateEnquiryStatus } from '@/lib/enquiries';
import type { EnquiryStatus } from '@/lib/enquiries';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return Response.json(
      { ok: false, message: 'Authentication required.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const throttle = await checkRateLimit(requestKey(request, 'admin-update'), 60, 10 * 60 * 1000);
  if (throttle.unavailable) {
    return Response.json(
      { ok: false, message: 'Update protection is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!throttle.allowed) {
    return Response.json(
      { ok: false, message: 'Too many updates. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfter), 'Cache-Control': 'no-store' } },
    );
  }
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown };
    if (typeof body.status !== 'string' || !(enquiryStatuses as readonly string[]).includes(body.status)) {
      return Response.json(
        { ok: false, message: 'Select a valid enquiry status.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const enquiry = await updateEnquiryStatus(id, body.status as EnquiryStatus);
    if (!enquiry) {
      return Response.json(
        { ok: false, message: 'Enquiry not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return Response.json({ ok: true, enquiry }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { ok: false, message: 'The status could not be updated.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
