/*
 * VelsTech AI chat proxy – Cloudflare Worker.
 *
 * Supports: cloudflare (Workers AI), openai, anthropic, omniroute.
 *
 * Safety by default:
 *   - CORS locked to ALLOWED_ORIGIN
 *   - Per-IP rate limiting
 *   - No request bodies logged
 *
 * Deployment:
 *   1. Set in wrangler.toml:
 *        AI_PROVIDER = "cloudflare"  # or "openai" / "anthropic" / "omniroute"
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
  rateOK,
  getCorsOrigin,
  corsPreflight,
  getClientIp,
  toAnthropicMessages,
  convertCloudflareStream,
  convertAnthropicStream,
} from "./chat-proxy-core.js";

// Per-IP hit counters for rateOK(). Module-scope so they persist across
// requests inside a single Worker instance (Workers are long-lived; this map
// is a sliding window per isolate).
const hitCounts = new Map();

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
    const origin = getCorsOrigin(request, env);
    const provider = env.AI_PROVIDER || DEFAULTS.AI_PROVIDER;
    const model = env.AI_MODEL || DEFAULTS.AI_MODEL;
    const limit = parseInt(env.RATE_LIMIT || String(DEFAULTS.RATE_LIMIT), 10);
    const windowMs = parseInt(env.RATE_WINDOW || String(DEFAULTS.RATE_WINDOW), 10);

    // CORS preflight
    if (request.method === "OPTIONS") {
      const pf = corsPreflight(origin);
      return new Response(null, pf);
    }

    // GET /api/models -> list models the playground can offer.
    if (request.method === "GET" && new URL(request.url).pathname === "/api/models") {
      const list = (env.PLAYGROUND_MODELS && JSON.parse(env.PLAYGROUND_MODELS)) || [
        "@cf/meta/llama-3.1-8b-instruct",
        "@cf/meta/llama-3.2-3b-instruct",
        "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        "@cf/qwen/qwen2.5-7b-instruct",
        "@cf/qwen/qwen3-8b",
      ];
      return json(JSON.stringify({ models: list }), 200, origin);
    }

    // GET /api/rss?url=<encoded> -> fetch an RSS/Atom feed server-side and return
    // its raw XML (the browser page parses it with DOMParser). Avoids CORS on
    // arbitrary feed hosts; rate-limited like the chat endpoint.
    if (request.method === "GET" && new URL(request.url).pathname === "/api/rss") {
      const target = new URL(request.url).searchParams.get("url");
      if (!target) return json({ error: "missing_url" }, 400, origin);
      try {
        const res = await fetch(target, { headers: { "User-Agent": "VelsTech-RSS/1.0" } });
        const body = await res.text();
        return new Response(body, {
          status: res.status,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Access-Control-Allow-Origin": origin,
          },
        });
      } catch (err) {
        return json({ error: "fetch_failed", detail: err.message }, 502, origin);
      }
    }

    const ip = getClientIp(request);

    // Rate limit
    if (!rateOK(hitCounts, ip, limit, windowMs)) {
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

    // Route to appropriate provider
    try {
      if (provider === "openai") {
        return await handleOpenAI(payload, env, origin, model);
      } else if (provider === "anthropic") {
        return await handleAnthropic(payload, env, origin, model);
      } else if (provider === "cloudflare") {
        return await handleCloudflare(payload, env, origin, model);
      } else {
        // OmniRoute or other OpenAI-compatible
        return await handleOmniroute(payload, env, origin, model);
      }
    } catch (err) {
      return json({ error: "provider_error", detail: err.message }, 502, origin);
    }
  },
};

async function handleOpenAI(payload, env, origin, model) {
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
      temperature: payload.temperature,
      top_p: payload.top_p,
      max_tokens: payload.max_tokens,
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

async function handleAnthropic(payload, env, origin, model) {
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
      max_tokens: 1024,
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

async function handleOmniroute(payload, env, origin, model) {
  const baseUrl = env.OMNIRUTE_BASE_URL;
  if (!baseUrl) return json({ error: "missing_omniroute_url" }, 500, origin);

  const chatUrl = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const headers = { "Content-Type": "application/json" };
  if (env.OMNIRUTE_API_KEY) headers["Authorization"] = `Bearer ${env.OMNIRUTE_API_KEY}`;

  const res = await fetch(chatUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model,
      messages: payload.messages,
      stream: payload.stream !== false,
    }),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    return json({ error: "relay_error", status: res.status, detail: errBody.slice(0, 500) }, res.status >= 500 ? 502 : res.status, origin);
  }

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

async function handleCloudflare(payload, env, origin, model) {
  const apiKey = env.CLOUDFLARE_API_KEY;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiKey || !accountId) return json({ error: "missing_cloudflare_config" }, 500, origin);

  // Cloudflare Workers AI endpoint format: https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
  // Prefer the model the client requested (so the widget's fallback chain works),
  // otherwise fall back to the model configured in wrangler.toml.
  const activeModel = payload.model || model;
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