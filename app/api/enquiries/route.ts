import { randomBytes, randomUUID } from 'node:crypto';
import { saveEnquiry } from '@/lib/enquiries';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';
import { enquirySchema, fieldErrors } from '@/lib/validation';

export const runtime = 'nodejs';

function errorResponse(message: string, status: number, retryAfter = 0) {
  return Response.json(
    { ok: false, message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
      },
    },
  );
}

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'enquiry'), 5, 10 * 60 * 1000);
  if (throttle.unavailable) return errorResponse('Enquiry protection is temporarily unavailable.', 503);
  if (!throttle.allowed) {
    return errorResponse('Too many attempts. Please wait before trying again.', 429, throttle.retryAfter);
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse('Please submit the enquiry form again.', 400);
  }
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return errorResponse('Please check your details and try again.', 400);
  }
  const raw = input as Record<string, unknown>;
  if (typeof raw.companyWebsite === 'string' && raw.companyWebsite.trim()) {
    return Response.json({ ok: true, reference: null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { ok: false, message: 'Please check the highlighted fields.', errors: fieldErrors(parsed.error) },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const data = parsed.data;
  const reference = `DIN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  try {
    await saveEnquiry({
      id: randomUUID(),
      reference,
      createdAt: new Date().toISOString(),
      status: 'new',
      name: data.name,
      phone: data.phone,
      email: data.email,
      location: data.location,
      projectType: data.projectType,
      design: data.design,
      preferredContact: data.preferredContact,
      message: data.message,
    });
    return Response.json({ ok: true, reference }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return errorResponse('We could not save the enquiry. Please try again or contact us directly.', 500);
  }
}
