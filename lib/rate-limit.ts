interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  unavailable?: boolean;
}

interface RemoteLimiter {
  limit(identifier: string): Promise<{ success: boolean; reset: number }>;
}

const buckets = new Map<string, Bucket>();
const remoteLimiters = new Map<string, RemoteLimiter>();

function checkLocalRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfter: 0 };
}

async function getRemoteLimiter(limit: number, windowMs: number): Promise<RemoteLimiter> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Upstash Redis is not configured.');
  const cacheKey = `${limit}:${windowMs}`;
  const cached = remoteLimiters.get(cacheKey);
  if (cached) return cached;

  const [{ Redis }, { Ratelimit }] = await Promise.all([
    import('@upstash/redis'),
    import('@upstash/ratelimit'),
  ]);
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
    prefix: 'do-it-now-rate-limit',
  });
  remoteLimiters.set(cacheKey, limiter);
  return limiter;
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (process.env.VERCEL !== '1') return checkLocalRateLimit(key, limit, windowMs);
  try {
    const limiter = await getRemoteLimiter(limit, windowMs);
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch {
    console.error('The shared rate-limit service is unavailable or not configured.');
    return { allowed: false, retryAfter: 0, unavailable: true };
  }
}

export function requestKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip') || 'local';
  return `${scope}:${address}`;
}
