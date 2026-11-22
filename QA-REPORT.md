# QA report — 1 November 2026

## Verified on the packaging candidate

- Node 24 production build completed successfully.
- **59 static pages** generated; dynamic APIs, project details, portal and admin routes built successfully.
- Biome formatting and lint: passed with no warnings or errors.
- TypeScript `--noEmit`: passed.
- npm dependency audit: **0 vulnerabilities**.
- Playwright production regression: **23/23 passed** against the standalone production build.

## Browser/API coverage

- Five core pages, unique metadata, active navigation, 3D scenes and reduced-motion behavior.
- Services, materials, process/FAQ and Contact interactions.
- All 26 baseline design pages, catalogue filtering/search, sitemap/robots and six approved downloads.
- Enquiry persistence, admin login, status update, CSV export and logout.
- Gmail template detail preservation and HTML escaping.
- Studio brief creation, valid signed PDF, magic-link portal session, revision request, private upload, design approval and signed-out private-file denial.
- Booking conflict rejection, rescheduling, cancellation, ICS and slot release.
- Wardrobe/TV-wall configurator mode changes, real JSON export and Studio handoff.
- Published-catalogue concierge grounding and WhatsApp handoff.
- Catalogue CMS publish/unpublish and sitemap behavior.
- Genuine project-story before/after publishing, no invented testimonial, sitemap behavior and true 404 after unpublishing.
- Database-admin TOTP MFA, role restrictions and immediate deactivation/session revocation.
- Enquiry pagination and project-stage/assignment/follow-up editing.
- Neon Object Storage/S3 environment mapping, incomplete-credential detection, private-by-default behavior and public-key URL encoding.
- Health, validation, honeypot and rate-limit behavior.
- No horizontal overflow at 390px on the advanced public workflows.
- Desktop visual review of the homepage, Studio, project stories and Admin Pro.

## Important environment boundary

The automated regression used the **local SQLite/upload fallbacks** and local-only portal magic links. The local QA environment variable is not included in this bundle. No real credentials or customer data are included.

The following require the user's actual external accounts and must be verified on Preview/Production before claiming live integration:

- Neon Postgres connectivity and Neon Object Storage bucket/credential operations.
- Upstash shared rate limiting.
- Gmail delivery and portal-link email delivery.
- Public Blob collateral redirects.
- Google Calendar free/busy and event synchronization.
- Vercel cron, Analytics and Speed Insights.
- Sentry ingestion and AI Gateway responses.
- Search Console verification/sitemap submission on the final domain.

Use the checklists in `START-HERE.md`. Configuration tests are not represented as deployed integration tests.

## Packaging and scope

- No payment/checkout/provider/payment-status functionality is present.
- Runtime databases, uploaded files, `.env.local`, dependencies, build output and QA traces are excluded.
- Backup/recovery procedures and the bounded client-side enquiry-pagination decision are documented in `README.md`.
