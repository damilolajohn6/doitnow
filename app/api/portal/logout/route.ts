import { logoutCustomer } from '@/lib/portal';

export async function POST() {
  await logoutCustomer();
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
