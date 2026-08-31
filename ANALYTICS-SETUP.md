# VelsTech Analytics & Search Console – Current State

Everything below is **already set up and live** – this document records the current
configuration for future reference and shows what to do if something breaks or changes.

## 1. Cloudflare Web Analytics (live – Automatic Setup)

- **Method:** Automatic Setup. Because `velstech.net` is proxied through Cloudflare
  (orange cloud on the A records), Cloudflare injects the analytics beacon at the edge.
  **No code, no token, no consent banner.**
- **What it gives you:** cookieless aggregate page-view metrics (top pages, referrers).
- **Privacy:** no cookies, no fingerprinting, no cross-site tracking – consistent with
  the [Privacy Policy](https://velstech.net/privacy.html).

**If it stops working:**
1. Cloudflare dashboard → **Analytics → Web Analytics** → confirm the `velstech.net` site
   still exists.
2. Confirm the A records for `velstech.net` are still **proxied** (orange cloud), not
   grey (DNS-only).
3. Nothing in the repo needs to change – there is no manual beacon in `script.js`.

> Legacy note: an earlier approach used a manual `CF_WEB_ANALYTICS_TOKEN` JS beacon in
> `script.js`. This was removed because it would double-count page views alongside
> Automatic Setup. Do not re-add it.

## 2. Google Search Console (verified – DNS TXT)

- **Property type:** URL prefix → `https://velstech.net/`
- **Verification method:** DNS TXT record on the zone (in Cloudflare):
  ```
  google-site-verification=mFigNsr934Nj3-XUaf0I8avjT1KTtycR_m54Dw0KOiI
  ```
- **Sitemap:** `https://velstech.net/sitemap.xml` submitted and being crawled.

**If you ever lose verification:**
1. GSC → Settings → Ownership verification → note the required TXT value.
2. Cloudflare → DNS → add/update the `google-site-verification` TXT record for `@`.
3. Click **Verify** in GSC.

> Alternative: re-verify with the HTML tag method by pasting the token into
> `GSC_VERIFICATION` at the top of `tools/gen-seo.js`, running
> `node tools/gen-seo.js` (injects the meta tag into every page), committing, and
> pushing. The TXT method is preferred since it needs no code change.

## 3. Bing Webmaster Tools (verified)

`BingSiteAuth.xml` exists at the site root, so Bing is verified and crawling.
Sitemap is shared with Google via `robots.txt`.

## 4. Keeping it all in sync

`tools/gen-seo.js` is the single source of truth for:
- canonical URLs, OG/Twitter cards, JSON-LD (BlogPosting, WebApplication, FAQPage)
- `sitemap.xml` (includes `.hi.html` Hindi article URLs) and `robots.txt`
- optional GSC HTML-tag verification meta

Run it whenever you change metadata, add a page, or change a token:

```sh
node tools/gen-seo.js
```

## 5. Custom events (glossary + selection)

`define.js` fires analytics events when readers interact with glossary terms
(if `gtag` or `plausible` is present):

| Event | Fired when | Data |
|---|---|---|
| `glossary_ask` | Reader clicks **Ask VelsChat →** on a glossary popover | `{ term }` |
| `selection_ask` | Reader clicks the **Ask about "…"** chip after selecting text | `{ text }` |

To capture these, expose `window.gtag` (AdSense/GA4) or `window.plausible` on the
page; otherwise they are silently skipped. Cloudflare Web Analytics alone will not
see them (no JS event API in Automatic Setup).

## What to check weekly

- **Search Console → Performance:** impressions vs clicks per query. Many impressions,
  few clicks → fix the title/description.
- **Search Console → Pages:** pages not indexed → fix and request indexing.
- **Cloudflare Web Analytics → Top pages:** which articles/tools actually pull traffic.
- **Cloudflare Web Analytics → Referrers:** which sites (e.g. Reddit, HN) send visitors;
  double down where it works.
