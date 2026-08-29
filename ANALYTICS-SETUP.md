# VelsTech Analytics & Search Console — Setup Guide

How the site measures traffic and how to connect it to Google / Bing search so you
can see what's working and grow the audience.

## 1. Cloudflare Web Analytics (live — cookieless, no consent banner)

The site uses **Cloudflare Web Analytics** for aggregate page-view metrics. It is
cookie-free and privacy-friendly, so it doesn't need a consent banner and stays
consistent with the [Privacy Policy](https://velstech.net/privacy.html).

### How it works

```
browser  →  beacon.min.js (Cloudflare edge)  →  Cloudflare Web Analytics dashboard
```

The beacon is injected by `script.js` only when a token is set:

```js
// script.js
const CF_WEB_ANALYTICS_TOKEN = "";  // ← paste your token here
```

### Enabling it

1. Cloudflare dashboard → **Analytics → Web Analytics → Add a site**.
2. Choose the **JavaScript snippet** method, copy the token.
3. Paste the token into `CF_WEB_ANALYTICS_TOKEN` in `script.js`.
4. Re-run `node tools/gen-seo.js` to bump the `?v=` cache-busting version across
   all pages (or bump `script.js?v=` manually on every page).
5. Commit and push; the feed workflow re-generates `feed.xml` automatically.

No cookies are set, and no personal data is collected, so nothing else changes.

## 2. Google Search Console (do this next)

Search is the #1 audience source for a blog like this. Google Search Console tells
you which queries you rank for, how many clicks you get, and which pages need work.

### Verify ownership

The site is verified by an **HTML meta tag** injected by `tools/gen-seo.js`:

```js
// tools/gen-seo.js
const GSC_VERIFICATION = "";  // ← paste the token, e.g. "abc123..."
```

Steps:

1. [Google Search Console](https://search.google.com/search-console) → **Add property**
   → **Domain** (`velstech.net`) or **URL prefix** (`https://velstech.net/`).
2. In the verification screen choose the **HTML tag** method and copy the token.
3. Paste it into `GSC_VERIFICATION` in `tools/gen-seo.js`.
4. Re-run `node tools/gen-seo.js` — it injects
   `<meta name="google-site-verification" content="...">` into every page.
5. Commit and push; then click **Verify** in Search Console.

> Alternative: verify via DNS TXT at the Cloudflare zone — no code change needed,
> but then nothing is documented in the repo. The meta-tag method keeps it here.

### Submit the sitemap

After verification:

1. Search Console → **Sitemaps** → `https://velstech.net/sitemap.xml` → Submit.
2. Request indexing of `https://velstech.net/` via the **URL Inspection** tool.
3. Check **Pages** → **Indexing** weekly to find pages that aren't indexed and why.

The sitemap is regenerated automatically by `node tools/gen-seo.js`.

## 3. Bing Webmaster Tools (already verified)

`BingSiteAuth.xml` exists at the site root, so Bing is verified and crawling.
You can also **import from Google Search Console** in Bing Webmaster Tools to copy
over the verified property, then submit the sitemap there too.

## 4. Keeping it all in sync

`tools/gen-seo.js` is the single source of truth for:

- canonical URLs, OG/Twitter cards, JSON-LD (BlogPosting, WebApplication, FAQPage)
- `sitemap.xml` and `robots.txt`
- GSC verification meta tag

Run it whenever you change metadata, add a page, or change the token:

```sh
node tools/gen-seo.js
```

## What to look at weekly

- **Search Console → Performance**: impressions vs clicks per query. Any query with
  many impressions but few clicks is a title/description fix.
- **Search Console → Pages**: pages not indexed → fix and request indexing.
- **Cloudflare Web Analytics → Top pages**: which articles/tools actually pull traffic.
- **Cloudflare Web Analytics → Referrers**: which sites (e.g. Reddit, HN) send visitors;
  double down where it works.
