/*
 * VelsTech AI chat proxy — Cloudflare Worker.
 *
 * Supports: OpenAI, Anthropic, or OmniRoute relay.
 *
 * Safety by default:
 *   - CORS locked to ALLOWED_ORIGIN
 *   - Per-IP rate limiting
 *   - No request bodies logged
 *
 * Deployment:
 *   1. Set in wrangler.toml:
 *        AI_PROVIDER = "openai"  # or "anthropic" or "omniroute"
 *        AI_MODEL = "gpt-4o-mini"
 *        ALLOWED_ORIGIN = "https://velstech.net"
 *   2. Set secrets:
 *        wrangler secret put OPENAI_API_KEY
 *        # or wrangler secret put ANTHROPIC_API_KEY
 *   3. wrangler deploy
 */

const DEFAULTS = {
  ORIGIN: "https://velstech.net",
  RATE_LIMIT: 30,
  RATE_WINDOW: 60000,
  AI_PROVIDER: "openai",
  AI_MODEL: "gpt-4o-mini",
};

// Per-IP sliding-window rate limiter
const hitCounts = new Map();
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

// Convert OpenAI-format messages to Anthropic format
function toAnthropicMessages(messages) {
  const system = messages.find(m => m.role === "system")?.content || "";
  const chatMessages = messages.filter(m => m.role !== "system");
  return { system, messages: chatMessages };
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || DEFAULTS.ORIGIN;
    const provider = env.AI_PROVIDER || DEFAULTS.AI_PROVIDER;
    const model = env.AI_MODEL || DEFAULTS.AI_MODEL;
    const limit = parseInt(env.RATE_LIMIT || String(DEFAULTS.RATE_LIMIT), 10);
    const windowMs = parseInt(env.RATE_WINDOW || String(DEFAULTS.RATE_WINDOW), 10);

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

    const ip =
      (request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For") ||
        "anonymous").split(",")[0].trim();

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
    // Convert Anthropic SSE to OpenAI SSE format
    const transformedStream = convertAnthropicStream(res.body, origin);
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
  const messages = payload.messages.map(m => ({
    role: m.role,
    content: m.content
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
      choices: [{ message: { content: jsonOut.result.response } }]
    };
    return json(JSON.stringify(openaiFormat), 200, origin);
  }
  return json(jsonOut !== null ? JSON.stringify(jsonOut) : await res.text(), 200, origin);
}

// Convert Cloudflare SSE stream to OpenAI format
function convertCloudflareStream(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              // Cloudflare format: { response: "text" }
              if (json.response) {
                const openaiFormat = {
                  choices: [{ delta: { content: json.response } }]
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

// Convert Anthropic SSE stream to OpenAI format
function convertAnthropicStream(body, origin) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              // Convert Anthropic event to OpenAI format
              if (json.type === "content_block_delta" && json.delta?.text) {
                const openaiFormat = {
                  choices: [{ delta: { content: json.delta.text } }]
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
