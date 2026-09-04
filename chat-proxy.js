/*
 * VelsTech AI chat proxy – Cloudflare Worker.
 *
 * Supports: cloudflare (Workers AI), openai, anthropic.
 *
 * Safety by default:
 *   - CORS locked to ALLOWED_ORIGIN (browser-side only – see validation below
 *     for what actually gates scripted clients)
 *   - Per-IP rate limiting, bucketed per endpoint (chat vs rss)
 *   - Chat payloads validated, generation options clamped, models allowlisted
 *   - /api/rss: http(s) only, private/localhost/metadata hosts blocked,
 *     redirect targets re-validated, responses size-capped
 *   - No request bodies logged
 *
 * Deployment:
 *   1. Set in wrangler.toml:
  *        AI_PROVIDER = "cloudflare"  # or "openai" / "anthropic"
 *        AI_MODEL = "@cf/meta/llama-3.1-8b-instruct"
 *        ALLOWED_ORIGIN = "https://velstech.net"
 *   2. Set secrets:
 *        # cloudflare
 *        wrangler secret put CLOUDFLARE_API_KEY
 *        wrangler secret put CLOUDFLARE_ACCOUNT_ID
 *        # openai
 *        wrangler secret put OPENAI_API_KEY
 *        # anthropic
 *        wrangler secret put ANTHROPIC_API_KEY
 *   3. wrangler deploy
 *
 * Pure / testable helpers (CORS, rate limit, message / SSE converters) live
 * in ./chat-proxy-core.js and are covered by tests/chat-proxy.test.js.
 */

import {
  DEFAULTS,
  LIMITS,
  rateOK,
  getCorsOrigin,
  corsPreflight,
  getClientIp,
  toAnthropicMessages,
  convertCloudflareStream,
  convertAnthropicStream,
  validateMessages,
  clampOptions,
  allowedModel,
  validateFeedUrl,
  pruneHits,
  readCapped,
} from "./chat-proxy-core.js";

// Per-IP hit counters for rateOK(). Module-scope so they persist across
// requests inside a single Worker instance (Workers are long-lived; this map
// is a sliding window per isolate). Keys are bucketed ("chat:ip", "rss:ip").
const hitCounts = new Map();

function json(body, status, origin) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
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
    const res = await handle(request, env);
    // Every response we construct is local, so headers are mutable.
    try { res.headers.set("X-Content-Type-Options", "nosniff"); } catch {}
    return res;
  },
};

async function handle(request, env) {
    const origin = getCorsOrigin(request, env);
    const provider = env.AI_PROVIDER || DEFAULTS.AI_PROVIDER;
    const model = env.AI_MODEL || DEFAULTS.AI_MODEL;
    const limit = parseInt(env.RATE_LIMIT || String(DEFAULTS.RATE_LIMIT), 10);
    const windowMs = parseInt(env.RATE_WINDOW || String(DEFAULTS.RATE_WINDOW), 10);
    const rssLimit = parseInt(env.RSS_LIMIT || String(DEFAULTS.RSS_LIMIT), 10);
    const ip = getClientIp(request);

    if (hitCounts.size > 5000) pruneHits(hitCounts, windowMs);

    // CORS preflight
    if (request.method === "OPTIONS") {
      const pf = corsPreflight(origin);
      return new Response(null, pf);
    }

    // GET /api/models -> list models the playground can offer.
    if (request.method === "GET" && new URL(request.url).pathname === "/api/models") {
      let list;
      try {
        list = env.PLAYGROUND_MODELS ? JSON.parse(env.PLAYGROUND_MODELS) : DEFAULTS.PLAYGROUND_MODELS;
      } catch {
        list = DEFAULTS.PLAYGROUND_MODELS;
      }
      return json(JSON.stringify({ models: list }), 200, origin);
    }

    // GET /api/rss?url=<encoded> -> fetch an RSS/Atom feed server-side and
    // return its raw XML (the browser page parses it with DOMParser). This is
    // an outbound fetch on our account, so unlike the old version it is
    // rate-limited (own bucket), URL-validated (SSRF guard), size-capped, and
    // the post-redirect URL is re-validated.
    if (request.method === "GET" && new URL(request.url).pathname === "/api/rss") {
      if (!rateOK(hitCounts, "rss:" + ip, rssLimit, windowMs)) {
        return json({ error: "rate_limited", detail: "Too many feed requests. Slow down." }, 429, origin);
      }
      const check = validateFeedUrl(new URL(request.url).searchParams.get("url") || "");
      if (!check.ok) return json({ error: check.error }, 400, origin);
      try {
        const res = await fetch(check.url.toString(), {
          headers: { "User-Agent": "VelsTech-RSS/1.0" },
          redirect: "follow",
        });
        if (res.url && !validateFeedUrl(res.url).ok) {
          return json({ error: "redirect_not_allowed" }, 400, origin);
        }
        const body = res.body ? await readCapped(res.body, LIMITS.FEED_MAX_BYTES) : "";
        return new Response(body, {
          status: res.status,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": origin,
          },
        });
      } catch (err) {
        return json({ error: "fetch_failed", detail: err.message }, 502, origin);
      }
    }

    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, origin);
    }

    // Rate limit (chat bucket)
    if (!rateOK(hitCounts, "chat:" + ip, limit, windowMs)) {
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

    // Guardrails: a client must never be able to steer cost or abuse the
    // provider with our key – validate the conversation, clamp generation
    // options, and ignore client-supplied models outside the allowlist.
    const v = validateMessages(payload.messages);
    if (!v.ok) return json({ error: v.error }, 400, origin);
    const opts = clampOptions(payload);

    // Route to appropriate provider
    try {
      if (provider === "openai") {
        return await handleOpenAI(payload, opts, env, origin, model);
      } else if (provider === "anthropic") {
        return await handleAnthropic(payload, opts, env, origin, model);
      } else {
        // Default: Cloudflare Workers AI (also covers unset AI_PROVIDER).
        return await handleCloudflare(payload, opts, env, origin, model);
      }
    } catch (err) {
      return json({ error: "provider_error", detail: err.message }, 502, origin);
    }
}

async function handleOpenAI(payload, opts, env, origin, model) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: "missing_api_key" }, 500, origin);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: payload.messages,
      stream: payload.stream !== false,
      temperature: opts.temperature,
      top_p: opts.top_p,
      max_tokens: opts.max_tokens,
    }),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    return json({ error: "openai_error", status: res.status, detail: errBody.slice(0, 500) }, res.status, origin);
  }

  // Stream SSE
  if (res.headers.get("content-type")?.includes("event-stream")) {
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": origin,
      },
    });
  }

  const jsonOut = await res.json().catch(() => null);
  return json(jsonOut !== null ? JSON.stringify(jsonOut) : await res.text(), 200, origin);
}

async function handleAnthropic(payload, opts, env, origin, model) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "missing_api_key" }, 500, origin);

  const { system, messages } = toAnthropicMessages(payload.messages);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: opts.max_tokens,
      system: system,
      messages: messages,
      stream: payload.stream !== false,
    }),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    return json({ error: "anthropic_error", status: res.status, detail: errBody.slice(0, 500) }, res.status, origin);
  }

  // Stream SSE - Anthropic format needs conversion to OpenAI format for the widget
  if (res.headers.get("content-type")?.includes("event-stream")) {
    const transformedStream = convertAnthropicStream(res.body);
    return new Response(transformedStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": origin,
      },
    });
  }

  const jsonOut = await res.json().catch(() => null);
  return json(jsonOut !== null ? JSON.stringify(jsonOut) : await res.text(), 200, origin);
}

async function handleCloudflare(payload, opts, env, origin, model) {
  const apiKey = env.CLOUDFLARE_API_KEY;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiKey || !accountId) return json({ error: "missing_cloudflare_config" }, 500, origin);

  // Cloudflare Workers AI endpoint format: https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
  // Prefer the model the client requested (so the widget's fallback chain works)
  // but only if it is on the allowlist; otherwise use the configured model.
  const activeModel = allowedModel(payload.model, env) || model;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${activeModel}`;

  // Convert OpenAI messages to Cloudflare format
  const messages = payload.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: messages,
      stream: payload.stream !== false,
    }),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    return json({ error: "cloudflare_error", status: res.status, detail: errBody.slice(0, 500) }, res.status, origin);
  }

  // Cloudflare returns streaming in a different format, convert to OpenAI SSE
  if (payload.stream !== false && res.headers.get("content-type")?.includes("event-stream")) {
    const transformedStream = convertCloudflareStream(res.body);
    return new Response(transformedStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": origin,
      },
    });
  }

  // Non-streaming response
  const jsonOut = await res.json().catch(() => null);
  if (jsonOut && jsonOut.result?.response) {
    // Cloudflare format: { result: { response: "text" } }
    const openaiFormat = {
      choices: [{ message: { content: jsonOut.result.response } }],
    };
    return json(JSON.stringify(openaiFormat), 200, origin);
  }
  return json(jsonOut !== null ? JSON.stringify(jsonOut) : await res.text(), 200, origin);
}