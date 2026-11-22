import { randomBytes, randomUUID } from 'node:crypto';
import { getCatalogueDesigns } from '@/lib/catalogue';
import { queueEnquiryEmails } from '@/lib/email-outbox';
import { saveEnquiry, type EnquiryInput } from '@/lib/enquiries';
import { attachUploads } from '@/lib/file-storage';
import { projectBriefUrl, saveProjectBrief } from '@/lib/project-briefs';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';
import { enquirySchema, fieldErrors, studioBriefSchema } from '@/lib/validation';

export const runtime = 'nodejs';

function errorResponse(message: string, status: number, retryAfter = 0) {
  return Response.json(
    { ok: false, message },
    {
      status,
      headers: { 'Cache-Control': 'no-store', ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) },
    },
  );
}

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'enquiry'), 5, 10 * 60 * 1000);
  if (throttle.unavailable) return errorResponse('Enquiry protection is temporarily unavailable.', 503);
  if (!throttle.allowed)
    return errorResponse('Too many attempts. Please wait before trying again.', 429, throttle.retryAfter);

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
  const studio = studioBriefSchema.safeParse(raw.studio || {});
  if (!parsed.success || !studio.success) {
    return Response.json(
      {
        ok: false,
        message: 'Please check the highlighted fields.',
        ...(parsed.success ? {} : { errors: fieldErrors(parsed.error) }),
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const data = parsed.data;
  const catalogue = await getCatalogueDesigns();
  const selected = [data.design, ...studio.data.favourites].filter(Boolean);
  if (selected.some((slug) => !catalogue.some((design) => design.slug === slug))) {
    return errorResponse('One of the selected designs is not currently published.', 400);
  }
  const reference = `DIN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const enquiry: EnquiryInput = {
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
  };
  try {
    await saveEnquiry(enquiry);
  } catch {
    return errorResponse('We could not save the enquiry. Please try again or contact us directly.', 500);
  }
  try {
    await saveProjectBrief(enquiry.id, studio.data);
    if (typeof raw.draftId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(raw.draftId)) {
      await attachUploads(raw.draftId, enquiry.id);
    }
  } catch {
    console.error(`Extended brief processing requires attention for enquiry ${reference}.`);
  }
  try {
    await queueEnquiryEmails(enquiry);
  } catch {
    console.error(`Unexpected email processing failure for enquiry ${reference}.`);
  }
  return Response.json(
    { ok: true, reference, briefUrl: projectBriefUrl(reference) },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}
