/* Tests for chat-proxy-core.js – the pure / testable layer of the AI chat
 * Cloudflare Worker. Covers CORS origin policy, rate limiter, OpenAI<->Anthropic
 * message conversion, and the two SSE stream converters (Cloudflare + Anthropic
 * -> OpenAI format).
 *
 * Run: `node --test tests/chat-proxy.test.js`
 * CI:  included in build-check.yml.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const CORE_PATH = path.join(__dirname, "..", "chat-proxy-core.js");
// Dynamic import – chat-proxy-core.js is ESM (Workers import it the same way).
let core;
test.before(async () => {
  core = await import(CORE_PATH);
});

/* ---------- getCorsOrigin ---------- */

test("getCorsOrigin: empty Origin header returns primary (server-to-server safety)", () => {
  const req = { headers: { get: () => "" } };
  const env = { ALLOWED_ORIGIN: "https://velstech.net" };
  assert.equal(core.getCorsOrigin(req, env), "https://velstech.net");
});

test("getCorsOrigin: matching primary echoes primary (cacheable)", () => {
  const req = { headers: { get: () => "https://velstech.net" } };
  const env = { ALLOWED_ORIGIN: "https://velstech.net" };
  assert.equal(core.getCorsOrigin(req, env), "https://velstech.net");
});

test("getCorsOrigin: localhost (any port) echoes origin (preview / dev)", () => {
  for (const port of [3000, 5173, 8080, 8787]) {
    const req = { headers: { get: () => `http://localhost:${port}` } };
    const env = { ALLOWED_ORIGIN: "https://velstech.net" };
    assert.equal(core.getCorsOrigin(req, env), `http://localhost:${port}`);
  }
});

test("getCorsOrigin: 127.0.0.1 echoes origin", () => {
  const req = { headers: { get: () => "http://127.0.0.1:5500" } };
  const env = { ALLOWED_ORIGIN: "https://velstech.net" };
  assert.equal(core.getCorsOrigin(req, env), "http://127.0.0.1:5500");
});

test("getCorsOrigin: subdomain of velstech.net echoes origin", () => {
  for (const sub of ["chat", "staging", "dev"]) {
    const req = { headers: { get: () => `https://${sub}.velstech.net` } };
    const env = { ALLOWED_ORIGIN: "https://velstech.net" };
    assert.equal(core.getCorsOrigin(req, env), `https://${sub}.velstech.net`);
  }
});

test("getCorsOrigin: same hostname, different protocol echoes origin (http/https variant)", () => {
  const req = { headers: { get: () => "http://velstech.net" } };
  const env = { ALLOWED_ORIGIN: "https://velstech.net" };
  assert.equal(core.getCorsOrigin(req, env), "http://velstech.net");
});

test("getCorsOrigin: foreign origin returns primary (does NOT echo attacker origin)", () => {
  const req = { headers: { get: () => "https://evil.example.com" } };
  const env = { ALLOWED_ORIGIN: "https://velstech.net" };
  assert.equal(core.getCorsOrigin(req, env), "https://velstech.net");
});

test("getCorsOrigin: malformed Origin header returns primary instead of throwing", () => {
  const req = { headers: { get: () => "not a url" } };
  const env = { ALLOWED_ORIGIN: "https://velstech.net" };
  assert.equal(core.getCorsOrigin(req, env), "https://velstech.net");
});

test("getCorsOrigin: falls back to DEFAULTS.ORIGIN when env.ALLOWED_ORIGIN is missing", () => {
  const req = { headers: { get: () => "https://evil.example.com" } };
  assert.equal(core.getCorsOrigin(req, {}), "https://velstech.net");
});

/* ---------- corsPreflight ---------- */

test("corsPreflight: returns the standard CORS preflight headers", () => {
  const res = core.corsPreflight("https://velstech.net");
  assert.equal(res.status, 204);
  assert.equal(res.headers["Access-Control-Allow-Origin"], "https://velstech.net");
  assert.match(res.headers["Access-Control-Allow-Methods"], /POST/);
  assert.match(res.headers["Access-Control-Allow-Methods"], /OPTIONS/);
  assert.equal(res.headers["Access-Control-Allow-Headers"], "Content-Type");
  assert.equal(res.headers["Vary"], "Origin");
  assert.equal(res.headers["Access-Control-Max-Age"], "86400");
});

/* ---------- getClientIp ---------- */

test("getClientIp: prefers CF-Connecting-IP (Cloudflare's real client header)", () => {
  const req = { headers: { get: (n) => (n === "CF-Connecting-IP" ? "1.2.3.4" : "9.9.9.9") } };
  assert.equal(core.getClientIp(req), "1.2.3.4");
});

test("getClientIp: falls back to X-Forwarded-For when CF-Connecting-IP missing", () => {
  const req = { headers: { get: (n) => (n === "X-Forwarded-For" ? "5.6.7.8" : null) } };
  assert.equal(core.getClientIp(req), "5.6.7.8");
});

test("getClientIp: takes first value from comma-separated XFF", () => {
  const req = { headers: { get: (n) => (n === "X-Forwarded-For" ? "1.1.1.1, 2.2.2.2, 3.3.3.3" : null) } };
  assert.equal(core.getClientIp(req), "1.1.1.1");
});

test("getClientIp: returns 'anonymous' when no headers present", () => {
  const req = { headers: { get: () => null } };
  assert.equal(core.getClientIp(req), "anonymous");
});

/* ---------- rateOK ---------- */

test("rateOK: allows up to `limit` hits within the window", () => {
  const hits = new Map();
  const now = 1_000_000;
  for (let i = 0; i < 5; i++) {
    assert.equal(core.rateOK(hits, "1.1.1.1", 5, 60_000, now + i), true);
  }
  assert.equal(core.rateOK(hits, "1.1.1.1", 5, 60_000, now + 5), false);
});

test("rateOK: hits outside the window are forgotten", () => {
  const hits = new Map();
  const now = 1_000_000;
  core.rateOK(hits, "1.1.1.1", 2, 1000, now);
  core.rateOK(hits, "1.1.1.1", 2, 1000, now + 100);
  // Window expired at now+1000.
  assert.equal(core.rateOK(hits, "1.1.1.1", 2, 1000, now + 2000), true);
});

test("rateOK: separate IPs do not share counters", () => {
  const hits = new Map();
  const now = 1_000_000;
  core.rateOK(hits, "1.1.1.1", 1, 60_000, now);
  // 1.1.1.1 is now blocked, but 2.2.2.2 is unaffected.
  assert.equal(core.rateOK(hits, "1.1.1.1", 1, 60_000, now), false);
  assert.equal(core.rateOK(hits, "2.2.2.2", 1, 60_000, now), true);
});

test("rateOK: when blocked, does NOT record a hit (caller can retry later)", () => {
  const hits = new Map();
  const now = 1_000_000;
  core.rateOK(hits, "1.1.1.1", 1, 60_000, now);
  const before = hits.get("1.1.1.1").length;
  core.rateOK(hits, "1.1.1.1", 1, 60_000, now);
  const after = hits.get("1.1.1.1").length;
  assert.equal(after, before, "blocked calls must not extend the hit list");
});

test("rateOK: limit=0 blocks all requests (edge case sanity)", () => {
  const hits = new Map();
  assert.equal(core.rateOK(hits, "1.1.1.1", 0, 60_000, 0), false);
});

/* ---------- toAnthropicMessages ---------- */

test("toAnthropicMessages: extracts the system message into its own field", () => {
  const out = core.toAnthropicMessages([
    { role: "system", content: "You are helpful." },
    { role: "user", content: "Hi" },
    { role: "assistant", content: "Hello!" },
  ]);
  assert.equal(out.system, "You are helpful.");
  assert.deepEqual(out.messages, [
    { role: "user", content: "Hi" },
    { role: "assistant", content: "Hello!" },
  ]);
});

test("toAnthropicMessages: empty input returns empty system + messages", () => {
  const out = core.toAnthropicMessages([]);
  assert.equal(out.system, "");
  assert.deepEqual(out.messages, []);
});

test("toAnthropicMessages: missing system message yields empty system", () => {
  const out = core.toAnthropicMessages([
    { role: "user", content: "Hi" },
    { role: "assistant", content: "Hello!" },
  ]);
  assert.equal(out.system, "");
  assert.equal(out.messages.length, 2);
});

test("toAnthropicMessages: first system wins when multiple system messages are sent", () => {
  const out = core.toAnthropicMessages([
    { role: "system", content: "First" },
    { role: "user", content: "x" },
    { role: "system", content: "Second" },
  ]);
  assert.equal(out.system, "First");
  // The second system is dropped from messages because we filter by role !== "system".
  // This is the documented behaviour but worth a regression test.
  assert.equal(out.messages.length, 1);
});

/* ---------- convertCloudflareStream ---------- */

test("convertCloudflareStream: converts a single {response: 'hi'} chunk to OpenAI delta", async () => {
  const input = core.stringToStream(['data: {"response":"hi"}\n\n']);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"hi"/);
  assert.match(text, /"delta":/);
  assert.match(text, /data: \[DONE\]/);
});

test("convertCloudflareStream: handles multiple chunks split across reads", async () => {
  // Real SSE arrives across multiple HTTP chunks.
  const input = core.stringToStream([
    'data: {"response":"Hel',
    'lo"}\n\ndata: {"response":" world"}\n\n',
  ]);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  // Should be reassembled into 2 OpenAI deltas + DONE.
  const matches = text.match(/"content":"[^"]*"/g) || [];
  assert.deepEqual(matches, ['"content":"Hello"', '"content":" world"']);
});

test("convertCloudflareStream: ignores non-data lines (event:, comments, blank)", async () => {
  const input = core.stringToStream([
    ": heartbeat\n\nevent: ping\n\n" + 'data: {"response":"x"}' + "\n\n\n",
  ]);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"x"/);
  // No spurious empty data: lines.
  assert.equal((text.match(/data: \n/g) || []).length, 0);
});

test("convertCloudflareStream: skips unparseable JSON without crashing", async () => {
  const input = core.stringToStream([
    "data: not-json\n\ndata: {\"response\":\"ok\"}\n\n",
  ]);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"ok"/);
  assert.match(text, /data: \[DONE\]/);
});

test("convertCloudflareStream: skips [DONE] sentinels from upstream", async () => {
  const input = core.stringToStream([
    'data: {"response":"a"}\n\ndata: [DONE]\n\n',
  ]);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  // Exactly ONE [DONE] (ours), not two (would mean upstream's leaked through).
  const dones = (text.match(/data: \[DONE\]/g) || []).length;
  assert.equal(dones, 1);
});

test("convertCloudflareStream: drops chunks with falsy response ('' / 0 / null / undefined)", async () => {
  // The implementation guards on `if (json.response)` so empty strings and
  // zero/numeric responses are treated as 'nothing to emit'. Lock that in.
  const input = core.stringToStream([
    'data: {"response":""}\n\n',
    'data: {"response":0}\n\n',
    'data: {"foo":"bar"}\n\n', // no response field
  ]);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  // Only the [DONE] sentinel survives.
  assert.equal(text, "data: [DONE]\n\n");
});

test("convertCloudflareStream: chunk that contains no newline yet is buffered until next chunk", async () => {
  // The first chunk ends mid-line; the buffer should hold it until the next chunk completes the line.
  const input = core.stringToStream([
    'data: {"response":"par',
    'tial"}\n\n',
  ]);
  const output = core.convertCloudflareStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"partial"/);
});

/* ---------- convertAnthropicStream ---------- */

test("convertAnthropicStream: maps content_block_delta with text to OpenAI delta", async () => {
  const input = core.stringToStream([
    'data: {"type":"content_block_delta","delta":{"text":"hi"}}\n\n',
  ]);
  const output = core.convertAnthropicStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"hi"/);
  assert.match(text, /data: \[DONE\]/);
});

test("convertAnthropicStream: drops other Anthropic event types (message_start, etc.)", async () => {
  const input = core.stringToStream([
    'data: {"type":"message_start","message":{"id":"x"}}\n\n',
    'data: {"type":"content_block_start","index":0}\n\n',
    'data: {"type":"content_block_delta","delta":{"text":"kept"}}\n\n',
    'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n',
  ]);
  const output = core.convertAnthropicStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"kept"/);
  assert.equal((text.match(/message_start/g) || []).length, 0);
  assert.equal((text.match(/content_block_start/g) || []).length, 0);
  assert.equal((text.match(/message_delta/g) || []).length, 0);
});

test("convertAnthropicStream: handles content_block_delta with empty text", async () => {
  const input = core.stringToStream([
    'data: {"type":"content_block_delta","delta":{"text":""}}\n\n',
  ]);
  const output = core.convertAnthropicStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":""/);
});

test("convertAnthropicStream: ignores malformed JSON", async () => {
  const input = core.stringToStream([
    "data: not-json\n\ndata: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"ok\"}}\n\n",
  ]);
  const output = core.convertAnthropicStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"ok"/);
  assert.match(text, /data: \[DONE\]/);
});

test("convertAnthropicStream: emits exactly one [DONE] sentinel even if upstream also sent one", async () => {
  const input = core.stringToStream([
    'data: {"type":"content_block_delta","delta":{"text":"x"}}\n\n',
    "data: [DONE]\n\n",
  ]);
  const output = core.convertAnthropicStream(input);
  const text = await core.readStreamAsText(output);
  assert.equal((text.match(/data: \[DONE\]/g) || []).length, 1);
});

test("convertAnthropicStream: handles chunks split mid-line (buffer)", async () => {
  const input = core.stringToStream([
    'data: {"type":"content_block_delta","delta":{"tex',
    't":"partial"}}\n\n',
  ]);
  const output = core.convertAnthropicStream(input);
  const text = await core.readStreamAsText(output);
  assert.match(text, /"content":"partial"/);
});