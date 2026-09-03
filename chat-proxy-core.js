/* chat-proxy-core.js – pure / testable helpers for chat-proxy.js (Cloudflare Worker).
 *
 * This file is:
 *   - imported by chat-proxy.js in the Worker runtime (ES module import)
 *   - imported by tests/chat-proxy.test.js via `await import(...)` (Node test runner)
 *
 * What lives here:
 *   - CORS origin resolution (getCorsOrigin)
 *   - CORS preflight response builder
 *   - Per-IP sliding-window rate limiter (rateOK)
 *   - OpenAI <-> Anthropic message converter (toAnthropicMessages)
 *   - Anthropic SSE -> OpenAI SSE stream converter
 *   - Cloudflare Workers AI SSE -> OpenAI SSE stream converter
 *
 * What does NOT live here:
 *   - The fetch() event entry point (chat-proxy.js)
 *   - The provider-specific outbound fetch() calls (need live network / secrets)
 *
 * Pure ESM. No DOM, no global state. Uses Web Streams + TextDecoder/Encoder
 * (available in Node 18+ and Cloudflare Workers).
 */

export const DEFAULTS = {
  ORIGIN: "https://velstech.net",
  RATE_LIMIT: 30,
  RATE_WINDOW: 60000,
  RSS_LIMIT: 10,
  PLAYGROUND_MODELS: [
    "@cf/meta/llama-3.1-8b-instruct",
    "@cf/meta/llama-3.2-3b-instruct",
    "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    "@cf/qwen/qwen2.5-7b-instruct",
    "@cf/qwen/qwen3-8b",
  ],
};

/* Abuse/cost guardrails for chat requests and feed fetches. */
export const LIMITS = {
  MAX_MESSAGES: 50,
  MAX_MESSAGE_CHARS: 32000,
  MAX_TOTAL_CHARS: 100000,
  MAX_TOKENS: 8192,
  DEFAULT_MAX_TOKENS: 1024,
  FEED_MAX_BYTES: 512 * 1024,
};

const ROLES = new Set(["system", "user", "assistant"]);

/* Validate an OpenAI-style messages array. Returns { ok, error }. */
export function validateMessages(messages, limits) {
  const L = { ...LIMITS, ...(limits || {}) };
  if (!Array.isArray(messages) || messages.length === 0)
    return { ok: false, error: "messages_must_be_a_non_empty_array" };
  if (messages.length > L.MAX_MESSAGES) return { ok: false, error: "too_many_messages" };
  let total = 0;
  for (const m of messages) {
    if (!m || typeof m !== "object") return { ok: false, error: "message_must_be_an_object" };
    if (!ROLES.has(m.role)) return { ok: false, error: "invalid_role" };
    if (typeof m.content !== "string") return { ok: false, error: "content_must_be_a_string" };
    if (m.content.length > L.MAX_MESSAGE_CHARS) return { ok: false, error: "message_too_long" };
    total += m.content.length;
  }
  if (total > L.MAX_TOTAL_CHARS) return { ok: false, error: "conversation_too_large" };
  return { ok: true };
}

/* Clamp client-controlled generation options to safe ranges. */
export function clampOptions(payload, limits) {
  const L = { ...LIMITS, ...(limits || {}) };
  const num = (v) => (typeof v === "number" && isFinite(v) ? v : undefined);
  const maxTokens = num(payload.max_tokens);
  const out = {
    max_tokens: Math.max(1, Math.min(maxTokens === undefined ? L.DEFAULT_MAX_TOKENS : maxTokens, L.MAX_TOKENS)),
  };
  const temp = num(payload.temperature);
  if (temp !== undefined) out.temperature = Math.max(0, Math.min(temp, 2));
  const topP = num(payload.top_p);
  if (topP !== undefined) out.top_p = Math.max(0, Math.min(topP, 1));
  return out;
}

/* Return the requested model if it is on the allowlist (PLAYGROUND_MODELS +
 * the configured AI_MODEL), else null. Never lets a client pick an arbitrary
 * model with your credentials. */
export function allowedModel(model, env, defaults) {
  const D = defaults || DEFAULTS;
  let list;
  try {
    list = env && env.PLAYGROUND_MODELS ? JSON.parse(env.PLAYGROUND_MODELS) : D.PLAYGROUND_MODELS;
  } catch {
    list = D.PLAYGROUND_MODELS;
  }
  const ok = new Set([...(Array.isArray(list) ? list : []), env && env.AI_MODEL].filter(Boolean));
  return typeof model === "string" && ok.has(model) ? model : null;
}

/* SSRF guard for /api/rss: http(s) only, no credentials, no localhost /
 * private / link-local / metadata hosts (IP literals checked; DNS names
 * resolving to private IPs are out of reach from Worker egress anyway). */
const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.(0\.[02]|168)\./,
];

export function validateFeedUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, error: "invalid_url" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "only_http_https_allowed" };
  if (u.username || u.password) return { ok: false, error: "credentials_not_allowed" };
  const host = u.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) return { ok: false, error: "invalid_url" };
  if (
    host === "localhost" ||
    /\.(localhost|local|internal|localdomain|onion|test)$/.test(host)
  )
    return { ok: false, error: "host_not_allowed" };
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) && PRIVATE_V4.some((re) => re.test(host)))
    return { ok: false, error: "host_not_allowed" };
  if (/^(:{1,2}1|::$|f[cd][0-9a-f]{2}:|fe[89ab][0-9a-f]:)/.test(host)) return { ok: false, error: "host_not_allowed" };
  // IPv4-mapped IPv6, in both dotted and hex form (URL() normalizes to hex).
  const mapped = host.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/) && host.slice(7);
  const hexm = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  const mappedV4 = mapped || (hexm && `${parseInt(hexm[1], 16) >> 8 & 255}.${parseInt(hexm[1], 16) & 255}.${parseInt(hexm[2], 16) >> 8 & 255}.${parseInt(hexm[2], 16) & 255}`);
  if (mappedV4 && PRIVATE_V4.some((re) => re.test(mappedV4))) return { ok: false, error: "host_not_allowed" };
  return { ok: true, url: u };
}

/* Drop IPs whose hits have all aged out of the window, so the limiter map
 * cannot grow without bound on a long-lived isolate. Returns entries removed. */
export function pruneHits(hits, windowMs, now) {
  const t = typeof now === "number" ? now : Date.now();
  let removed = 0;
  for (const [ip, list] of hits) {
    const fresh = list.filter((ts) => t - ts < windowMs);
    if (fresh.length === 0) {
      hits.delete(ip);
      removed++;
    } else if (fresh.length !== list.length) {
      hits.set(ip, fresh);
    }
  }
  return removed;
}

/* Read a response body as text, stopping at maxBytes (protects memory and
 * keeps feed passthrough cheap). */
export async function readCapped(stream, maxBytes) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > maxBytes) {
      const keep = value.byteLength - (bytes - maxBytes);
      if (keep > 0) out += decoder.decode(value.subarray(0, keep), { stream: true });
      reader.cancel().catch(() => {});
      break;
    }
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

/* Sliding-window per-IP rate limiter.
 *   hits     – Map<ip, number[]>; mutated in place. Pass new Map() on first call.
 *   ip       – client identifier (string)
 *   limit    – max hits per window
 *   windowMs – window length in ms
 *   now      – optional Date.now() override (testable)
 * Returns true if the request is allowed (and records the hit), false if blocked.
 */
export function rateOK(hits, ip, limit, windowMs, now) {
  const t = typeof now === "number" ? now : Date.now();
  const list = (hits.get(ip) || []).filter((ts) => t - ts < windowMs);
  if (list.length >= limit) {
    hits.set(ip, list);
    return false;
  }
  list.push(t);
  hits.set(ip, list);
  return true;
}

/* Resolve the CORS origin for a request.
 *   request – { headers: { get(name): string|null } }
 *   env     – { ALLOWED_ORIGIN?: string }
 *   defaults (optional) – override DEFAULTS (used by tests)
 *
 * Behaviour (in priority order):
 *   1. Empty Origin header              -> return primary (lock down curl/server-to-server)
 *   2. Origin == primary ALLOWED_ORIGIN -> return primary (cacheable)
 *   3. localhost / 127.0.0.1            -> echo origin (preview environments)
 *   4. *.velstech.net / velstech.net    -> echo origin
 *   5. Same hostname as primary         -> echo origin (http/https variants)
 *   6. Otherwise                        -> return primary (NOT the request origin)
 */
export function getCorsOrigin(request, env, defaults) {
  const D = defaults || DEFAULTS;
  const reqOrigin = request.headers.get("Origin") || "";
  const primary = (env && env.ALLOWED_ORIGIN) || D.ORIGIN;
  if (!reqOrigin) return primary;
  if (reqOrigin === primary) return primary;
  if (reqOrigin.startsWith("http://localhost:") || reqOrigin.startsWith("http://127.0.0.1:")) return reqOrigin;
  if (reqOrigin.endsWith(".velstech.net") || reqOrigin === "https://velstech.net") return reqOrigin;
  try {
    const u = new URL(reqOrigin);
    const p = new URL(primary);
    if (u.hostname === p.hostname) return reqOrigin;
  } catch {
    // malformed origin -> primary
  }
  return primary;
}

/* Build the CORS preflight response. Returns a plain object (caller wraps in Response). */
export function corsPreflight(origin) {
  return {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  };
}

/* Extract the client IP from common Cloudflare / proxy headers. */
export function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "anonymous"
  ).split(",")[0].trim();
}

/* OpenAI messages -> Anthropic format. */
export function toAnthropicMessages(messages) {
  const system = (messages.find((m) => m.role === "system") || {}).content || "";
  const chatMessages = messages.filter((m) => m.role !== "system");
  return { system, messages: chatMessages };
}

/* Read a Web ReadableStream<Uint8Array> to a UTF-8 string. Test helper. */
export async function readStreamAsText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

/* Build a Uint8Array stream from a list of strings. Test helper. */
export function stringToStream(chunks) {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[i++]));
    },
  });
}

/* Transform a Cloudflare Workers AI SSE stream (data: {"response":"..."})
 * to OpenAI-compatible SSE (data: {"choices":[{"delta":{"content":"..."}}]}).
 *
 * Terminates the output stream with `data: [DONE]\n\n`.
 *
 * Robustness:
 *   - skips non-data lines (event:, comments, blank lines)
 *   - skips unparseable JSON
 *   - skips [DONE] sentinels from upstream
 *   - propagates stream errors
 */
export function convertCloudflareStream(body) {
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
              if (json.response) {
                const openaiFormat = {
                  choices: [{ delta: { content: json.response } }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
              }
            } catch {
              // Skip unparseable lines (matches upstream behaviour).
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/* Transform an Anthropic SSE stream to OpenAI-compatible SSE.
 * Maps only `content_block_delta` events with `delta.text`. Other Anthropic
 * events (message_start, content_block_start, message_delta, etc.) are
 * intentionally dropped – the widget doesn't use them.
 */
export function convertAnthropicStream(body) {
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
              if (json.type === "content_block_delta" && json.delta && typeof json.delta.text === "string") {
                const openaiFormat = {
                  choices: [{ delta: { content: json.delta.text } }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiFormat)}\n\n`));
              }
            } catch {
              // Skip unparseable lines.
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });
}