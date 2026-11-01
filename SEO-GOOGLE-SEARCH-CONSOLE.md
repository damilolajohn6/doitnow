# Google Search Console launch guide

Complete these steps **after the website is deployed to its permanent public HTTPS domain**. A localhost address or temporary preview URL is not the final property to submit.

## 1. Prepare the canonical public origin

1. Choose the preferred origin, for example `https://www.example.com` or `https://example.com`.
2. Configure the other host to redirect to the preferred one at the DNS/hosting/platform layer.
3. Set the preferred origin without a trailing slash:

   ```env
   NEXT_PUBLIC_SITE_URL=https://www.example.com
   ```

4. Set this variable **before the production build**, then deploy the new build. Static design metadata and the generated sitemap are produced during the build.
5. Confirm the site loads with HTTPS and no certificate or mixed-content warnings.

## 2. Run the public SEO checks

Replace `https://www.example.com` with the real origin:

- `https://www.example.com/` returns 200 and has a canonical link to the preferred origin.
- `https://www.example.com/sitemap.xml` returns XML with **32 URLs**: the homepage, Designs, About, Services, Process, Contact and 26 individual design pages.
- `/designs`, `/about`, `/services`, `/process` and `/contact` each return 200 with unique content, metadata and canonical URLs.
- `https://www.example.com/robots.txt` returns 200, references the absolute sitemap URL and disallows `/admin` and `/api/`.
- `https://www.example.com/manifest.webmanifest` returns valid JSON.
- `https://www.example.com/images/og-do-it-now.jpg` returns the 1200 × 630 social image.
- A design page contains CreativeWork and Breadcrumb JSON-LD, a unique title/description and its own canonical URL.
- `/admin` and `/admin/login` require authentication as appropriate and contain `noindex` metadata.

The browser/API suite can also be run against a staging deployment, but use a disposable staging database for its authenticated enquiry test.

## 3. Add and verify the Search Console property

Sign in to [Google Search Console](https://search.google.com/search-console/) with the Google account that should own the property. Never share the account password; grant property permissions to another Google user if delegation is needed.

### Recommended: Domain property

1. Choose **Domain** and enter the bare domain, such as `example.com`.
2. Google provides a DNS TXT record.
3. Add that TXT record with the domain's DNS provider and wait for DNS propagation.
4. Return to Search Console and select **Verify**.

A Domain property covers HTTP/HTTPS and www/non-www variants. DNS verification does not require the website's `GOOGLE_SITE_VERIFICATION` variable.

### Alternative: URL-prefix property with the built-in HTML-tag support

1. Choose **URL prefix** and enter the exact preferred origin, including `https://` and the www choice.
2. Expand the **HTML tag** verification method.
3. Google shows a tag similar to:

   ```html
   <meta name="google-site-verification" content="TOKEN_VALUE" />
   ```

4. Copy **only `TOKEN_VALUE`**, not the full HTML tag, into the deployment environment:

   ```env
   GOOGLE_SITE_VERIFICATION=TOKEN_VALUE
   ```

5. Build and redeploy with that variable present.
6. View the homepage source and confirm that `google-site-verification` metadata contains the expected token.
7. Return to Search Console and select **Verify**. Keep the token deployed to preserve verification.

## 4. Submit the sitemap

1. Open the verified property.
2. Go to **Sitemaps**.
3. Under **Add a new sitemap**, enter:

   ```text
   sitemap.xml
   ```

   If Search Console requests a full URL, use `https://www.example.com/sitemap.xml` with the real origin.
4. Submit and later confirm that the status says the sitemap could be fetched. Discovery and processing are not always immediate.

Do not submit temporary preview URLs, individual image URLs or the admin area.

## 5. Request initial indexing checks

Use **URL Inspection** for:

1. The homepage.
2. One high-priority kitchen design.
3. One wardrobe design.
4. One TV-feature-wall design.
5. The Services page.
6. The Contact page.

Confirm that Google can fetch the page, then use **Request indexing** where available. Requesting indexing does not guarantee a ranking or a specific indexing time.

## 6. Monitor after launch

- **Pages / Page indexing:** review discovered, crawled and indexed URL counts and exclusions.
- **Sitemaps:** watch fetch status and detected URL count.
- **Performance:** review queries, impressions, clicks, click-through rate and average position after enough data accumulates.
- **Rich results / enhancements:** investigate any structured-data eligibility warnings without assuming every schema type produces a rich result.
- **Manual actions and Security issues:** investigate any unexpected notices promptly.

Recheck after content launches, domain changes or major template updates. If the canonical domain changes, update `NEXT_PUBLIC_SITE_URL`, rebuild, configure permanent redirects and verify the appropriate new property.

## Access boundary

Search Console verification and sitemap submission cannot be completed from this local workspace alone. They require the deployed public domain and the user's Google Search Console/DNS access. The website is technically prepared; the account-owner actions above remain.
