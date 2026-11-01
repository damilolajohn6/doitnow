# Do It Now Furniture and Interior

Production-oriented fullstack website for **Do It Now Furniture and Interior** — warm custom furniture, interiors, planning guidance, approved print collateral and persistent project enquiries.

## Included

- Responsive brand website with desktop/mobile navigation and active route states.
- Dedicated Designs, About, Services, Process and Contact pages with original, room-specific content.
- Framer Motion interactions, pointer-responsive CSS 3D heroes, scroll reveals, animated panels and preloaded image crossfades.
- Reduced-motion support and semantic, keyboard-accessible controls.
- Searchable/filterable catalogue with **26 individual design pages**.
- Exactly **six kitchen directions**: three island and three no-island layouts.
- Material palettes, practical planning notes, lighting guidance and related designs.
- Six allowlisted downloads for the approved catalogue, print packages and logo.
- Persistent project enquiries using Node 24's native SQLite driver.
- Zod validation, honeypot spam handling, request-size checks and per-connection rate limits.
- HMAC-signed, HTTP-only admin sessions with an eight-hour expiry.
- Protected enquiry dashboard with search, status filters, status updates and CSV export.
- Canonical URLs, Open Graph/Twitter artwork, JSON-LD, sitemap, robots and web app manifest.
- Explicit `noindex` handling for admin screens.
- Strict TypeScript, Biome, production build and Playwright browser/API coverage.

## Runtime and package policy

Tested with **Node 24.22.2**. Node 24 is required for `node:sqlite`; Node 20 is not supported.

| Package                            | Version |
| ---------------------------------- | ------: |
| Next.js                            |  16.4.3 |
| React / React DOM                  |  19.3.1 |
| TypeScript                         |   7.0.2 |
| Tailwind CSS / PostCSS integration |   4.3.3 |
| Zod                                |   4.6.7 |
| Framer Motion                      |  14.9.0 |
| Lucide React                       |  1.66.0 |
| Biome                              |   2.6.4 |
| Playwright                         |  1.64.1 |

Dependencies are exactly pinned. `@types/node` remains on the current Node 24 line to match the runtime rather than using Node 26 types against Node 24.

## Local setup

1. Use Node 24 and install the locked dependencies:

   ```bash
   npm ci
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Replace both authentication placeholders. Suitable random values can be generated with:

   ```bash
   openssl rand -hex 32  # AUTH_SECRET
   openssl rand -hex 24  # ADMIN_PASSWORD
   ```

   Never commit `.env.local` or expose the admin password in browser code, logs or screenshots.

4. Start the development server:

   ```bash
   npm run dev -- --hostname 0.0.0.0 --port 3000
   ```

5. Open `http://localhost:3000`. The admin screen is at `/admin`.

## Environment variables

| Variable                   | Required    | Purpose                                                                                                                                                                    |
| -------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`     | Production  | Exact public origin, for example `https://www.example.com`. Set it **before building** so static canonical URLs, sitemap entries and structured data use the final domain. |
| `AUTH_SECRET`              | Admin login | Independent high-entropy secret used to sign admin sessions. Rotating it invalidates existing sessions.                                                                    |
| `ADMIN_PASSWORD`           | Admin login | Long, unique administrator password. It is compared in constant time and is never sent to the browser bundle.                                                              |
| `GOOGLE_SITE_VERIFICATION` | Optional    | Only the token from Google's HTML-tag verification option. See `SEO-GOOGLE-SEARCH-CONSOLE.md`.                                                                             |
| `DO_IT_NOW_ASSET_ROOT`     | Optional    | Absolute directory containing the six approved collateral files. Defaults to the parent directory of the application.                                                      |
| `PLAYWRIGHT_BASE_URL`      | Optional    | Existing local/staging server for browser tests. Leave unset to let Playwright start its own development server.                                                           |

## Approved collateral directory

The download API uses a fixed allowlist; request paths cannot select arbitrary filesystem files. Place these exact filenames in `DO_IT_NOW_ASSET_ROOT`:

```text
catalogue.pdf
do-it-now-catalogue-70-a4-pages-14pt.zip
do-it-now-catalogue-a3-booklet-illustrator-artboards.zip
A5-Flyers-14pt.zip
do-it-now-business-card-front-back-14pt.zip
logo.png
```

In this workspace, the default parent-directory configuration already finds the supplied files. In Docker, mount them read-only at `/app/collateral`.

## Persistence and security model

- SQLite is created automatically at `data/enquiries.sqlite` with WAL mode, constraints, indexes and a busy timeout.
- Mount `/app/data` on a persistent volume in production. Do not run the application with ephemeral container storage.
- Use **one application instance** with this SQLite/in-memory-rate-limit architecture. For horizontal scaling, migrate persistence and throttling to shared services first.
- Back up SQLite with a SQLite-aware backup procedure; do not rely on copying only the live main database file.
- Admin cookies are HTTP-only, SameSite=Lax and Secure in production. Authentication and enquiry mutations are rate limited per connection.
- Terminate HTTPS at a trusted reverse proxy/platform and preserve the real client-address headers. In-memory limits are per process.
- Public APIs use JSON and do not enable cross-origin access. Security headers are configured in `next.config.mjs`.
- The application requires a Node 24 server. An ephemeral serverless filesystem is not appropriate for the enquiry database or local collateral files.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

Twelve Playwright tests cover the five core pages, active navigation, 3D scenes, keyboard and pointer interactions for services/process/palettes, reduced motion, mobile navigation, the six kitchen designs, all 26 detail pages, SEO routes, security headers, validation, honeypot handling, throttling, all downloads, a real Contact-page SQLite enquiry, admin login, status update, CSV export and logout.

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Run browser tests with Node 24 against a local or staging database. The authenticated test creates a uniquely named `Browser QA …` enquiry and deletes that test record in `finally`; it does not leave test data in the dashboard. The admin test is skipped only if `ADMIN_PASSWORD` is not configured.

## Production: persistent Node server

```bash
npm ci
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

Before building, configure the final `NEXT_PUBLIC_SITE_URL`. At runtime, provide the authentication variables, a writable `data/` directory and the collateral directory. Put the process behind HTTPS and a process supervisor. `/api/health` reports catalogue/download readiness.

## Production: Docker

Build the standalone image with the final public origin:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://www.example.com \
  --build-arg GOOGLE_SITE_VERIFICATION=optional-google-token \
  -t do-it-now-web .
```

Run it with runtime secrets, a persistent database volume and read-only collateral:

```bash
docker run -d \
  --name do-it-now-web \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=https://www.example.com \
  -e AUTH_SECRET=replace-with-a-strong-runtime-secret \
  -e ADMIN_PASSWORD=replace-with-a-long-unique-password \
  -v do-it-now-data:/app/data \
  -v /absolute/path/to/collateral:/app/collateral:ro \
  do-it-now-web
```

The container runs as an unprivileged user, exposes port 3000 and includes a health check. Set the public origin at both build and runtime for consistent static and dynamic metadata. Do not pass `AUTH_SECRET` or `ADMIN_PASSWORD` as Docker build arguments.

## SEO and Google Search Console

The app generates:

- `/sitemap.xml` — **32 public URLs**: homepage, five core pages and all 26 design URLs.
- `/robots.txt` — sitemap reference; admin and API routes disallowed.
- `/manifest.webmanifest` — install metadata and 192/512 px icons.
- Canonical URLs, Open Graph/Twitter cards and Organization, WebSite, ItemList, CreativeWork and Breadcrumb structured data.
- `/images/og-do-it-now.jpg` — 1200 × 630 social artwork.

Follow **`SEO-GOOGLE-SEARCH-CONSOLE.md`** after deploying to a public HTTPS domain. Actual Search Console verification and sitemap submission require the user's public domain and Google Search Console access; they cannot be completed from a local preview.

## Project map

```text
app/                    Public pages, admin pages, APIs and SEO routes
components/             Public/admin client and server components
lib/                    Typed catalogue, SQLite, validation, auth and throttling
public/images/          Optimized design/brand/social artwork
public/icons/           Web app manifest icons
scripts/prepare_assets.py  Rebuilds optimized approved image assets
tests/                  Playwright browser and API tests
Dockerfile              Standalone Node 24 production image
```
