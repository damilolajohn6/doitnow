import { requestPortalLink } from '@/lib/portal';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'portal-link'), 5, 15 * 60 * 1000);
  if (throttle.unavailable)
    return Response.json({ ok: false, message: 'Sign-in protection is unavailable.' }, { status: 503 });
  if (!throttle.allowed)
    return Response.json({ ok: false, message: 'Too many attempts. Please wait.' }, { status: 429 });
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const result = await requestPortalLink(typeof body.email === 'string' ? body.email : '');
  return Response.json(
    {
      ok: true,
      message: 'If the email matches a project, a private sign-in link has been prepared.',
      ...(result.developmentUrl ? { developmentUrl: result.developmentUrl } : {}),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
