import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { recordAudit } from '@/lib/catalogue';
import { removeStory, saveStory, storyInputSchema } from '@/lib/stories';

export const runtime = 'nodejs';

function revalidateStories(slug: string) {
  for (const pathname of ['/stories', `/stories/${slug}`, '/sitemap.xml']) revalidatePath(pathname);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  const parsed = storyInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        message: 'Check every story field and add an approved attribution for any testimonial.',
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }
  const story = await saveStory(parsed.data);
  await recordAudit(
    session.email,
    parsed.data.published ? 'Published project story' : 'Saved project-story draft',
    story.slug,
  );
  revalidateStories(story.slug);
  return Response.json({ ok: true, story, published: parsed.data.published });
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (session?.role !== 'owner')
    return Response.json({ ok: false, message: 'Owner access required.' }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { slug?: string };
  if (!body.slug || !/^[a-z0-9-]+$/.test(body.slug))
    return Response.json({ ok: false, message: 'Invalid story.' }, { status: 400 });
  await removeStory(body.slug);
  await recordAudit(session.email, 'Removed project story', body.slug);
  revalidateStories(body.slug);
  return Response.json({ ok: true });
}
