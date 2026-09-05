# Changelog

Notable changes to the VelsTech site, tooling and infrastructure. Newest first.

## 2026-09-04/05 – "What next?" session

### Fixed
- **Chat language toggle** – `vt-lang-change` fired before the in-place URL swap, and
  `getLang()` is URL-first, so the chat kept the old language when switching away from a
  `.hi`/`.ta` page. `swapMain()` now re-dispatches the event after `pushState`; the chat
  welcome message re-localizes too. Browser regression test added (`ba7e151`).
- **Tamil mobile overflow** – long agglutinative Tamil words widened 108 TA pages
  (hero h1 = 394 px on a 360 px viewport). `overflow-wrap: anywhere` on headings/inline
  code, `min-width: 0` on flex/grid text items, wrapping hub headers, scrollable article
  tables, smaller `lang="ta"` hero font, block-flow caution callout; offline.html no
  longer injects unstyled chrome. All 108 TA + 108 HI + 108 EN pages verified clean at
  360 px and 320 px (`6c7a7b6`).
- **DOM-XSS in notes tool** – search query echoed into `innerHTML` unescaped (EN/HI/TA)
  (`6c37fac`).
- **Benchmark explorer drift** – EN/HI/TA pages embedded a hardcoded copy of
  `benchmarks/data.json` and silently served stale data; all three now fetch the single
  source of truth (`b6b77ab`, `1e618ce`).
- **Worker config** – `[[custom_domains]]` was an invalid top-level field wrangler
  ignored; replaced with `routes = [{ custom_domain = true }]`. Added
  `X-Content-Type-Options: nosniff` to every Worker response via the fetch wrapper;
  redeployed with the domain binding verified (`4ec4bf5`).

### Added
- **CSP** – full Content-Security-Policy in `_headers`, validated against AdSense
  (`*.adtrafficquality.google` et al.), Cloudflare Web Analytics, the chat proxy,
  web3forms and the pdf-to-image app (`6c37fac`, `a6867cb`).
- **New-article pipeline** – `tools/new-article.js` (scaffold + register),
  `tools/sync-all.js` (one-command regeneration chain), and
  `tools/check-article-sync.js` CI guard: fails unless every article has EN/HI/TA files,
  hreflang clusters, OG image, feed/sitemap/search entries, valid benchmark links, and no
  page embeds a copy of the benchmark dataset (`3ec1c42`).
- **Benchmarks** – Qwen3.8 27B GSQ-RCO IQ2_XS vs IQ3_S on RX 6800M, incl. follow-up
  runs: MTP head → 23.07 tok/s; `--fit` auto-split → 7.30 tok/s (Gated Delta Net has no
  fused ROCm kernel). 4 backend pages + data entries (`c088628`, `c83e85a`).
- **Articles** – Lab report *Qwen3.8 27B GSQ-RCO on RX 6800M* (EN/HI/TA, 5 screenshot
  figures as WebP) and explainer *Gated Delta Net on AMD* (EN/HI/TA, featured)
  (`cd8928c`, `5290a73`).
- **Newsletter** – issue #3 (md + email HTML): GDN benchmark surprise, Tamil-overflow
  hunt, CSP-vs-Ads war, pipeline (`c75defe`).
- **Polish** – per-benchmark OG images (20 cards in `og/benchmarks/`), notes a11y
  0.91 → 1.00, breadcrumb link underlines, TA homepage in Lighthouse CI
  (`095882f`).

### Audited (security review)
- No hardcoded secrets in client code; all third-party resources self-hosted.
- Chat proxy live-tested: SSRF guard (localhost/metadata/IPv6-mapped blocked), rate
  limiter trips, model allowlist, payload validation. Caveat documented: limiter is
  per-isolate.
- Service worker same-origin-only; `rel=noopener` everywhere; bookmark URLs scheme-locked.
- Cloudflare Pages serves deleted assets from its deployment store for ~7 days
  (`noindex`, immune to zone/project purges) – self-heals; repo is public so nothing
  leaked.

### Open (needs owner action)
- Send newsletter #3 (fill/remove the deal slot).
- web3forms: enable domain allowlist + honeypot.
- AdSense: keep Auto Ads (occasional CLS spikes) or set `ADSENSE_SLOT` for the fixed
  space-respecting placement.
- Affiliate signups → fill `AFFILIATE_LINKS` in `script.js`.
- Review Cloudflare Web Analytics top pages to steer the next content batch.
