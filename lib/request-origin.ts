export function requestOrigin(request: Request) {
  const current = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const host = forwardedHost || request.headers.get('host') || current.host;
  if (!/^[a-z0-9.[\]:-]+$/i.test(host)) return current.origin;
  const forwardedProtocol = request.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const protocol = forwardedProtocol === 'https' || current.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://${host}`;
}
