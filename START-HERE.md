# Start here — Do It Now website

This bundle is designed for **Vercel + Neon Postgres + Neon Object Storage**. Local fallbacks remain available, but SQLite is not used on Vercel. No payment functionality is included.

## 1. Run locally

Use Node 24:

```bash
npm ci
cp .env.example .env.local
```

Replace `AUTH_SECRET`, `ADMIN_PASSWORD` and `CRON_SECRET` with independent random values:

```bash
openssl rand -hex 32
openssl rand -hex 24
```

Choose one local database path:

- **Zero SQLite:** set `DATABASE_URL` to a Neon development branch.
- **Offline fallback:** leave `DATABASE_URL` empty; the app creates `data/enquiries.sqlite` automatically.

Then run:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open the website at `http://localhost:3000` and Admin Pro at `/admin`. Keep the six approved collateral files beside the application folder, or set `DO_IT_NOW_ASSET_ROOT` to their directory.

## 2. Put the code on Vercel

1. Push the application to a Git provider supported by Vercel.
2. Import it with the detected **Next.js** preset and Node 24.
3. If the repository contains the whole delivery bundle, set Root Directory to `do-it-now-web`; otherwise leave it at the repository root.
4. Do not use the local standalone launcher as a Vercel build command. Vercel's native Next.js output is selected automatically.

## 3. Connect Neon Postgres

Connect **Neon Postgres** through Vercel Marketplace for Production and Preview. The integration normally injects:

```text
DATABASE_URL
```

`POSTGRES_URL` is also accepted. Tables and indexes are created idempotently by the application. No manual schema import is required.

Use separate branches/credentials for Production and Preview. Local SQLite data is not automatically migrated to Neon.

## 4. Connect Neon Object Storage

This stores file bytes in Neon while Postgres stores ownership and metadata. It replaces local uploads or Vercel Blob for dynamic room photos, portal files, catalogue images and story images.

### Create buckets

In the matching Neon branch, open **Object storage** and create:

```text
do-it-now-private    private
do-it-now-public     public_read (optional)
```

A single private bucket is sufficient. The optional public bucket is only for direct public catalogue/story image URLs. Never make the private bucket public.

CLI alternative:

```bash
neon buckets create do-it-now-private
neon buckets create do-it-now-public --access-level public_read
```

### Create credentials

Create a credential with `storage:read` and `storage:write` on the same branch:

```bash
neon credentials create --scope storage:read --scope storage:write --name do-it-now-vercel
```

Set these Vercel variables using the returned credential and branch storage endpoint:

```text
S3_BUCKET=do-it-now-private
AWS_ACCESS_KEY_ID=token_id
AWS_SECRET_ACCESS_KEY=s3_secret_access_key
AWS_REGION=your-neon-storage-region
AWS_ENDPOINT_URL_S3=https://your-branch-storage-host
```

The app automatically uses path-style S3 addressing for Neon. For local development, `neon env pull --file .env.local` can populate the standard AWS-named values after linking the desired branch.

### Optional direct public images

If using the public bucket, also set:

```text
S3_PUBLIC_BUCKET=do-it-now-public
S3_PUBLIC_BASE_URL=https://your-branch-storage-host/do-it-now-public
```

Set these before the final build so the Next.js image allowlist includes the host. If omitted, public images are safely served through `/api/files/[id]` instead.

Credential scope and bucket access are not proven by a local build. Complete the live upload/private-file checks in section 10.

## 5. Connect Upstash Redis

Create/connect Upstash through Vercel Marketplace for Production and Preview:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

The compatible `KV_REST_API_URL` / `KV_REST_API_TOKEN` aliases also work. Missing/unavailable Redis on Vercel causes protected mutations to return 503 rather than silently disabling rate limiting.

## 6. Publish the six approved collateral files

The fixed collateral downloads continue to use public Vercel Blob. Create a public Blob store, then place its private upload token and store ID in local `.env.local` only:

```text
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_ID=...
```

With the six approved files in the application's parent directory:

```bash
npx vercel login
npx vercel link
npm run blob:upload
```

Set the resulting public prefix in Vercel Production and Preview:

```text
DO_IT_NOW_BLOB_BASE_URL=https://your-store-id.public.blob.vercel-storage.com/do-it-now
```

Do not append a filename. The deployed download routes use an allowlist and do not accept arbitrary object paths.

## 7. Configure email and portal delivery

Use a Gmail **app password**, not the normal Gmail password:

```text
GMAIL_USER=gabdidi52@gmail.com
GMAIL_APP_PASSWORD=your-private-app-password
ENQUIRY_NOTIFICATION_EMAIL=gabdidi52@gmail.com
ENQUIRY_SEND_ACKNOWLEDGEMENT=true
```

Enquiries, booking messages and portal-link messages are persisted/outboxed before delivery. Hourly maintenance retries due failures; Admin → System also provides manual retry controls. Gmail delivery and spam placement require a real external test.

`PORTAL_DEV_MAGIC_LINKS=true` is only for local automated QA. Never set it on Vercel; it returns a private sign-in URL in an API response for testing.

## 8. Optional integrations

### Google Calendar

Share the target calendar with a Google service account, then set:

```text
GOOGLE_CALENDAR_CLIENT_EMAIL=...
GOOGLE_CALENDAR_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
GOOGLE_CALENDAR_ID=...
```

The app uses Calendar free/busy data and creates, updates and deletes events with the booking lifecycle. Without these variables, local booking/conflict management still works but no Google event is created.

### Grounded AI concierge

The deterministic catalogue concierge works without AI. For AI-written wording over the same grounded recommendations, set a valid Vercel AI Gateway key/model:

```text
AI_GATEWAY_API_KEY=...
AI_MODEL=...
```

Generated responses containing numeric prices are discarded in favour of the catalogue fallback.

### Sentry

Set `SENTRY_DSN` for lightweight server exception envelopes and `NEXT_PUBLIC_SENTRY_DSN` for browser reporting. Monitoring is designed not to block application responses.

### Cron and analytics

- Set an independent `CRON_SECRET`; `vercel.json` schedules maintenance hourly.
- Vercel Analytics and Speed Insights components are included. Enable the corresponding Vercel features for the project.
- Set `GOOGLE_SITE_VERIFICATION` only to the HTML-tag token when verifying Search Console.

## 9. Final environment and deploy

At minimum, review all values in `.env.example`, especially:

```text
NEXT_PUBLIC_SITE_URL=https://your-final-domain
AUTH_SECRET=...
ADMIN_PASSWORD=...
CRON_SECRET=...
DATABASE_URL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
DO_IT_NOW_BLOB_BASE_URL=...
```

Use the exact public HTTPS origin before the final build. Do not expose database, storage, Redis, Gmail, Calendar, Sentry or cron secrets in `NEXT_PUBLIC_` variables.

Deploy to Preview first, then Production after the checklist passes.

## 10. Live external-service verification

A local build is not proof of deployed integrations. On Preview/Production, verify:

1. `/api/health` returns 200 and reports the expected storage backend.
2. Submit a real enquiry; confirm it survives reload/redeployment and appears in Admin Pro.
3. Confirm Gmail admin notification and customer acknowledgement arrive; inspect spam initially.
4. Submit a Studio brief with a room photo and confirm the object appears in the intended Neon bucket.
5. Download the signed Studio PDF and verify it opens as a valid multipage PDF.
6. Request a portal link through the normal email path, sign in, upload a private document and confirm an anonymous request cannot read it.
7. Book a consultation, verify the time in Africa/Lagos, reschedule and cancel it; confirm slot release and ICS.
8. If Calendar is configured, verify free/busy conflicts plus event creation, update and deletion.
9. Publish/unpublish a catalogue design and a project story; confirm public pages, metadata and sitemap update and drafts return 404.
10. Upload a catalogue image and verify it persists after deployment. If direct public URLs are enabled, confirm they use only the public bucket.
11. Check every approved collateral download and the inline catalogue preview.
12. Verify the hourly cron in Vercel logs, a retryable outbox item, Sentry event ingestion, Analytics/Speed Insights and the production sitemap/robots.
13. Test mobile navigation, WhatsApp (+234 701 717 6611), keyboard controls and reduced motion.
14. Restore a recent database/file backup to a separate test environment before relying on the recovery procedure.

## 11. Local production QA

Stop other servers, then run:

```bash
npm run format
npm run lint
npm run typecheck
npm audit
npm run build
npm start
```

In another terminal:

```bash
npx playwright install --with-deps chromium
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Start a fresh production process before a complete rerun because local in-memory rate-limit tests retain attempts for the process lifetime. Use a disposable QA database; never run mutating tests against real customer production data.

## 12. Operations and recovery

Read **README.md** for the full architecture, route map, environment reference and concrete Postgres/Object Storage backup and restore procedures. Follow **SEO-GOOGLE-SEARCH-CONSOLE.md** only after the final public domain is live.
