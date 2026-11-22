const remotePatterns = [{ protocol: 'https', hostname: '**.public.blob.vercel-storage.com' }];
if (process.env.S3_PUBLIC_BASE_URL?.startsWith('https://')) {
  remotePatterns.push({ protocol: 'https', hostname: new URL(process.env.S3_PUBLIC_BASE_URL).hostname });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(process.env.VERCEL === '1' ? {} : { output: 'standalone' }),
  allowedDevOrigins: ['*.e2b.app', '127.0.0.1', 'localhost'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
