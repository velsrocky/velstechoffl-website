# AI Chat — Setup Guide

The site now has a floating AI chat assistant (bottom-right) that can answer
**general questions** *and* questions about **this blog's articles**.

## How it works

```
browser widget  →  OmniRoute relay (OpenAI-compatible)
   (chat.js)         http://localhost:20128/v1   (local)  OR
                     chat-proxy.js Worker        (public, hosted relay)
```

- **`chat.js`** — the widget. Does lightweight client-side retrieval over
  `ARTICLES` (in `articles.js`) and uses the most relevant snippets as context.
- **`chat.css`** — widget styling (matches your design tokens).
- **`chat-proxy.js`** — optional Cloudflare Worker proxy for a *public* relay.

## Two backends (toggle with `CHAT_BACKEND` in `chat.js`)

### Local (default — works right now with your OmniRoute)

`CHAT_BACKEND = "local"` calls your local OmniRoute **directly** — no proxy,
no key. OmniRoute is keyless and sends permissive CORS headers, so the browser
can reach it as long as the site and OmniRoute run on the same machine.

Config in `chat.js`:

```js
const CHAT_BACKEND = "local";                 // "local" or "proxy"
const OMNIRUTE_BASE_URL = "http://localhost:20128/v1";
const CHAT_MODEL = "kr/claude-haiku-4.5";     // primary text model
// Retried (in order) if a model returns no text:
const CHAT_FALLBACK_MODELS = [
  "kr/claude-sonnet-4.5",
  "antigravity/claude-sonnet-4-6",
  "antigravity/gemini-3.6-flash-medium",
];
```

> ⚠️ The API is at **`/v1`** — `/home` is only the web dashboard. The widget
> appends `/chat/completions` automatically.

**Choosing a model.** List every model with
`http://localhost:20128/v1/models`. Two things to know:

- **Avoid `auto/*` combos.** They're built for coding agents and force
  tool-calling (MCP tools), so a plain chat message can come back with *no text*.
- **Use a specific provider model** that returns text directly (e.g. any
  `claude-*`, `gemini-*`, `deepseek-*`, `qwen-*` under a provider prefix). The
  widget already retries a small fallback list if the primary returns nothing.
>
> Serve the site from a local origin (e.g. `python -m http.server 8000`) so the
> `Origin` matches and CORS is satisfied. Opening the file via `file://` will
> not work for fetch calls.

### Public (when you host a relay)

`CHAT_BACKEND = "proxy"` calls your deployed Cloudflare Worker, which forwards
to a *public* hosted OmniRoute relay (so visitors don't need OmniRoute locally).

1. Set `CHAT_BACKEND = "proxy"` and `CHAT_PROXY_URL = "https://…workers.dev"`.
2. Deploy `chat-proxy.js` to Cloudflare with `wrangler.toml`:

   ```toml
   name = "velstech-chat"
   main = "chat-proxy.js"

   [vars]
   OMNIRUTE_BASE_URL = "https://your-relay.example.com/v1"  # your public relay
   ALLOWED_ORIGIN  = "https://velstech.net"
   RATE_LIMIT      = 30        # requests per…
   RATE_WINDOW     = 60000     # …this many milliseconds, per IP
   # Optional — only if your relay requires an API key:
   # OMNIRUTE_API_KEY = "sk-..."
   ```

3. `wrangler deploy`. The endpoint used is
   `${OMNIRUTE_BASE_URL}/chat/completions`, or set `OMNIRUTE_CHAT_URL` for a
   custom path.

## Verify

1. Deploy the Worker, then set `CHAT_PROXY_URL` in `chat.js`.
2. Open the site, click the bubble, send a message.
3. Open browser DevTools → Console:
   - No `[VelsTech] Failed to load chat widget` line → widget loaded.
   - A reply appears → end-to-end working.
   - An error like `proxy 502` / `relay unreachable` → check `OMNIRUTE_BASE_URL`.

## Notes

- Retrieval is keyword-scoring over each article's title, description, category,
  and tags — no vector DB needed. It's good for "what does the blog say about X".
- To strengthen blog answers, add fuller summaries to the `description` fields
  in `articles.js`.
- The proxy is **locked down by default**: CORS is restricted to `ALLOWED_ORIGIN`
  (default `https://velstech.net`), a per-IP rate limit applies (default
  30 req / 60s), and nothing is logged. Adjust `ALLOWED_ORIGIN` / `RATE_LIMIT`
  in `wrangler.toml` as needed.
- Point the proxy at a **dedicated** OmniRoute relay (not your main provider
  gateway) so public chat traffic can't exhaust your accounts' rate limits.
