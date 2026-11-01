# Do It Now website — local testing and Vercel deployment

This bundle is adapted for **Vercel** while retaining a complete local-development path.

- **Local:** SQLite enquiries, bundled collateral files and in-memory rate limiting.
- **Vercel:** Neon Postgres enquiries, public Vercel Blob collateral and shared Upstash Redis rate limiting.
- Vercel automatically sets `VERCEL=1`; the application selects the production drivers at runtime.

The source uses Next.js 16, React 19, TypeScript and Tailwind CSS. The six approved collateral files remain in the bundle root for local use and for the one-time Blob upload.

Not included: `node_modules`, `.next`, build caches, enquiry data, QA traces or real secrets.

## 1. Requirements

Install **Node.js 24** and npm. Node 20 is not supported locally because the local driver uses `node:sqlite`.

```bash
node --version
npm --version
```

## 2. Configure and run locally

Open a terminal in the extracted `do-it-now-web` folder.

macOS / Linux:

```bash
cp .env.example .env.local
```

Windows Command Prompt:

```bat
copy .env.example .env.local
```

Edit `.env.local` and replace `AUTH_SECRET` and `ADMIN_PASSWORD` with private values. Leave the Vercel service values empty for local SQLite mode. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local testing.

Generate strong secrets with:

```bash
openssl rand -hex 32
openssl rand -hex 24
```

Install and start:

```bash
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open:

- Website: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Health: `http://localhost:3000/api/health`

Local enquiries are stored in `data/enquiries.sqlite`. Keep the six collateral files in the bundle root beside `do-it-now-web`, or set `DO_IT_NOW_ASSET_ROOT` to their absolute directory.

## 3. Deploy to Vercel

### A. Put the application in Git

Push the project to a Git provider supported by Vercel and import it.

- If the repository contains the whole extracted bundle, set Vercel's **Root Directory** to `do-it-now-web`.
- If the repository contains only the application files, leave the root at `/`.
- Keep Vercel's detected **Next.js** framework preset and default install/build commands. No `vercel.json` is required.
- `package.json` selects Node 24. Vercel's native Next.js output is used automatically; the local standalone launcher is not used on Vercel.

### B. Connect Neon Postgres

In the Vercel project, open **Storage** and create/connect **Neon Postgres** through Vercel Marketplace. Connect it to both **Production** and **Preview**.

The integration normally supplies `DATABASE_URL`. `POSTGRES_URL` is also accepted. The application creates its enquiry table and indexes idempotently on the first database request; no manual SQL import is required.

Neon and local SQLite are separate stores. This bundle does not migrate an existing local SQLite database automatically.

### C. Connect Upstash Redis

Create/connect **Upstash Redis** through Vercel Marketplace for Production and Preview. Ensure these variables are present:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

The compatible `KV_REST_API_URL` and `KV_REST_API_TOKEN` aliases are also accepted. This is shared, serverless-safe rate limiting for enquiry submission and admin authentication/update routes.

If Redis is absent or unavailable on Vercel, protected mutations return HTTP 503 rather than silently disabling rate limiting.

### D. Create public Blob storage and upload the six files

Create a **public Vercel Blob** store. In its dashboard, create a read/write token and note the store ID.

Add these values to your **local** `.env.local` only:

```text
BLOB_READ_WRITE_TOKEN=your-private-upload-token
BLOB_STORE_ID=your-store-id
```

Never commit `.env.local`. The upload token is not a browser environment variable and is not needed by the deployed download route.

From `do-it-now-web`, with the six collateral files still in its parent directory, run:

```bash
npx vercel login
npx vercel link
npm run blob:upload
```

The script uses the official Vercel CLI and uploads these public objects under `do-it-now/`:

1. `Do-It-Now-Catalogue.pdf`
2. `Do-It-Now-A4-Pages-14pt.zip`
3. `Do-It-Now-A3-Booklet.zip`
4. `Do-It-Now-A5-Flyers-14pt.zip`
5. `Do-It-Now-Business-Card-Front-Back-14pt.zip`
6. `Do-It-Now-Logo.png`

Existing objects with those exact pathnames are overwritten deliberately. The script prints the base URL when `BLOB_STORE_ID` is set. Add that value to Vercel Production and Preview:

```text
DO_IT_NOW_BLOB_BASE_URL=https://your-store-id.public.blob.vercel-storage.com/do-it-now
```

Use your real store ID. Do not append a filename. On Vercel, `/api/downloads/...` returns a redirect to Blob and adds `?download=1` for attachment downloads; the catalogue's inline preview remains inline.

### E. Set the remaining Vercel environment variables

Add these for Production and Preview as appropriate:

| Variable                                              | Purpose                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `AUTH_SECRET`                                         | Independent 64+ character random value for admin cookie signing. |
| `ADMIN_PASSWORD`                                      | Long, unique private admin password.                             |
| `NEXT_PUBLIC_SITE_URL`                                | Exact public HTTPS origin, without a trailing slash.             |
| `GOOGLE_SITE_VERIFICATION`                            | Optional Search Console HTML-tag token only.                     |
| `DATABASE_URL`                                        | Normally injected by Neon; required for durable enquiries.       |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Normally injected by Upstash; required for shared rate limits.   |
| `DO_IT_NOW_BLOB_BASE_URL`                             | Public Blob prefix from step D.                                  |

`NEXT_PUBLIC_SITE_URL` is embedded at build time. If you add or change the custom domain, update it and redeploy before submitting the sitemap to Google.

Do not place database, Redis or Blob read/write credentials in any `NEXT_PUBLIC_` variable.

### F. Deploy and verify

Deploy, then check all of the following on the Vercel URL:

1. `/api/health` returns HTTP 200 with `"ok": true`.
2. The home, Designs, About, Services, Process and Contact pages render.
3. Submit an enquiry and confirm it appears in `/admin` after login.
4. Reload the admin page and confirm the enquiry remains. For a stronger persistence check, verify it again after a later deployment.
5. Update the enquiry status and confirm the new status survives a reload.
6. Open all six download links and confirm the expected filenames/files.
7. Open the catalogue preview and confirm it displays inline.
8. Test the production domain's `robots.txt` and `sitemap.xml`, then follow `SEO-GOOGLE-SEARCH-CONSOLE.md`.

A clean local build cannot prove that external Marketplace credentials, Blob objects or production networking are correct. Complete this staging checklist before treating the deployment as live-ready.

## 4. Local production build and automated tests

Stop the development server:

```bash
npm run format
npm run lint
npm run typecheck
npm audit
npm run build
npm run start
```

The start script launches the standalone production server on `http://localhost:3000`.

Optional browser/API tests:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Start a fresh production process before rerunning the complete suite because the local in-memory rate-limit test intentionally retains attempts for the life of that process. The authenticated test creates and cleans up its own `Browser QA …` enquiry in the configured local data store.

## 5. Health and configuration troubleshooting

On Vercel, `/api/health` checks required configuration and database connectivity. It returns HTTP 503 with a safe message when setup is incomplete:

| Message                                   | Action                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL is required.`               | Connect Neon or add the Postgres connection string.                         |
| `Upstash Redis credentials are required.` | Add the supported Upstash or KV REST variable pair.                         |
| `DO_IT_NOW_BLOB_BASE_URL is required.`    | Add the public Blob prefix after uploading.                                 |
| `The enquiry store is unavailable.`       | Check Neon status, connection string, database permissions and Vercel logs. |

HTTP 503 from a protected form/login route can also mean the shared rate-limit service is unavailable. HTTP 429 means a rate limit was reached and includes a retry delay.

## 6. Optional Docker/local-server deployment

The Dockerfile remains available for a non-Vercel persistent Node deployment. It requires a persistent `/app/data` volume, the six files under `/app/collateral`, one application instance for local SQLite/in-memory mode, HTTPS and backups. Vercel does not use this Dockerfile.

## 7. Final public-domain steps

Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS origin **before the production build**. After deployment, follow `SEO-GOOGLE-SEARCH-CONSOLE.md` for Google verification and sitemap submission.
