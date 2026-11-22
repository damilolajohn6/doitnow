# Do It Now Furniture and Interior

A production-oriented Next.js website and client workspace for **Do It Now Furniture and Interior**. It combines the approved design catalogue and collateral with project planning, consultation booking, customer approvals, content management and operational tooling.

**There is deliberately no checkout, payment provider, payment record or payment-status feature.**

## Product capabilities

### Public website

- Responsive Designs, About, Services, Process and Contact pages with Framer Motion, CSS 3D scenes, reduced-motion support and active navigation.
- Searchable/filterable catalogue with 26 baseline design pages and draft/published CMS overrides.
- Exactly six baseline kitchen directions: three island and three no-island layouts.
- Genuine project-story CMS with before/after evidence and optional permissioned testimonials. No stories or testimonials are fabricated or seeded.
- Six allowlisted collateral downloads, dynamic design Open Graph artwork, canonical metadata, JSON-LD, sitemap, robots and manifest.
- Vercel Analytics, Speed Insights and conversion-event instrumentation.
- Floating WhatsApp and catalogue-grounded design concierge; no price generation.

### Advanced client workflows

- **Smart Project Studio:** five-step brief, dimensions, budget range, timeline, favourites, room-photo uploads, signed multipage PDF and project creation.
- **3D configurators:** React Three Fiber wardrobe/TV-wall scenes with dimensions, materials, JSON export and Studio handoff.
- **Consultation booking:** Africa/Lagos availability, 60-minute appointments, 24-hour notice, atomic slot reservation, ICS, confirmation/reminder outbox, rescheduling, cancellation and optional Google Calendar sync.
- **Passwordless portal:** 30-minute single-use magic links, hashed seven-day sessions, project stages, appointments, revision requests, design approval and ownership-checked private uploads.
- **Design concierge:** recommendations grounded only in published catalogue content, deterministic fallback and WhatsApp handoff. AI responses containing generated numeric prices are rejected.

### Admin Pro and operations

- Bounded enquiry loading with clearly labelled 25-row client-side pagination over that loaded dataset.
- Assignment, internal notes, follow-ups, project stages, customer-visible activity and CSV export.
- Booking administration, catalogue/story publishing, image uploads and SEO fields.
- Environment owner plus database owner/manager accounts, scrypt password hashes, optional TOTP MFA, activation controls and per-request active-user validation.
- Audit logs, durable Gmail outbox, exponential retries and manual retry controls.
- Protected hourly maintenance for due emails, expired portal credentials, completed bookings and old slot cleanup.
- Health endpoint, optional Sentry server/browser monitoring and documented backup/recovery procedures.

## Architecture

| Layer               | Production recommendation                             | Local option                                                          |
| ------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Web/compute         | Vercel Next.js Functions                              | Next.js on Node 24                                                    |
| Relational data     | Neon Postgres                                         | SQLite **or a Neon development branch**                               |
| Dynamic files       | **Neon Object Storage** through its S3-compatible API | Same Neon bucket, another S3-compatible provider, Blob or local files |
| Shared throttling   | Upstash Redis REST                                    | In-memory limits for local QA only                                    |
| Approved collateral | Public Vercel Blob prefix                             | Six approved files on disk                                            |
| Email               | Gmail/Nodemailer with durable database outbox         | Same configuration; safely skipped when unconfigured                  |
| Calendar            | Google service-account Calendar API                   | Optional; local booking works without it                              |

Neon Postgres and Neon Object Storage are complementary: Postgres holds rows and metadata; Object Storage holds file bytes. **Setting `DATABASE_URL` locally removes SQLite from the local path as well.** SQLite is only a fallback when no database URL is configured and the app is not running on Vercel.

## Runtime and package policy

- Node **24.x** is required. Node 20 is not supported for the local SQLite fallback.
- Next.js 16, React 19, TypeScript 7, Tailwind CSS 4 and exactly pinned direct dependencies.
- `@aws-sdk/client-s3` communicates with Neon Object Storage; no AWS account is required when using Neon credentials.
- All application source is TypeScript and styling uses Tailwind plus scoped CSS modules/stylesheets for the advanced interfaces.

## Quick start

```bash
npm ci
cp .env.example .env.local
```

Generate private values:

```bash
openssl rand -hex 32  # AUTH_SECRET
openssl rand -hex 24  # ADMIN_PASSWORD
openssl rand -hex 32  # CRON_SECRET
```

Edit `.env.local`, then run:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open `http://localhost:3000`; Admin Pro is at `/admin`.

- Leave `DATABASE_URL` empty for the automatic local SQLite fallback.
- Set `DATABASE_URL` to a **Neon development branch** to use Neon locally and avoid SQLite.
- Leave external credentials empty to exercise deterministic/local fallbacks. Production external-service verification is a separate step.

## Neon Object Storage setup

Neon Object Storage is S3-compatible and branch-scoped. The application uses Neon for file bytes while storing each upload's owner, key, content type, size and visibility in Postgres.

### 1. Enable storage and create buckets

In the Neon Console, select the database branch and open **Object storage**. Create:

```text
do-it-now-private    private
do-it-now-public     public_read (optional)
```

The private bucket alone is sufficient: public catalogue images can be served through `/api/files/[id]` with public cache headers while customer files remain ownership-checked. Use the separate public bucket only when direct public object URLs are desired. Never make the customer/private bucket publicly readable.

The Neon CLI equivalent is:

```bash
neon buckets create do-it-now-private
neon buckets create do-it-now-public --access-level public_read
```

### 2. Create a scoped credential

Create a credential with both `storage:read` and `storage:write` on the matching branch:

```bash
neon credentials create --scope storage:read --scope storage:write --name do-it-now-vercel
```

Map the returned values exactly:

| Neon value             | Application variable    |
| ---------------------- | ----------------------- |
| `token_id`             | `AWS_ACCESS_KEY_ID`     |
| `s3_secret_access_key` | `AWS_SECRET_ACCESS_KEY` |
| Storage region         | `AWS_REGION`            |
| Branch S3 endpoint     | `AWS_ENDPOINT_URL_S3`   |

Alternatively, `neon env pull --file .env.local` can populate the standard variables for a linked local branch. Credentials are branch-scoped; do not point Preview at production credentials accidentally.

### 3. Select the buckets in the app

```text
S3_BUCKET=do-it-now-private
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_ENDPOINT_URL_S3=...
```

The adapter automatically enables path-style addressing for Neon/custom S3 endpoints. To use the optional public bucket for catalogue/story assets, also set:

```text
S3_PUBLIC_BUCKET=do-it-now-public
S3_PUBLIC_BASE_URL=https://your-branch-storage-host/do-it-now-public
```

Do not append an object key to the base URL. Set the public URL before building so Next.js can allow that HTTPS image hostname. If no public bucket/base is configured, all objects remain in the private bucket and are read through the application.

Generic S3-compatible services can use `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT` and optional `S3_FORCE_PATH_STYLE=true` instead of the standard AWS-named values.

### 4. Verify with real credentials

Configuration-level/local testing cannot prove a Neon bucket credential works. With the actual branch credentials:

1. Submit a room photograph in Studio and confirm it appears in the intended Neon bucket.
2. Open its authenticated file URL and verify the correct content type.
3. Upload a catalogue image through Admin Pro and verify it renders after reload.
4. Upload a private portal document; confirm the owner/admin can read it and a signed-out/anonymous request receives 404.
5. Repeat against Preview with Preview-branch credentials, then against Production with Production credentials.

## Vercel deployment summary

1. Import the repository with the Next.js preset and Node 24.
2. Connect Neon Postgres and Upstash Redis to Production and Preview.
3. Configure Neon Object Storage as above, or use the existing Blob upload fallback.
4. Upload the six approved collateral objects with `npm run blob:upload` and set `DO_IT_NOW_BLOB_BASE_URL`.
5. Add the environment variables from `.env.example`; never expose secrets through `NEXT_PUBLIC_` variables.
6. Set the exact `NEXT_PUBLIC_SITE_URL` before the final build.
7. Deploy and complete the external-service checklist in **START-HERE.md**.

On Vercel, a missing Neon/Postgres URL, Upstash pair or collateral base fails health/configuration checks rather than silently falling back to ephemeral SQLite.

## Main environment groups

| Variables                                                                                        | Purpose                                                        |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`, `GOOGLE_SITE_VERIFICATION`                                               | Canonical origin and optional Search Console token             |
| `AUTH_SECRET`, `ADMIN_PASSWORD`, `CRON_SECRET`                                                   | Admin sessions, environment-owner login and cron authorization |
| `DATABASE_URL` / `POSTGRES_URL`                                                                  | Neon Postgres                                                  |
| `S3_BUCKET`, `S3_PUBLIC_BUCKET`, `S3_PUBLIC_BASE_URL`                                            | S3/Neon bucket selection and optional direct public URLs       |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ENDPOINT_URL_S3`                | Neon Object Storage credential/endpoint                        |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                                             | Shared serverless rate limits                                  |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `ENQUIRY_NOTIFICATION_EMAIL`, `ENQUIRY_SEND_ACKNOWLEDGEMENT` | Durable Gmail notifications and acknowledgements               |
| `GOOGLE_CALENDAR_CLIENT_EMAIL`, `GOOGLE_CALENDAR_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`              | Optional Calendar free/busy and event synchronization          |
| `AI_GATEWAY_API_KEY`, `AI_MODEL`                                                                 | Optional AI wording over grounded catalogue recommendations    |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`                                                           | Optional server/browser error reporting                        |
| `DO_IT_NOW_BLOB_BASE_URL`                                                                        | Public approved-collateral prefix                              |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_PRIVATE_READ_WRITE_TOKEN`                                         | Blob upload fallback when S3 is not selected                   |
| `DO_IT_NOW_ASSET_ROOT`, `DO_IT_NOW_DATA_DIR`                                                     | Local collateral and SQLite/upload directories                 |
| `PLAYWRIGHT_BASE_URL`                                                                            | Existing QA server target                                      |

`PORTAL_DEV_MAGIC_LINKS=true` is a local-QA-only switch that returns a portal magic link in the request-link API response. **Never enable it in Preview or Production.** Normal deployments prepare the link through the email workflow.

## Scheduled maintenance and monitoring

`vercel.json` schedules `/api/cron/maintenance` hourly. Vercel sends the cron bearer credential when `CRON_SECRET` is configured. The route:

- processes up to 50 due outbox messages;
- deletes expired portal sessions/tokens;
- marks ended bookings completed;
- removes old slot-reservation rows.

`/api/health` checks required production configuration and database/schema availability and reports the selected dynamic-file backend. It does not claim to prove Gmail delivery, Calendar access, Sentry ingestion or S3 permissions; use the external-service checks for those.

## Backup and recovery

### Neon Postgres

- Keep Neon point-in-time recovery/backup features appropriate to the plan enabled and record the recovery window.
- For an independent logical backup, run `pg_dump --format=custom --file=do-it-now-YYYY-MM-DD.dump "$DATABASE_URL"` on a secured scheduled worker.
- Restore first to a **new Neon branch/database**, run the application health check and verify representative enquiries, bookings, portal ownership and admin accounts before switching `DATABASE_URL`.
- Use `pg_restore` only against the intended restoration target; never test a destructive restore against production.

### Neon Object Storage

Branching is copy-on-write isolation, **not an independent backup**. Maintain periodic offline or separately protected copies of both buckets. With the AWS CLI and the same endpoint/credential model:

```bash
aws s3 sync s3://do-it-now-private ./backups/private --endpoint-url "$AWS_ENDPOINT_URL_S3"
aws s3 sync s3://do-it-now-public ./backups/public --endpoint-url "$AWS_ENDPOINT_URL_S3"
```

Restore to an empty test bucket first, compare object counts and sample downloads, then restore deliberately. Keep metadata backups consistent with object backups so Postgres keys do not point to missing files.

### Approved collateral and local fallback

- The six approved collateral files are source-controlled delivery assets; retain an independent original ZIP and re-upload with `npm run blob:upload` if necessary.
- For the optional SQLite fallback, stop writes and use a SQLite-aware consistent backup (for example SQLite's `.backup` command), then back up `data/uploads/` alongside it. Do not copy only a live main database file.
- Document and exercise a recovery drill: restore to a separate environment, run `/api/health`, sign in, read a private file and verify a booking before cutover.

## Quality checks

```bash
npm run format
npm run lint
npm run typecheck
npm audit
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

The Playwright suite covers baseline public pages, all 26 designs, downloads, enquiry/admin flows, Studio/PDF/portal ownership, booking conflicts/rescheduling/cancellation/ICS, 3D export, concierge grounding, mobile overflow, catalogue publishing, project-story publishing, MFA/roles/deactivation and project-stage editing.

Use a fresh production process before the complete suite because the local in-memory rate-limit test intentionally retains attempts for that process. Tests create uniquely named records and clean them in `finally`; do not run them against a production database containing real customer data.

## Important routes

```text
/studio                         Guided project brief and PDF
/configurator                   Interactive wardrobe/TV-wall configurators
/book                           Consultation booking
/bookings/manage/[token]        Reschedule/cancel appointment
/concierge                      Grounded design concierge
/stories                        Genuine published project stories
/portal                         Passwordless customer portal
/admin                          Enquiries and project pipeline
/admin/projects                 Admin Pro project management
/admin/bookings                 Booking administration
/admin/content                  Catalogue CMS
/admin/stories                  Before/after and testimonial CMS
/admin/users                    Roles, passwords and MFA
/admin/system                   Outbox and audit log
/api/health                     Configuration/database health
```

## SEO and external verification

The sitemap contains the homepage, core/advanced pages, published project stories and published catalogue designs. Follow **SEO-GOOGLE-SEARCH-CONSOLE.md** after deploying the final public domain. Search Console submission, live Gmail delivery, Google Calendar synchronization, Neon Object Storage permissions, AI Gateway responses, Sentry ingestion and Vercel cron/runtime behavior require actual external accounts and must not be represented as verified by a local build alone.
