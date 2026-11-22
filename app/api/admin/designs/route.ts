import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { designInputSchema, recordAudit, removeDesignOverride, saveDesign } from '@/lib/catalogue';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  const parsed = designInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        message: 'Check all design fields, image URL and content lengths.',
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const design = await saveDesign(parsed.data);
  await recordAudit(
    session.email,
    parsed.data.published ? 'Published design' : 'Saved design draft',
    design.slug,
  );
  for (const pathname of ['/', '/designs', `/designs/${design.slug}`, '/sitemap.xml'])
    revalidatePath(pathname);
  return Response.json({ ok: true, design, published: parsed.data.published }, { status: 200 });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (session?.role !== 'owner')
    return Response.json({ ok: false, message: 'Owner access required.' }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { slug?: string };
  if (!body.slug || !/^[a-z0-9-]+$/.test(body.slug))
    return Response.json({ ok: false, message: 'Invalid design.' }, { status: 400 });
  await removeDesignOverride(body.slug);
  await recordAudit(session.email, 'Removed design override', body.slug);
  for (const pathname of ['/', '/designs', `/designs/${body.slug}`, '/sitemap.xml']) revalidatePath(pathname);
  return Response.json({ ok: true });
}
