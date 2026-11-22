import { designs } from '@/lib/designs';
import { downloadAssets } from '@/lib/downloads';
import { checkEnquiryStore } from '@/lib/enquiries';
import { ensurePlatformSchema } from '@/lib/platform-store';
import { s3ConfigurationError, s3Configured } from '@/lib/s3-storage';

export const dynamic = 'force-dynamic';

function vercelConfigurationError() {
  if (process.env.VERCEL !== '1') return '';
  if (!(process.env.DATABASE_URL || process.env.POSTGRES_URL)) return 'DATABASE_URL is required.';
  if (
    !(
      (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
    )
  ) {
    return 'Upstash Redis credentials are required.';
  }
  if (!process.env.DO_IT_NOW_BLOB_BASE_URL) return 'DO_IT_NOW_BLOB_BASE_URL is required.';
  return '';
}

export async function GET() {
  const configurationError = vercelConfigurationError() || s3ConfigurationError();
  if (configurationError) {
    return Response.json(
      { ok: false, service: 'Do It Now web', message: configurationError },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  try {
    await checkEnquiryStore();
    await ensurePlatformSchema();
    return Response.json(
      {
        ok: true,
        service: 'Do It Now web',
        designs: designs.length,
        downloads: downloadAssets.length,
        storage: s3Configured() ? 's3-compatible' : process.env.VERCEL === '1' ? 'vercel-blob' : 'local',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json(
      { ok: false, service: 'Do It Now web', message: 'The enquiry store is unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
