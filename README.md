# VelsTech Website

Static site at **velstech.net** – plain-language tech guides, free tools, real hardware benchmarks, and buying guides, with a focus on **local AI, Linux, hardware, and India-market tech**.

## Quick start

```sh
# Regenerate everything after adding content
python3 tools/gen-og-images.py   # OG images per article
node tools/gen-seo.js             # SEO meta, sitemap, robots.txt
node tools/gen-feed.js            # Atom feed
node tools/gen-benchmarks.js      # Benchmark detail pages
node tools/gen-search-index.js    # Prebuilt search index (103 entries)

# Keep boilerplate/versions canonical (see Boilerplate & versioning below)
node tools/build.js check

# Check syntax
node --check tools/*.js

# Run unit tests (CI runs this in build-check.yml)
node --test tests/*.test.js
```

## Project structure

| Path | What |
|---|---|
| `*.html` | Articles, tools, category pages, static pages (English) |
| `*.hi.html` | Hindi translations (all pages) |
| `*.ta.html` | Tamil translations (all pages) |
| `articles.js` | **Content source of truth** – all article metadata |
| `i18n.js` | **EN/TA/HI** UI strings + `vt-lang` persistence + `VelsI18n` API |
| `whatsnew-core.js` | Pure functions powering the homepage "Latest" section (`matchesFilter`, `sortByRecency`, `pickLatest`, `formatLatestCount`). Loaded as a `<script>` on every page; required by `tests/whatsnew.test.js` |
| `glossary.js` | 40+ tech-term definitions (`fullForm`/`short`/`link`) |
| `define.js` | Auto-wraps glossary terms + popover + selection-to-chat |
| `glossary.css` | Glossary term/popover/selection-chip styling |
| `chat-proxy.js` | Cloudflare Worker entry point (`fetch` event, provider routing, rate limiting) for `chat.velstech.net` |
| `chat-proxy-core.js` | Pure helpers used by `chat-proxy.js`: `getCorsOrigin`, `rateOK`, `pruneHits`, `toAnthropicMessages`, `convertCloudflareStream`, `convertAnthropicStream`, + guardrails `validateMessages`, `clampOptions`, `allowedModel`, `validateFeedUrl`, `readCapped`. Required by `tests/chat-proxy.test.js` |
| `velstech.pws` | `aspell` personal dictionary (111 tech terms) |
| `tests/` | Unit tests (`node --test`) for `whatsnew-core.js` + `chat-proxy-core.js`; opt-in browser test for the EN/TA/HI toggle (skips without Chrome) |
| `benchmarks/data.json` | Benchmark results (tested + estimated) |
| `benchmarks/*.html` | Generated benchmark detail pages |
| `og/*.png` | Per-article OG images (1200×630) |
| `tools/` | Generators + scripts |
| `.github/workflows/` | CI/CD pipelines |
| `tools/posted-articles.json` | State tracking for social auto-poster |

## Content types

### Articles (43 total)
Registered in `articles.js` with title, URL, date, category, tags, description, and optional `faq` array. Articles appear in the RSS feed, homepage "Latest" section, Mastodon auto-posts, and category hubs. 28 articles ship with `faq` arrays – rendered visibly on-page by `initFaq()` (script.js) and mirrored as FAQPage JSON-LD by `gen-seo.js`. (Note: Google restricted FAQ rich results to gov/health sites in 2023 – the visible Q&As still serve featured snippets, AI answer engines, and readers.)

**To add an article:**
1. Create `your-article.html` with [BlogPosting JSON-LD](https://schema.org/BlogPosting)
2. Add entry to `articles.js` (newest first, optional `faq` for rich results)
3. Run `python3 tools/gen-og-images.py && node tools/gen-seo.js && node tools/gen-feed.js`
4. Optionally add to a category hub page (`ai.html`, `hardware.html`, etc.)
5. Bump `articles.js?v=N` across all pages via `perl -pi -e 's/articles\.js\?v=N/articles.js?v=N+1/' -- *.html`
6. Commit and push → auto-posts to Mastodon

### Tools (36 total)
Standalone HTML pages with inline JS, registered in `tools/gen-seo.js` `TOOLS_META` for schema + sitemap. Organized by category on `tools.html`.

Includes interactive web apps: **LLM Playground** (streaming multi-model chat via the AI proxy), **Benchmark Explorer** (filters your `benchmarks/data.json`), **Model Comparison Wizard**, **VRAM Budget Planner**, **Prompt Library & Editor**, **RAG: Ask Your File** (client-side chunking + scoring), **Markdown Notes** and **Bookmarks** (both localStorage), a **Config Generator Studio**, and an **RSS Aggregator** (feed fetching via the AI proxy).

**To add a tool:**
1. Create `your-tool.html` with WebApplication JSON-LD
2. Add entry to `TOOLS_META` in `tools/gen-seo.js`
3. Add card to the appropriate section in `tools.html`
4. Add HI/TA translations (`your-tool.hi.html` / `your-tool.ta.html`) if the page should be translated
5. Run `node tools/gen-seo.js`

### Benchmark database (17 generated pages)
Structured GPU × model × quantization results in `benchmarks/data.json`. Each entry
generates a detail page per backend (e.g. ROCm and Vulkan).

**To add a benchmark:**
1. Add a row to `benchmarks/data.json`
2. Run `node tools/gen-benchmarks.js && node tools/gen-seo.js`

### Buying guides (4 pages)
Standalone decision-oriented pages at `/buying-guides.html`, wired with `data-amazon` affiliate links.

### Category hubs (7 pages)
`ai.html`, `hardware.html`, `os.html`, `networking.html`, `security.html`, `programming.html`, `tutorials.html` – each rebuilt as a learning-progression hub with tiers (Start here → Go deeper → Tools → Roadmap).

## Internationalization (EN / TA / HI)

The site has a **language toggle** in the nav (`script.js` `navHTML()` → `lang-switch`) that
persists `vt-lang` in `localStorage`, sets `<html lang>` on every page, and drives the UI.

- **UI strings** live in `i18n.js` → `window.VelsI18n.t(key)` (used by `script.js`, `chat.js`, `define.js`).
- **Hindi article translations** are separate static files `*.hi.html` (all pages) with
  `hreflang` `en/hi/x-default` alternates. Clicking `HI` on an article redirects to the
  `.hi.html` variant (checked via `fetch HEAD` – falls back to UI-only if untranslated);
  leaving `HI` returns to the English original.
- **Tamil** translations are also separate static files `*.ta.html` (all pages) with
  the same `hreflang` pattern for `ta`.

**To add a new page with translations** (e.g. `your-page.html`):
1. Create the EN file first, then generate HI/TA variants by copying the EN file and translating visible text.
2. Conventions: `<html lang="hi">`/`<html lang="ta">`, **self-referential canonical** (required for valid hreflang clusters), JSON-LD `inLanguage: "hi"`/`"ta"`, translate meta/title/OG/Twitter, keep tech acronyms in English, preserve `<script>`/`<code>`/`<pre>` blocks verbatim. Head `<link rel="alternate" hreflang">` tags are **generated** – do not hand-edit them.
3. Add the page to `tools/gen-seo.js` (`TOOLS_META` or `STATIC_META`) and run `node tools/gen-seo.js` to update the sitemap.
4. If the page is an article, add it to `articles.js` and run `node tools/gen-feed.js`.

## Glossary → VelsChat (inline definitions)

Every article body is auto-annotated with **dotted-underline glossary terms**:

- `glossary.js` defines 40+ terms (`GPU`, `GGUF`, `KV cache`, `RAG`, `ROCm`… each with
  `fullForm`, `short`, optional `link`).
- `define.js` wraps the first occurrence of each term in `.article-body` (skips `code`/`pre`/
  `a`/headings, max 14 per page). Hover/tap shows a popover with the definition + `Ask VelsChat`
  + optional `Read guide`. Selecting any phrase in an article shows an `Ask about "…"` chip.
- `Ask VelsChat` calls `window.VelsChat.ask(prompt, {forcePage:true})` which sends the term +
  surrounding context + the current page to the AI (`chat.js`).
- **Add a term:** edit `glossary.js` → `"XYZ": { fullForm, short, link }` – no article edits needed.
- **Opt out per element:** add `data-no-define` or class `.no-define` to skip auto-wrap.
- **Manual term:** `<span data-term="XYZ">XYZ</span>` forces annotation; `<abbr title="…">XYZ</abbr>`
  is auto-upgraded.
- **Acronym rule:** keep acronyms (GPU, GGUF…) in English in translations so glossary still annotates.

## VelsChat (AI chat)

Floating chat bubble (bottom-right) – **chatbot icon** + pop-out hint that
appears after 8s / 40% scroll / glossary hover (auto-hides, dismissed state in
`vt-bubble-hint-dismissed`).

- `window.VelsChat.ask(prompt, opts)` programmatic API (glossary + selection chip use it).
- Language-aware: if `vt-lang` is `ta`/`hi`, the system prompt appends "respond in Tamil/Hindi".
- Answers start with `TERM – Full Form:` for define/full-form questions; `—` em dashes are
  normalized to `–` in `renderContent`.
- **Server-side**: `chat.velstech.net` is a Cloudflare Worker. `chat-proxy.js` is the
  Worker entry point (`fetch` event, provider routing, per-endpoint rate limits). Pure helpers
  (CORS origin policy, sliding-window rate limiter + pruning, OpenAI↔Anthropic message
  conversion, Anthropic/Cloudflare SSE → OpenAI SSE stream converters, and the cost/SSRF
  guardrails – message validation, option clamping, model allowlist, feed-URL validation,
  capped reads) live in `chat-proxy-core.js`
  and are covered by `tests/chat-proxy.test.js`. The Worker bundles both files via
  `wrangler`; deployment is manual (`wrangler deploy`).
- **Full setup & deploy:** see `CHAT-SETUP.md`.

## Generators

| Script | What it does | When to run |
|---|---|---|
| `tools/gen-seo.js` | Inject canonical/JSON-LD/OG tags + reciprocal head hreflang alternates (EN/HI/TA clusters) + Atom feed auto-discovery link, generate `sitemap.xml` (with `<lastmod>` from `articles.js`) + `robots.txt` | After any new page or article |
| `tools/gen-feed.js` | Generate `feed.xml` Atom feed from `articles.js` | After article changes |
| `tools/gen-og-images.py` | Render 1200×630 OG images per article into `og/` | After adding articles |
| `tools/gen-benchmarks.js` | Generate per-benchmark detail pages from `benchmarks/data.json` | After adding benchmark data |
| `tools/gen-search-index.js` | Generate `search-index.json` (articles + tools + hubs) for fuzzy search | After adding articles/tools |
| `tools/gen-favicon.py` | Generate favicon variants | Rarely |
| `tools/build.js` | Canonical boilerplate + asset-version management (`check`/`sync`/`bump`) | After asset changes; `check` runs in CI |
| `tools/check-og-images.js` | Verify every article has `og/*.png` | CI guard in `build-check.yml` |
| `tools/check-links.js` | Verify no broken internal links | CI guard in `build-check.yml` |
| `tools/gen-og-img.py` | Legacy single OG image generator | Replaced by gen-og-images.py |
| `tools/check-stale.js` | Check for stale articles (GitHub Action) | Automated (weekly) |
| `tools/stage-pages.js` | Copy public files to `.dist/` (drops repo internals) for the Pages deploy | Automated (`deploy-pages.yml`) |
| `tools/post-new-articles.js` | Detect new articles and post to socials | Automated (GitHub Action) |

## Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `build-check.yml` | Push to `main`, PRs | Syntax check + `build.js check` + tests + OG image + link checks |
| `lighthouse.yml` | PRs | Lighthouse CI on 10 representative URLs (perf ≥0.85, a11y ≥0.9, FCP <2s, LCP <2.5s, CLS <0.1) via `lighthouserc.json`. Assertions are `error`-gated so a regression fails PRs |
| `deploy-pages.yml` | Push to `main` | Runs `tools/stage-pages.js` (copies public files to `.dist/`, dropping repo internals) then deploys `.dist` to Cloudflare Pages (`velstech-website.pages.dev`). Requires `CLOUDFLARE_API_TOKEN` secret with Pages Edit permission |
| `auto-feed.yml` | Push to `main` | Regenerates `feed.xml` from `articles.js` and commits it |
| `social-post.yml` | Push to `main` (articles.js changed) | Detects new articles via `posted-articles.json`, posts to Mastodon/X/webhook, commits state back |
| `stale-check.yml` | Weekly (Monday) | Checks for articles that haven't been updated in 90 days |

## Tests

Unit tests run on every push via `node --test tests/*.test.js` in `build-check.yml`. No npm dependencies — uses Node's built-in `node:test` (Node 18+).

- **`tests/whatsnew.test.js`** (18 tests) — exercises the homepage "Latest" section:
  filter matching (`All` / `AI` / `Hardware` / `Software` / `Lab`), sort-by-recency
  with featured tiebreak, count formatting in EN/TA/HI, plus smoke tests against
  the live `articles.js` dataset (every article matches `All`, all category
  values are recognized, every article has the fields the renderer needs).
- **`tests/chat-proxy.test.js`** (71 tests) — exercises the chat proxy's pure
  helpers: CORS origin policy (primary echoed, foreign denied, localhost +
  `*.velstech.net` allowed, malformed headers tolerated), per-IP sliding-window
  rate limiter, client-IP extraction (CF-Connecting-IP > X-Forwarded-For >
  anonymous), OpenAI↔Anthropic message conversion, and both SSE stream converters
  (Cloudflare Workers AI + Anthropic → OpenAI format) including multi-chunk
  splits, line buffering, malformed JSON handling, and `[DONE]` sentinel dedup,
  plus the cost/SSRF guardrails: message validation, option clamping, model
  allowlist, feed-URL validation (private/localhost/metadata/IPv6 blocked),
  rate-limiter pruning, and capped feed reads.

Total: **96 tests** (89 unit + 7 browser), all passing in <100ms.

- **`tests/lang-toggle.test.js`** (7 tests, opt-in) — browser-level guard for the
  EN/TA/HI toggle, served through a mini Cloudflare-Pages emulator (308 `.html`
  → clean URL) since every toggle bug was clean-URL-specific. Covers: toggle
  buttons, click→persist→swap for HI/TA/EN, cross-page language persistence,
  FAQ rendering + localization after in-place swap, no redirect-loops on
  untranslated paths. **Skips automatically** when `puppeteer-core` or a Chrome
  binary is absent, so CI is unaffected. Run locally:
  `npm i puppeteer-core && CHROME_PATH=/usr/bin/google-chrome node --test tests/lang-toggle.test.js`

Run locally: `node --test tests/*.test.js`. CI: see `build-check.yml`.

## Social auto-posting

On every push to `main` that changes `articles.js`, the social-post workflow:
1. Compares current articles against `tools/posted-articles.json`
2. Posts any new articles to configured platforms:
   - **Mastodon** ✅ live (`@velstech@mastodon.social`)
   - **X / Twitter** ⏸️ wired but needs $100/mo Basic plan
   - **Bluesky** 🟢 ready – needs handle + app password in secrets
   - **Webhook** 🟢 ready – needs `WEBHOOK_URL` secret
3. Updates `posted-articles.json` and commits it back

### Secrets (repo → Settings → Secrets and variables → Actions)
- `TWITTER_ACCESS_TOKEN` – OAuth 2.0 Bearer token for X
- `MASTODON_INSTANCE` – `https://mastodon.social`
- `MASTODON_TOKEN` – Mastodon access token
- `BLUESKY_HANDLE` – Bluesky handle
- `BLUESKY_APP_PASSWORD` – Bluesky app password
- `WEBHOOK_URL` – Generic webhook URL

## Version bumping convention

Cache-busting query strings (`?v=N`) and the per-page head/tail boilerplate are managed by
`tools/build.js`, with canonical versions in `tools/versions.json`:

```sh
node tools/build.js check          # CI guard: fail if any page drifts (run in build-check.yml)
node tools/build.js sync           # Fix drift across all pages (root + benchmarks/)
node tools/build.js bump script.js # Bump ?v=N on an asset everywhere (incl. script.js injections)
node tools/build.js status         # Show canonical versions + drift summary
```

This replaces the old manual perl one-liner. Managed per page:
- head favicon links + stylesheet link (full favicon set, correct `../` prefixes in benchmarks/)
- trailing `articles.js` / `i18n.js` / `whatsnew-core.js` / `script.js` tags
- runtime-injected versions in `script.js` (`chat.js`, `glossary.js`, `define.js`, `chat.css`, `glossary.css`)

Not managed (owned by `gen-seo.js`): canonical, OG/Twitter meta, JSON-LD, hreflang, sitemap.
`pdf-to-image/` and `newsletter/` are outside the template system and never touched.

## Key SEO features
- Per-article OG images (1200×630, dark theme, category pill)
- BlogPosting + FAQPage + WebApplication + CollectionPage schema
- Site-wide **Person** entity (`@id: #author`, `name`, `url`, `description`, `knowsAbout`, `sameAs`); every `BlogPosting.author` references it by `@id` for E-E-A-T
- sitemap.xml (EN + HI + TA URLs, `<lastmod>` for articles) + robots.txt
- Atom feed auto-discovery (`<link rel="alternate" type="application/atom+xml">`) on every page
- `tools/stage-pages.js` builds a clean `.dist/` for deploy – repo internals (`tools/`, `tests/`, `*.md`, Worker source) are never served from the production domain (`wrangler pages deploy` ignores `.assetsignore`, so staging is required)
- `hreflang` `en` / `hi` / `ta` / `x-default` alternates on articles
- Google Search Console verified (DNS TXT)
- Cloudflare Web Analytics (Automatic Setup)
- Canonical URLs on every page
- Per-article `og:image` unique per article

## Affiliate setup

Affiliate links use two mechanisms:
- `data-amazon="search query"` → Amazon.in keyword search with `velstechoffl-21` tag
- `data-aff="key"` → Software/cloud referral URLs from `AFFILIATE_LINKS` in `script.js`

Every click fires `affiliate_click` (Zaraz / gtag / plausible) with `{ network, query?, page }` so
conversions can be sliced by article and money page in your analytics dashboard. No extra
setup beyond your existing Cloudflare Web Analytics – enable **Zaraz** in the dashboard to see
custom events, or wire `gtag`/`plausible` and events flow there too. Listen for `vt:track`
(`window.addEventListener("vt:track", e => console.log(e.detail))`) to debug locally.

See `MONETIZATION-SETUP.md` for sign-up instructions.

### Analytics events

Provider-agnostic `track(name, props)` in `script.js` fans out to Zaraz / gtag / plausible:

| Event | When | Props |
|---|---|---|
| `affiliate_click` | Any `data-amazon` / `data-aff` link clicked | `network` (`"amazon"` or aff key), `query` (for Amazon), `page` |
| `cta_view` | Article-bottom CTA stack scrolls into view (≥30% visible) | `type: "article_bottom"`, `page`, `cards` (1–2) |
| `newsletter_signup` | Newsletter form succeeds | `source` (form id), `page` |

Use these in Zaraz → Triggers or GA4 → Events to build the per-article money funnel:
`cta_view` (impressions) → `affiliate_click` (intent) → Amazon Associate reports (sales).

## PWA (Offline + Installable)

- **`manifest.json`** – `standalone` display, `id`/`scope` `/`, 4 icons (192/512 `any` + `maskable` generated from `apple-touch-icon.png` via `icon-*.png`), 3 shortcuts (Tools / Benchmarks / Playground).
- **`sw.js`** (`SW_VERSION = "v2"`) – precached shell (`/`, `offline.html`, `manifest.json`, `search-index.json`, `fonts/InterVariable.woff2`, `logo.svg`…); **network-first** for HTML (fresh when online, last-known offline, then `offline.html`), **cache-first** for CSS/JS/img/font (versioned `?v=N` keys auto-invalidate), passthrough for cross-origin (chat proxy, RSS) and `pdf-to-image/`.
- **`offline.html`** – self-contained fallback (inline styles, no deps) for uncached navigations; excluded from `build.js` managed set intentionally.
- Registration in `script.js` (https-only, `onload` → `navigator.serviceWorker.register("/sw.js")`). Bump `SW_VERSION` and redeploy to clear old `velstech-shell-*`/`runtime-*` caches.

Test: DevTools → Application → Service Workers (active) / Cache Storage / Manifest; then go offline and reload — visited pages + tools still load.

## Article CTA & Pillar

- **CTA stack** (`initArticleCta` in `script.js`, styles `.cta-stack`/`.cta-card` in `styles.css`) – JS-injected before `.article-nav` on every article (skips pages with a hand-placed `form.newsletter-form`): **Newsletter card** (`data-i18n="cta_newsletter_*"`, `wireNewsletterForm` multi-form safe, Web3Forms) + **Gear card** (`GEAR_PICKS` per `category` → `data-amazon` links, rewritten by `initAmazonLinks`). Tracks `cta_view` on 30% visibility.
- **Pillar** (`PILLAR` + `initPillar`, 7 steps: *Understand VRAM → Pick a GPU → Budget picks (India) → Calculate VRAM → Estimate speed → Visual planner → Real benchmarks*) – injected on all 7 cluster URLs (articles + tools, `data-pillar-url` + `localizeUrl`), highlights current step, localizes via `data-i18n="pillar_*"`, re-localizes `href`s on `vt-lang-change`. Tracks `pillar_view`/`pillar_click`.
- Both use `data-i18n` so the language toggle translates them instantly without reload; orphans get `Continue reading` fallback (2 related by `category`) instead of hiding.
- **Search** (`tools/gen-search-index.js` → `search-index.json` 103 entries, `sw.js` precached network-first) – fuzzy ranked in `script.js` (`editDist1` incl. transposition, tag/category/desc weighting, top-8, `↑`/`↓`/`Enter`/`Esc`, `?q=` param).



## Tech stack

- **Static HTML** – no framework, no build step
- **CSS** – single `styles.css` with CSS custom properties, dark/light theme, multiple accent colors
- **JS** – `script.js` (nav, theme, search, article rendering, share buttons, analytics),
  `i18n.js` (EN/TA/HI UI), `whatsnew-core.js` (homepage Latest pure logic),
  `chat.js` (VelsChat widget), `chat-proxy.js` + `chat-proxy-core.js` (Worker +
  pure helpers), `glossary.js` + `define.js` (inline glossary)
- **Pure-ESM cores** – `whatsnew-core.js` and `chat-proxy-core.js` are dual-export
  (browser global + CommonJS) so the same source runs in the page and in `node --test`
- **Tests** – `node:test` (built-in, no npm deps). 89 unit tests + 7 opt-in browser tests (auto-skip without Chrome),
  CI on every push via `build-check.yml`
- **Python 3** – OG image generation (Pillow)
- **Node.js** – SEO, feed, benchmark generators (built-in modules only)
- **GitHub Actions** – feed regeneration, social auto-posting, stale checks, tests, Cloudflare Pages deploy
- **Cloudflare Pages** – hosting (`velstech-website` project; GitHub Pages kept as fallback during migration)
- **Cloudflare Workers** – AI chat proxy (`chat.velstech.net`); deploy is manual via `wrangler deploy`
- **Cloudflare** – DNS, proxying, Web Analytics
- **Mastodon** – social auto-posting
- **aspell** – spelling audits (`--personal=./velstech.pws`)
- **Perf** – `chatbot.png` 72×72 retina (12 KB, was 1.6 MB), font `preload` for `InterVariable.woff2` in canonical head via `build.js`.
