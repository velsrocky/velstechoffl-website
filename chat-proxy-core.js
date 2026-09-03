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
};

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