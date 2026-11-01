export function getBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return configured.replace(/\/$/, '');
}

export function absoluteUrl(path = ''): string {
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
