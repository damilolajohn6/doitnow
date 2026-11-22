import { z } from 'zod';
import { askDesignConcierge } from '@/lib/concierge';
import { checkRateLimit, requestKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const inputSchema = z.object({
  message: z.string().trim().min(3).max(1000),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(1500) }))
    .max(8)
    .default([]),
});

export async function POST(request: Request) {
  const throttle = await checkRateLimit(requestKey(request, 'concierge'), 12, 10 * 60 * 1000);
  if (throttle.unavailable)
    return Response.json({ ok: false, message: 'Concierge protection is unavailable.' }, { status: 503 });
  if (!throttle.allowed)
    return Response.json(
      { ok: false, message: 'Too many concierge messages. Please wait.' },
      { status: 429 },
    );
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return Response.json({ ok: false, message: 'Write a short room or design question.' }, { status: 400 });
  const result = await askDesignConcierge(parsed.data.message, parsed.data.history);
  return Response.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
}
