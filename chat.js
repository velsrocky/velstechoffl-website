/*
 * VelsTech AI chat widget.
 *
 * - Floating bubble (bottom-right) that opens a chat panel.
 * - Client-side retrieval: scores your ARTICLES against the question and uses
 *   the most relevant snippets as "site context" (injected into the message).
 * - Streams replies from OmniRoute.
 *
 * TWO BACKENDS (toggle with CHAT_BACKEND):
 *   "local"  → calls your local OmniRoute directly at
 *               OMNIRUTE_BASE_URL + "/chat/completions".
 *               No proxy, no key (OmniRoute is keyless). Works while the site
 *               and OmniRoute run on the same machine.
 *   "proxy"  (default) → calls your deployed Cloudflare Worker (chat-proxy.js),
 *               which proxies through Cloudflare Workers AI.
 */
(function () {
  "use strict";

  // "local" or "proxy"
  const CHAT_BACKEND = "proxy";

  // Local backend: your OmniRoute API base (the OpenAI-compatible endpoint).
  // NOTE: the API is at /v1 – /home is only the web dashboard.
  const OMNIRUTE_BASE_URL = "http://localhost:20128/v1";

  // Proxy backend: the URL where you deployed chat-proxy.js.
  const CHAT_PROXY_URL = "https://chat.velstech.net";

  // Model sent to the proxy. With CHAT_BACKEND = "proxy", this must be a
  // Cloudflare Workers AI model name (e.g. @cf/meta/llama-3.1-8b-instruct).
  // With CHAT_BACKEND = "local", use an OmniRoute provider model (e.g.
  // "kr/claude-haiku-4.5"); avoid "auto/*" combos, which force tool-calling
  // and can return no text for a plain chat message.
  const CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

  // If the primary model returns no text, retry with these in order until one
  // replies. Keep these valid for the active backend (Cloudflare Workers AI
  // names for proxy mode, OmniRoute names for local mode).
  const CHAT_FALLBACK_MODELS = [
    "@cf/meta/llama-3.2-3b-instruct",
    "@cf/qwen/qwen2.5-7b-instruct",
  ];

  // Active model (defaults to CHAT_MODEL; kept simple – no runtime picker).
  let activeModel = CHAT_MODEL;

  // i18n helpers for chat – uses i18n.js if loaded
  function getChatLang() {
    try {
      if (window.VelsI18n && window.VelsI18n.getLang) return window.VelsI18n.getLang();
      const s = localStorage.getItem("vt-lang");
      if (s && ["en","ta","hi"].includes(s)) return s;
    } catch {}
    return "en";
  }
  function tChat(key) {
    try {
      if (window.VelsI18n && window.VelsI18n.t) return window.VelsI18n.t(key);
    } catch {}
    return key;
  }
  function chatLangName(lang) {
    return lang === "ta" ? "Tamil (தமிழ்)" : lang === "hi" ? "Hindi (हिन्दी)" : "English";
  }

  // System prompt (scoped, safe-by-design). Sent as a `system` message in both
  // local and proxy modes.
  const CHAT_GUIDANCE_BASE =
    "You are the VelsTech assistant – a helpful, friendly, plain-language helper for a " +
    "personal technology blog (velstech.net) aimed at tech-curious beginners and intermediate users.\n" +
    "You can usually answer any question directly. Treat the blog content below as OPTIONAL " +
    "supplementary reference – it is only included when the user's question seems related to the blog.\n" +
    "Guidelines:\n" +
    "- Answer the user's question directly and helpfully. This includes general (non-blog) questions: " +
    "never refuse or say you lack access just because blog content wasn't provided.\n" +
    "- If the question relates to a blog topic (AI/ML, hardware, operating systems, networking, security, programming, tutorials) and blog content is provided, use it to give an accurate, specific answer and cite the article title(s).\n" +
    "- If 'Current page content' is provided, it is the authoritative text of the page the user is viewing. Use it to summarize/explain that page accurately and cite its title/URL when relevant. Do not hallucinate beyond it.\n" +
    "- For high-stakes topics (security, passwords, financial, legal, medical advice), do NOT give definitive instructions. Summarize what the blog says and recommend the reader consult the relevant guide or email hello@velstech.net.\n" +
    "- Be concise, friendly, and plain-language. Use short paragraphs and bullet points.\n" +
    "- Typography: use en dash – with spaces for dashes, never em dash —. Example: 'X – Y' not 'X — Y'.\n" +
    "- If you don't know or the blog doesn't cover it, say so honestly instead of guessing.\n" +
    "- Glossary skill: when user asks 'what is X', 'define X', 'full form of X', or 'explain X in context', ALWAYS start with the full form on line 1 as 'X – Full Form', then 1-sentence definition + 1-2 sentence contextual note from Current page content if present. Example: 'GGUF – GGML Universal File: single-file container for quantized LLMs...'. Never omit the expansion for acronyms (GPU, VRAM, GGUF, RAG, KV cache, etc.). Keep under 80 words unless asked for more.";
  function getChatGuidance() {
    const lang = getChatLang();
    if (lang === "en") return CHAT_GUIDANCE_BASE;
    return CHAT_GUIDANCE_BASE + "\n- Language: respond in " + chatLangName(lang) + ". Keep the same concise, plain-language style but in that language. If the user wrote in another language, still reply in " + chatLangName(lang) + ".";
  }

  // Expose programmatic API for glossary/term clicks and selection chip
  // Usage: VelsChat.ask('Explain GPU in context...', {forcePage:true})
  let _sendMessageRef = null;

  const ART = (typeof ARTICLES !== "undefined") ? ARTICLES : [];

  // ---------- page-aware context (DOM extraction) ----------
  function extractPageContext(limit) {
    limit = limit || 4000;
    try {
      const title = (document.querySelector('.article-page .title')?.textContent
        || document.querySelector('.page-hero h1')?.textContent
        || document.querySelector('h1')?.textContent
        || document.title || '').trim();
      const bodyEl = document.querySelector('.article-body')
        || document.querySelector('.article-page')
        || document.querySelector('main');
      let body = bodyEl ? bodyEl.innerText : '';
      // Normalise whitespace and trim to limit
      body = body.replace(/\s+/g, ' ').trim().slice(0, limit);
      const url = location.href;
      if (!body) return '';
      return `Title: ${title}\nURL: ${url}\nContent: ${body}`;
    } catch { return ''; }
  }

  function shouldIncludePageContext(query) {
    return /(this page|this article|this post|this tool|this calculator|current page|explain this|summarize|tl;dr|what (is|does) this)/i.test(query);
  }

  function isArticlePage() {
    return !!document.querySelector('.article-body, .article-page');
  }

  // ---------- lightweight retrieval (keyword scoring) ----------
  function tokenize(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  }

  function retrieveContext(query, limit) {
    const qTokens = tokenize(query);
    if (!qTokens.length || !ART.length) return { text: "", matched: [] };

    const relevant = ART.map((a) => {
      const fields = [a.title, a.description, a.category, (a.tags || []).join(" ")].join(" ");
      const fTokens = tokenize(fields);
      let score = 0;
      qTokens.forEach((qt) => {
        fTokens.forEach((ft) => {
          if (ft === qt) score += 3;
          else if (ft.startsWith(qt) || qt.startsWith(ft)) score += 1;
        });
      });
      // small boost for title/category matches
      if ((a.title || "").toLowerCase().includes(query.toLowerCase())) score += 2;
      return { a, score };
    }).filter((r) => r.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, limit || 4)
      .map((r) => r.a);

    const text = relevant
      .map((a) => `- ${a.title} (${a.category}): ${a.description}`)
      .join("\n");
    return { text, matched: relevant };
  }


  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderContent(raw) {
    // Normalize lengthy em dashes to en dash per site style
    const normalized = String(raw).replace(/—/g, "–");
    return esc(normalized)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  }

  // ---------- DOM ----------
  function ensureContainer() {
    if (document.getElementById("vt-chat-root")) return;
    const root = document.createElement("div");
    root.id = "vt-chat-root";
    const _t = (k) => { try { if (window.VelsI18n) return window.VelsI18n.t(k); } catch {} return k; };
    root.innerHTML = `
      <button id="vt-chat-bubble" class="vt-bubble" aria-label="${_t("chat_open")}" aria-expanded="false">
        <img src="/chatbot.png?v=1" alt="" width="34" height="34" class="vt-bubble-img" aria-hidden="true" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'"/>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:none">
          <line x1="12" y1="8.6" x2="12" y2="6.4" />
          <g class="vt-bulb"><circle cx="12" cy="4.2" r="2" fill="white" stroke="currentColor" stroke-width="1.4"/><path d="M11 4.2 L11.4 5.0 L12 4.2 L12.6 5.0 L13 4.2" fill="none" stroke="#06121f" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"/></g>
          <rect x="6.5" y="9.2" width="11" height="9.2" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="9.6" cy="13.2" r="1" fill="currentColor" stroke="none"/><circle cx="14.4" cy="13.2" r="1" fill="currentColor" stroke="none"/>
          <path d="M10 15.6 H14" stroke="currentColor" stroke-width="1" />
          <path d="M6.5 12.2 H5.2 A1 1 0 0 0 6.5 14" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M17.5 12.2 H18.8 A1 1 0 0 1 17.5 14" fill="none" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        <span class="vt-bubble-dot" aria-hidden="true"></span>
      </button>
      <div id="vt-chat-panel" class="vt-panel" hidden>
        <header class="vt-header">
          <div class="vt-header-title">
            <span class="vt-logo" aria-hidden="true">◆</span>
            <div>
              <h4 class="vt-title">${_t("chat_title")}</h4>
              <span class="vt-sub">${_t("chat_sub")}</span>
            </div>
          </div>
          <div class="vt-header-controls">
            <button id="vt-chat-close" class="vt-ico" aria-label="${_t("chat_close")}">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>
        <div id="vt-page-bar" class="vt-page-bar" hidden>
          <button id="vt-page-explain" class="vt-page-btn" type="button">${_t("chat_explain_page")}</button>
          <span class="vt-page-hint">${_t("chat_explain_hint")}</span>
        </div>
        <div id="vt-chat-messages" class="vt-messages"></div>
        <form id="vt-chat-form" class="vt-form" autocomplete="off">
          <textarea id="vt-chat-input" class="vt-input" rows="1" placeholder="${_t("chat_placeholder")}" aria-label="Message"></textarea>
          <button id="vt-chat-send" type="submit" class="vt-send" aria-label="${_t("chat_send")}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <p class="vt-disclaimer">${_t("chat_disclaimer")}</p>
      </div>`;
    document.body.appendChild(root);
  }

  const $ = (id) => document.getElementById(id);

  function openPanel() {
    const p = $("vt-chat-panel");
    p.hidden = false;
    $("vt-chat-bubble").setAttribute("aria-expanded", "true");
    setTimeout(() => $("vt-chat-input").focus(), 60);
  }
  function closePanel() {
    const p = $("vt-chat-panel");
    p.hidden = true;
    $("vt-chat-bubble").setAttribute("aria-expanded", "false");
  }

  function addMessage(role, html) {
    const div = document.createElement("div");
    div.className = "vt-msg vt-" + role;
    div.innerHTML = html;
    $("vt-chat-messages").appendChild(div);
    div.scrollIntoView({ behavior: "smooth", block: "end" });
    return div;
  }

  function typingDot() {
    return '<span class="vt-dots"></span>';
  }

  function autoGrow(t) {
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 140) + "px";
  }

  async function sendMessage(text, opts) {
    opts = opts || {};
    if (!text.trim()) return;
    addMessage("user", renderContent(text));

    const status = addMessage("assistant", typingDot());
    let bodyEl = status.querySelector(".vt-bubble-text");
    if (!bodyEl) {
      bodyEl = document.createElement("div");
      bodyEl.className = "vt-bubble-text";
      status.appendChild(bodyEl);
    }

    const { text: context } = retrieveContext(text, 4);
    const includePage = opts.forcePage || shouldIncludePageContext(text);
    const pageContext = includePage ? extractPageContext(4000) : "";

    // Build messages: a scoped system prompt (guidance + retrieved blog
    // snippets + optional current-page content) followed by the user's question.
    // Works identically for local and proxy backends.
    const systemParts = [getChatGuidance()];
    if (pageContext) {
      systemParts.push("Current page content:\n" + pageContext);
      // show subtle indicator in the typing bubble
      bodyEl.setAttribute('data-page', '1');
    }
    if (context) systemParts.push("Relevant blog content:\n" + context);
    const messages = [
      { role: "system", content: systemParts.join("\n\n") },
      { role: "user", content: text },
    ];

    // Try models in order until one returns text (auto/* combos can return
    // tool-only responses with no text, so we fall back automatically).
    const endpoint = (CHAT_BACKEND === "local")
      ? (OMNIRUTE_BASE_URL.replace(/\/$/, "") + "/chat/completions")
      : CHAT_PROXY_URL;
    const models = [activeModel, ...CHAT_FALLBACK_MODELS];

    async function streamOne(model) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, model, stream: true }),
        });
        if (!res.ok || !res.body) {
          const e = await res.json().catch(() => ({}));
          throw new Error((e && e.detail) || (e && e.error) || (`HTTP ${res.status}`));
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let acc = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n\n")) >= 0) {
            const chunk = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const m = chunk.match(/^data:\s*(.+)$/m);
            const data = (m && m[1]) || "";
            if (data === "[DONE]") break;
            if (!data || data.startsWith("[ERROR]")) continue;
            const json = JSON.parse(data);
            const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
            if (delta) {
              acc += delta;
              bodyEl.innerHTML = renderContent(acc);
            }
          }
        }
        return acc;
      } catch (err) {
        bodyEl.innerHTML =
          '<span class="vt-error">Couldn\'t reach the assistant: ' + esc(err.message) + '</span>';
        return "";
      }
    }

    for (let i = 0; i < models.length; i++) {
      const text = await streamOne(models[i]);
      if (text && text.trim()) return;
    }
    bodyEl.innerHTML = renderContent(
      "Sorry, I couldn't put together an answer right now. Please try again, or " +
      '<a href="mailto:hello@velstech.net">email me</a>.'
    );
  }

  function updatePageBar() {
    const bar = $("vt-page-bar");
    if (!bar) return;
    bar.hidden = !isArticlePage();
  }

  function askVelsChat(prompt, opts) {
    if (!prompt || !prompt.trim()) return;
    openPanel();
    // slight delay so panel animation settles
    setTimeout(() => sendMessage(prompt, opts || { forcePage: true }), 80);
  }

  // expose early so define.js can call before DOMContentLoaded
  try {
    window.VelsChat = window.VelsChat || {};
    window.VelsChat.ask = askVelsChat;
    window.VelsChat.open = openPanel;
    window.VelsChat.close = closePanel;
    window.VelsChat.isReady = true;
  } catch {}

  function setupBubbleHint() {
    try {
      const dismissed = localStorage.getItem("vt-bubble-hint-dismissed");
      if (dismissed === "1") return;
      const bubble = $("vt-chat-bubble");
      if (!bubble) return;
      // Don't show if panel already open
      if (!$("vt-chat-panel")?.hidden) return;
      // Create hint
      let hint = document.getElementById("vt-bubble-hint");
      if (!hint) {
        hint = document.createElement("div");
        hint.id = "vt-bubble-hint";
        hint.className = "vt-bubble-hint";
        hint.setAttribute("role", "status");
        const lang = getChatLang();
        const msg = lang === "ta" ? "VelsChat-ஐ முயற்சிக்கவும் – ஏதேனும் சொல்லைப் பற்றி கேளுங்கள்!" : lang === "hi" ? "VelsChat आज़माएँ – किसी शब्द के बारे में पूछें!" : "Try VelsChat – ask about any term!";
        hint.innerHTML = `<span>${msg}</span><button class="vt-bubble-hint-close" aria-label="Dismiss">×</button>`;
        document.body.appendChild(hint);
        hint.querySelector(".vt-bubble-hint-close").addEventListener("click", (e) => {
          e.stopPropagation();
          hint.classList.remove("vt-show");
          try { localStorage.setItem("vt-bubble-hint-dismissed", "1"); } catch {}
          setTimeout(() => hint.remove(), 300);
        });
        hint.addEventListener("click", () => {
          try { localStorage.setItem("vt-bubble-hint-dismissed", "1"); } catch {}
          hint.classList.remove("vt-show");
          openPanel();
          setTimeout(() => hint.remove(), 300);
        });
      }
      const show = () => {
        if (!hint || hint.classList.contains("vt-show")) return;
        if (!$("vt-chat-panel")?.hidden) return;
        hint.classList.add("vt-show");
        // auto-hide after 6s
        setTimeout(() => {
          hint.classList.remove("vt-show");
          setTimeout(() => hint.remove(), 300);
        }, 6000);
      };
      // Show after 8s, or on scroll 40%, or on glossary hover
      let shown = false;
      const trigger = () => {
        if (shown) return;
        shown = true;
        show();
      };
      setTimeout(trigger, 8000);
      let scrollTriggered = false;
      window.addEventListener("scroll", () => {
        if (scrollTriggered) return;
        const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrolled > 0.4) { scrollTriggered = true; trigger(); }
      }, { passive: true });
      document.addEventListener("mouseover", (e) => {
        if (e.target.closest(".vt-term")) trigger();
      });
      // Dismiss if user opens chat
      bubble.addEventListener("click", () => {
        try { localStorage.setItem("vt-bubble-hint-dismissed", "1"); } catch {}
        if (hint) hint.remove();
      }, { once: true });
    } catch {}
  }

  async function init() {
    ensureContainer();
    updatePageBar();
    setupBubbleHint();

    // Use the default model configured in CHAT_MODEL (no picker needed).
    activeModel = CHAT_MODEL;

    $("vt-chat-bubble").addEventListener("click", () => {
      $("vt-chat-panel").hidden ? openPanel() : closePanel();
    });
    $("vt-chat-close").addEventListener("click", closePanel);
    const pageBtn = $("vt-page-explain");
    if (pageBtn) {
      pageBtn.addEventListener("click", () => {
        if (pageBtn.disabled) return;
        // force page context and give a clear prompt
        sendMessage("Explain this page briefly – what is it about, key points, and who is it for?", { forcePage: true });
      });
    }
    const ta = $("vt-chat-input");
    const form = $("vt-chat-form");
    ta.addEventListener("input", () => autoGrow(ta));
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = ta.value.trim();
      if (!v) return;
      ta.value = "";
      autoGrow(ta);
      sendMessage(v);
    });

    // Welcome message
    const welcome = tChat("chat_welcome");
    const w = addMessage("assistant", welcome);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
