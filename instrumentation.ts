import { captureServerException } from '@/lib/monitoring-server';

export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  _context: { routerKind: string; routePath: string; routeType: string },
) {
  await captureServerException(error, { route: request.path, method: request.method });
}
