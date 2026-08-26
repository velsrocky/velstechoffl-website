/*
 * VelsTech AI chat proxy — Cloudflare Worker (Path A, public deployment).
 *
 * What it does:
 *   1. Receives a chat request from the website widget. The widget already
 *      attaches a scoped `system` message (guidance + retrieved blog snippets),
 *      so this proxy just forwards the messages to your OmniRoute relay.
 *   2. Forwards to your hosted OmniRoute relay (OpenAI-compatible) and streams
 *      the response back to the browser.
 *
 * Safety by default:
 *   - CORS is locked to your site origin (env ALLOWED_ORIGIN, default
 *     https://velstech.net).
 *   - Simple per-IP rate limiting (env RATE_LIMIT, default 30 requests / 60s).
 *   - Nothing is logged; no request bodies are stored.
 *
 * Deployment (Cloudflare Workers):
 *   1. `wrangler deploy chat-proxy.js`  (or paste into the Workers editor)
 *   2. Set environment variables:
 *         OMNIRUTE_BASE_URL = "https://your-relay.example.com/v1"
 *         ALLOWED_ORIGIN    = "https://velstech.net"   (default)
 *         RATE_LIMIT        = 30                        (default, per 60s)
 *         RATE_WINDOW       = 60000                     (default, ms)
 *         # optional: only if your relay requires a key:
 *         OMNIRUTE_API_KEY  = "sk-..."
 *
 * Notes:
 *   - The final chat endpoint is `${OMNIRUTE_BASE_URL}/chat/completions`.
 *     Set OMNIRUTE_CHAT_URL to the full URL to override the path.
 *   - No provider keys reach the browser; they live only in the Worker env.
 */

const DEFAULTS = {
  BASE: "https://your-relay.example.com/v1",
  ORIGIN: "https://velstech.net",
  RATE_LIMIT: 30,
  RATE_WINDOW: 60000,
};

// Per-IP sliding-window rate limiter (in-memory; fine as a soft limit).
const hitCounts = new Map(); // ip -> [{ts}]
function rateOK(ip, limit, windowMs) {
  const now = Date.now();
  const hits = (hitCounts.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    hitCounts.set(ip, hits);
    return false;
  }
  hits.push(now);
  hitCounts.set(ip, hits);
  return true;
}

function json(body, status, origin) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || DEFAULTS.ORIGIN;
    const base = env.OMNIRUTE_BASE_URL || DEFAULTS.BASE;
    const chatUrl = env.OMNIRUTE_CHAT_URL || `${base.replace(/\/$/, "")}/chat/completions`;
    const modelsUrl = `${base.replace(/\/$/, "")}/models`;
    const limit = parseInt(env.RATE_LIMIT || String(DEFAULTS.RATE_LIMIT), 10);
    const windowMs = parseInt(env.RATE_WINDOW || String(DEFAULTS.RATE_WINDOW), 10);

    // Passthrough: let the widget fetch the model catalog (no rate limit).
    if (request.url.endsWith("/models") || request.method === "GET") {
      try {
        const res = await fetch(modelsUrl, { method: "GET" });
        const data = await res.json().catch(() => ({ data: [] }));
        return json(data, res.ok ? 200 : res.status, origin);
      } catch {
        return json({ data: [] }, 502, origin);
      }
    }

    const ip =
      (request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For") ||
        "anonymous").split(",")[0].trim();

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Rate limit
    if (!rateOK(ip, limit, windowMs)) {
      return json(
        { error: "rate_limited", detail: "Too many requests. Slow down a little." },
        429,
        origin
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, origin);
    }

    const headers = { "Content-Type": "application/json" };
    if (env.OMNIRUTE_API_KEY) headers["Authorization"] = `Bearer ${env.OMNIRUTE_API_KEY}`;

    let res;
    try {
      res = await fetch(chatUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...payload, stream: payload.stream !== false }),
      });
    } catch {
      return json({ error: "relay_unreachable" }, 502, origin);
    }

    if (!res.ok || !res.body) {
      const errBody = await res.text().catch(() => "");
      return json(
        { error: "relay_error", status: res.status, detail: errBody.slice(0, 500) },
        res.status >= 500 ? 502 : res.status,
        origin
      );
    }

    // Stream: re-emit the relay's SSE as our own SSE (keeps live typing).
    if (res.headers.get("content-type")?.includes("event-stream")) {
      return new Response(res.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Non-streaming: echo JSON back.
    const jsonOut = await res.json().catch(() => null);
    return json(
      jsonOut !== null ? JSON.stringify(jsonOut) : await res.text(),
      200,
      origin
    );
  },
};
