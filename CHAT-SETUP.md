# AI Chat – Setup Guide

The site now has a floating AI chat assistant (bottom-right) that can answer
**general questions** *and* questions about **this blog's articles**.

## How it works

```
browser widget  →  Cloudflare Worker proxy (chat-proxy.js)
   (chat.js)         https://chat.velstech.net   (public)
```

- **`chat.js`** – the widget. Does lightweight client-side retrieval over
  `ARTICLES` (in `articles.js`) and uses the most relevant snippets as context.
- **`chat.css`** – widget styling (matches your design tokens).
- **`chat-proxy.js`** – the Cloudflare Worker that forwards requests to the
  configured AI provider (default: **Cloudflare Workers AI**).

## Bubble icon & pop-out hint

- The bubble uses a **chatbot** icon – `chat.js` renders
  `<img src="/chatbot.png" class="vt-bubble-img">` (PNG, full-res in
  `chatbot.png`) with an SVG fallback.
- Gentle bounce (`vt-bounce`), pop-in (`vt-bubbleIn`) and hint tooltip
  (`vt-bubble-hint`) are in `chat.css`. Bounce pauses on hover and respects
  `prefers-reduced-motion`.
- A **pop-out hint** appears after 8s, on 40% scroll, or on first glossary hover
  (`setupBubbleHint()` in `chat.js`). It auto-hides after 6s, is localized
  (EN/TA/HI), and its dismissal persists in `vt-bubble-hint-dismissed`.

## Programmatic API

`chat.js` exposes `window.VelsChat` for the glossary / selection chip:

```js
window.VelsChat.ask(prompt, { forcePage: true })  // opens panel + sends with page context
window.VelsChat.open() / close() / isReady
```

## Language-aware chat

`chat.js` reads the active language via `VelsI18n.getLang()` (URL suffix first –
`.hi`/`.ta` pages always win – then the stored `vt-lang` preference). If it is `ta` or
`hi`, the system prompt appends "respond in Tamil/Hindi", and the widget UI strings
(title, placeholder, disclaimer, welcome) come from `VelsI18n.t()`.

The widget re-localizes on the `vt-lang-change` event. Gotcha (fixed in `ba7e151`):
`getLang()` is URL-first, but the in-place language swap changes the URL only *after*
the event fires – so `swapMain()` in `script.js` **re-dispatches** `vt-lang-change`
after `history.pushState`, otherwise the chat keeps the old language when toggling
away from a translated page. Guarded by `tests/lang-toggle.test.js`.

Glossary answers always start with `TERM – Full Form:` (line 1), and `—` em dashes in
model output are normalized to `–`.

## Production backend (default – live)

`chat.js` calls the deployed Worker at
`CHAT_PROXY_URL` (`https://chat.velstech.net`), which forwards to **Cloudflare
Workers AI** – no API key needed on the client.

Config in `chat.js`:

```js
const CHAT_PROXY_URL = "https://chat.velstech.net";
const CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct";  // must be a Workers AI model
const CHAT_FALLBACK_MODELS = [ "@cf/meta/llama-3.2-3b-instruct", "@cf/qwen/qwen2.5-7b-instruct" ];
```

### Deploying the Worker

`wrangler.toml` (in this repo) already has the production config:

```toml
name = "velstech-chat"
main = "chat-proxy.js"
compatibility_date = "2026-08-26"
workers_dev = false

[[custom_domains]]
hostname = "chat.velstech.net"
zone_name = "velstech.net"

[vars]
ALLOWED_ORIGIN = "https://velstech.net"
RATE_LIMIT = 30
RATE_WINDOW = 60000
RSS_LIMIT = 10
AI_PROVIDER = "cloudflare"
AI_MODEL = "@cf/meta/llama-3.1-8b-instruct"
```

Set the secrets, then deploy:

```sh
wrangler secret put CLOUDFLARE_API_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler deploy
# Wrangler v4: upload then promote the version to 100%:
wrangler versions upload && wrangler versions deploy <version-id>
```

> ⚠️ `custom_domains` triggers a "Unexpected fields" warning in wrangler v4 but still works.
> If `wrangler deploy` reports "No targets deployed", run
> `wrangler versions deploy <version-id>` (list with `wrangler versions list`).

The Worker honours the `model` the widget sends (so its fallback chain works)
and falls back to `AI_MODEL` when the client doesn't specify one.

### Local development (optional)

For testing against a local OpenAI-compatible server, point the Worker at it
by setting `AI_PROVIDER = "openai"` and the server URL in `chat-proxy.js`,
then run the Worker locally with `wrangler dev`.

## Verify

1. Confirm the Worker is deployed (route `chat.velstech.net/*` resolves).
2. Open the site, click the bubble, send a message.
3. Open browser DevTools → Console:
   - No `[VelsTech] Failed to load chat widget` line → widget loaded.
   - A reply appears → end-to-end working.
   - An error like `proxy 502` → check the Worker logs / `AI_MODEL` name.

## Notes

- Retrieval is keyword-scoring over each article's title, description, category,
  and tags – no vector DB needed. It's good for "what does the blog say about X".
- To strengthen blog answers, add fuller summaries to the `description` fields
  in `articles.js`.
- The proxy is **locked down by default**: CORS is restricted via
  `getCorsOrigin()` in `chat-proxy.js`, per-IP rate limits apply per endpoint
  (chat: 30 req / 60s via `RATE_LIMIT`; RSS proxy: 10 req / 60s via `RSS_LIMIT`),
  and nothing is logged. Caveat: the limiter is an in-memory map **per isolate**,
  so the effective global limit is higher under distributed load (verified live:
  sequential bursts spread across isolates pass a 10/min bucket). If chat cost ever
  spikes, add Cloudflare rate-limiting rules on `chat.velstech.net` or Turnstile –
  don't rely on `RATE_LIMIT` alone.
- **Cost / SSRF guardrails** (all in `chat-proxy-core.js`, unit-tested):
  chat `messages` are validated (count, role, size) and generation options are
  clamped (`max_tokens` ≤ 8192, `temperature` ≤ 2, `top_p` ≤ 1); a client can
  only pick a model from `PLAYGROUND_MODELS` (or the configured `AI_MODEL`).
  `/api/rss` accepts only public `http(s)` URLs – localhost, private /
  link-local / metadata IPs, credentials, and non-http schemes are rejected,
  redirect targets are re-validated, and responses are capped at 512 KB.
- `getCorsOrigin()` echoes the request `Origin` when it is:
  `https://velstech.net`, any `*.velstech.net` subdomain, or a localhost preview
  (`http://localhost:*` / `http://127.0.0.1:*`) – so local dev works out of the
  box. Unknown origins fall back to `ALLOWED_ORIGIN`.
- Adjust `RATE_LIMIT` / `RATE_WINDOW` / `RSS_LIMIT` in `wrangler.toml` as needed.
