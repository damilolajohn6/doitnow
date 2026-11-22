import { expect, test } from '@playwright/test';
import { s3ConfigurationError, s3Configured, s3PublicUrl } from '../lib/s3-storage';

const keys = [
  'S3_BUCKET',
  'S3_PUBLIC_BUCKET',
  'S3_PUBLIC_BASE_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_ENDPOINT_URL_S3',
] as const;

test('Neon Object Storage environment mapping is validated without exposing private files', () => {
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.S3_BUCKET = 'do-it-now-private';
    process.env.AWS_ACCESS_KEY_ID = 'nak_test';
    process.env.AWS_SECRET_ACCESS_KEY = 'nsk_test';
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_ENDPOINT_URL_S3 = 'https://branch.storage.example';
    delete process.env.S3_PUBLIC_BUCKET;
    delete process.env.S3_PUBLIC_BASE_URL;
    expect(s3Configured()).toBe(true);
    expect(s3ConfigurationError()).toBe('');
    expect(s3PublicUrl('s3://do-it-now-private/do-it-now/portal/private.pdf')).toBeNull();

    process.env.S3_PUBLIC_BUCKET = 'do-it-now-public';
    process.env.S3_PUBLIC_BASE_URL = 'https://branch.storage.example/do-it-now-public';
    expect(s3ConfigurationError()).toBe('');
    expect(s3PublicUrl('s3://do-it-now-public/do-it-now/story/room one.webp')).toBe(
      'https://branch.storage.example/do-it-now-public/do-it-now/story/room%20one.webp',
    );

    delete process.env.AWS_SECRET_ACCESS_KEY;
    expect(s3ConfigurationError()).toContain('credentials are incomplete');
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
