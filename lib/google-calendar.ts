import { importPKCS8, SignJWT } from 'jose';

interface BusyInterval {
  start: string;
  end: string;
}

let accessToken: { value: string; expiresAt: number } | undefined;

export function googleCalendarConfigured() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL &&
      process.env.GOOGLE_CALENDAR_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

async function getAccessToken() {
  if (accessToken && accessToken.expiresAt > Date.now() + 60_000) return accessToken.value;
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL as string;
  const privateKey = (process.env.GOOGLE_CALENDAR_PRIVATE_KEY as string).replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKey, 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/calendar' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(clientEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Google Calendar authentication failed.');
  const data = (await response.json()) as { access_token: string; expires_in: number };
  accessToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return accessToken.value;
}

async function calendarFetch(pathname: string, init: RequestInit) {
  const token = await getAccessToken();
  const response = await fetch(`https://www.googleapis.com/calendar/v3${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Google Calendar request failed with status ${response.status}.`);
  return response;
}

export async function getGoogleBusyIntervals(start: string, end: string): Promise<BusyInterval[]> {
  if (!googleCalendarConfigured()) return [];
  const response = await calendarFetch('/freeBusy', {
    method: 'POST',
    body: JSON.stringify({ timeMin: start, timeMax: end, items: [{ id: process.env.GOOGLE_CALENDAR_ID }] }),
  });
  const data = (await response.json()) as {
    calendars?: Record<string, { busy?: Array<{ start: string; end: string }> }>;
  };
  const calendar = data.calendars?.[process.env.GOOGLE_CALENDAR_ID as string];
  return calendar?.busy || [];
}

export async function createGoogleEvent(input: {
  name: string;
  service: string;
  start: string;
  end: string;
  reference: string;
}) {
  if (!googleCalendarConfigured()) return '';
  const response = await calendarFetch(
    `/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID as string)}/events`,
    {
      method: 'POST',
      body: JSON.stringify({
        summary: `${input.service} — ${input.name}`,
        description: `Do It Now booking ${input.reference}`,
        start: { dateTime: input.start, timeZone: 'Africa/Lagos' },
        end: { dateTime: input.end, timeZone: 'Africa/Lagos' },
      }),
    },
  );
  const data = (await response.json()) as { id: string };
  return data.id;
}

export async function updateGoogleEvent(eventId: string, start: string, end: string) {
  if (!eventId || !googleCalendarConfigured()) return;
  await calendarFetch(
    `/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID as string)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        start: { dateTime: start, timeZone: 'Africa/Lagos' },
        end: { dateTime: end, timeZone: 'Africa/Lagos' },
      }),
    },
  );
}

export async function deleteGoogleEvent(eventId: string) {
  if (!eventId || !googleCalendarConfigured()) return;
  await calendarFetch(
    `/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID as string)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    },
  );
}
