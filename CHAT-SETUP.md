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

## Production backend (default – live)

`CHAT_BACKEND = "proxy"` in `chat.js` calls the deployed Worker at
`CHAT_PROXY_URL` (`https://chat.velstech.net`), which forwards to **Cloudflare
Workers AI** – no API key needed on the client.

Config in `chat.js`:

```js
const CHAT_BACKEND = "proxy";
const CHAT_PROXY_URL = "https://chat.velstech.net";
const CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct";  // must be a Workers AI model
const CHAT_FALLBACK_MODELS = [ "@cf/meta/llama-3.2-3b-instruct", "@cf/qwen/qwen2.5-7b-instruct" ];
```

### Deploying the Worker

`wrangler.toml` (in this repo) already has the production config:

```toml
name = "velstech-chat"
main = "chat-proxy.js"
routes = ["chat.velstech.net/*"]

[vars]
ALLOWED_ORIGIN = "https://velstech.net"
RATE_LIMIT = 30
RATE_WINDOW = 60000
AI_PROVIDER = "cloudflare"
AI_MODEL = "@cf/meta/llama-3.1-8b-instruct"
```

Set the secrets, then deploy:

```sh
wrangler secret put CLOUDFLARE_API_KEY
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler deploy
```

The Worker honours the `model` the widget sends (so its fallback chain works)
and falls back to `AI_MODEL` when the client doesn't specify one.

### Local development (optional)

For testing against a local OpenAI-compatible server (e.g. OmniRoute), set
`CHAT_BACKEND = "local"` and `CHAT_MODEL` to a provider model (e.g.
`"kr/claude-haiku-4.5"`). The widget then calls `OMNIRUTE_BASE_URL` directly:

```js
const CHAT_BACKEND = "local";
const OMNIRUTE_BASE_URL = "http://localhost:20128/v1";  // API is at /v1
```

> ⚠️ Serve the site from a local origin (e.g. `python -m http.server 8000`) so
> the `Origin` matches and CORS is satisfied. Opening the file via `file://`
> will not work for fetch calls.
>
> In local mode, use a specific provider model (any `claude-*`, `gemini-*`,
> `deepseek-*`, `qwen-*` under a provider prefix). Avoid `auto/*` combos – they
> force tool-calling and can come back with no text. The widget retries a small
> fallback list if the primary returns nothing.

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
- The proxy is **locked down by default**: CORS is restricted to `ALLOWED_ORIGIN`
  (default `https://velstech.net`), a per-IP rate limit applies (default
  30 req / 60s), and nothing is logged. Adjust `ALLOWED_ORIGIN` / `RATE_LIMIT`
  in `wrangler.toml` as needed.
