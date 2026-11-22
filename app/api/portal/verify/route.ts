import { verifyPortalToken } from '@/lib/portal';
import { requestOrigin } from '@/lib/request-origin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const valid = token.length >= 32 ? await verifyPortalToken(token) : false;
  const destination = new URL(valid ? '/portal' : '/portal?error=invalid-link', requestOrigin(request));
  return Response.redirect(destination, 303);
}
