import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

let cachedClient: S3Client | undefined;

function configuration() {
  const bucket = process.env.S3_BUCKET?.trim();
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
    endpoint: (process.env.S3_ENDPOINT || process.env.AWS_ENDPOINT_URL_S3)?.replace(/\/$/, ''),
    accessKeyId,
    secretAccessKey,
    sessionToken: process.env.S3_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN,
    publicBucket: process.env.S3_PUBLIC_BUCKET?.trim() || '',
  };
}

export function s3Configured() {
  return Boolean(process.env.S3_BUCKET?.trim());
}

export function s3ConfigurationError() {
  if (!s3Configured()) return '';
  if (
    !(process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) ||
    !(process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY)
  ) {
    return 'S3 or Neon Object Storage credentials are incomplete.';
  }
  if (
    process.env.S3_PUBLIC_BASE_URL &&
    (!process.env.S3_PUBLIC_BUCKET || process.env.S3_PUBLIC_BUCKET === process.env.S3_BUCKET)
  ) {
    return 'Public file URLs require a separate S3_PUBLIC_BUCKET.';
  }
  return '';
}

function client() {
  const config = configuration();
  if (!config) throw new Error('S3 credentials are not configured.');
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE
        ? process.env.S3_FORCE_PATH_STYLE === 'true'
        : Boolean(config.endpoint),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
      },
    });
  }
  return { client: cachedClient, bucket: config.bucket, publicBucket: config.publicBucket };
}

export async function writeS3Object(
  key: string,
  bytes: Uint8Array,
  contentType: string,
  visibility: 'public' | 'private',
) {
  const { client: s3, bucket, publicBucket } = client();
  const targetBucket = visibility === 'public' && publicBucket ? publicBucket : bucket;
  await s3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: visibility === 'public' ? 'public, max-age=31536000, immutable' : 'private, no-store',
    }),
  );
  return `s3://${targetBucket}/${key}`;
}

export async function readS3Object(storageKey: string) {
  if (!storageKey.startsWith('s3://')) return null;
  const parsed = new URL(storageKey);
  const { client: s3 } = client();
  const result = await s3.send(
    new GetObjectCommand({ Bucket: parsed.hostname, Key: decodeURIComponent(parsed.pathname.slice(1)) }),
  );
  if (!result.Body) return null;
  const bytes = await result.Body.transformToByteArray();
  return { stream: null, bytes, contentType: result.ContentType || 'application/octet-stream' };
}

export function s3PublicUrl(storageKey: string) {
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (
    !base ||
    !process.env.S3_PUBLIC_BUCKET ||
    process.env.S3_PUBLIC_BUCKET === process.env.S3_BUCKET ||
    !storageKey.startsWith('s3://')
  )
    return null;
  const parsed = new URL(storageKey);
  const key = parsed.pathname
    .slice(1)
    .split('/')
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join('/');
  return `${base}/${key}`;
}
