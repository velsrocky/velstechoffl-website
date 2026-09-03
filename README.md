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
```

## Project structure

| Path | What |
|---|---|
| `*.html` | Articles, tools, category pages, static pages (English) |
| `*.hi.html` | Hindi translations (all pages) |
| `*.ta.html` | Tamil translations (all pages) |
| `articles.js` | **Content source of truth** – all article metadata |
| `i18n.js` | **EN/TA/HI** UI strings + `vt-lang` persistence + `VelsI18n` API |
| `glossary.js` | 40+ tech-term definitions (`fullForm`/`short`/`link`) |
| `define.js` | Auto-wraps glossary terms + popover + selection-to-chat |
| `glossary.css` | Glossary term/popover/selection-chip styling |
| `velstech.pws` | `aspell` personal dictionary (111 tech terms) |
| `benchmarks/data.json` | Benchmark results (tested + estimated) |
| `benchmarks/*.html` | Generated benchmark detail pages |
| `og/*.png` | Per-article OG images (1200×630) |
| `tools/` | Generators + scripts |
| `.github/workflows/` | CI/CD pipelines |
| `tools/posted-articles.json` | State tracking for social auto-poster |

## Content types

### Articles (42 total)
Registered in `articles.js` with title, URL, date, category, tags, description, and optional `faq` array. Articles appear in the RSS feed, homepage "Latest" section, Mastodon auto-posts, and category hubs.

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

### Benchmark database (12 results → 14 pages)
Structured GPU × model × quantization results in `benchmarks/data.json`. Each entry
generates a detail page per backend (e.g. ROCm and Vulkan).

**To add a benchmark:**
1. Add a row to `benchmarks/data.json`
2. Run `node tools/gen-benchmarks.js && node tools/gen-seo.js`

### Buying guides (4 pages)
Standalone decision-oriented pages at `/buying-guides.html`, wired with `data-amazon` affiliate links.

### Category hubs (6 pages)
`ai.html`, `hardware.html`, `os.html`, `networking.html`, `security.html`, `programming.html` – each rebuilt as a learning-progression hub with tiers (Start here → Go deeper → Tools → Roadmap).

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
2. Conventions: `<html lang="hi">`/`<html lang="ta">`, canonical → EN `.html`, add 3 `<link rel="alternate">` tags (en + hi/ta + x-default), JSON-LD `inLanguage: "hi"`/`"ta"`, translate meta/title/OG/Twitter, keep tech acronyms in English, preserve `<script>`/`<code>`/`<pre>` blocks verbatim.
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
- **Full setup & deploy:** see `CHAT-SETUP.md`.

## Generators

| Script | What it does | When to run |
|---|---|---|
| `tools/gen-seo.js` | Inject canonical/JSON-LD/OG tags, generate `sitemap.xml` + `robots.txt` | After any new page or article |
| `tools/gen-feed.js` | Generate `feed.xml` Atom feed from `articles.js` | After article changes |
| `tools/gen-og-images.py` | Render 1200×630 OG images per article into `og/` | After adding articles |
| `tools/gen-benchmarks.js` | Generate per-benchmark detail pages from `benchmarks/data.json` | After adding benchmark data |
| `tools/gen-search-index.js` | Generate `search-index.json` (articles + tools + hubs) for fuzzy search | After adding articles/tools |
| `tools/gen-favicon.py` | Generate favicon variants | Rarely |
| `tools/build.js` | Canonical boilerplate + asset-version management (`check`/`sync`/`bump`) | After asset changes; `check` runs in CI |
| `tools/gen-og-img.py` | Legacy single OG image generator | Replaced by gen-og-images.py |
| `tools/check-stale.js` | Check for stale articles (GitHub Action) | Automated (weekly) |
| `tools/post-new-articles.js` | Detect new articles and post to socials | Automated (GitHub Action) |

## Workflows

| Workflow | Trigger | What it does |
|---|---|---|
| `build-check.yml` | Push to `main`, PRs | `node tools/build.js check` – fails on boilerplate/version drift |
| `deploy-pages.yml` | Push to `main` | Deploys the site to Cloudflare Pages (`velstech-website.pages.dev`). Requires `CLOUDFLARE_API_TOKEN` secret with Pages Edit permission |
| `auto-feed.yml` | Push to `main` | Regenerates `feed.xml` from `articles.js` and commits it |
| `social-post.yml` | Push to `main` (articles.js changed) | Detects new articles via `posted-articles.json`, posts to Mastodon/X/webhook, commits state back |
| `stale-check.yml` | Weekly (Monday) | Checks for articles that haven't been updated in 90 days |

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
- trailing `articles.js` / `i18n.js` / `script.js` tags
- runtime-injected versions in `script.js` (`chat.js`, `glossary.js`, `define.js`, `chat.css`, `glossary.css`)

Not managed (owned by `gen-seo.js`): canonical, OG/Twitter meta, JSON-LD, hreflang, sitemap.
`pdf-to-image/` and `newsletter/` are outside the template system and never touched.

## Key SEO features
- Per-article OG images (1200×630, dark theme, category pill)
- BlogPosting + FAQPage + WebApplication + CollectionPage schema
- sitemap.xml (EN + HI + TA URLs) + robots.txt
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

## Tech stack

- **Static HTML** – no framework, no build step
- **CSS** – single `styles.css` with CSS custom properties, dark/light theme, multiple accent colors
- **JS** – `script.js` (nav, theme, search, article rendering, share buttons, analytics),
  `i18n.js` (EN/TA/HI UI), `chat.js` (VelsChat widget), `glossary.js` + `define.js` (inline glossary)
- **Python 3** – OG image generation (Pillow)
- **Node.js** – SEO, feed, benchmark generators (built-in modules only)
- **GitHub Actions** – feed regeneration, social auto-posting, stale checks, Cloudflare Pages deploy
- **Cloudflare Pages** – hosting (`velstech-website` project; GitHub Pages kept as fallback during migration)
- **Cloudflare Workers** – AI chat proxy (`chat.velstech.net`)
- **Cloudflare** – DNS, proxying, Web Analytics
- **Mastodon** – social auto-posting
- **aspell** – spelling audits (`--personal=./velstech.pws`)