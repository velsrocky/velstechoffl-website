/**
 * VelsTech Define – global glossary auto-wrap + tooltip + selection chip.
 * Depends on: GLOSSARY (glossary.js) and window.VelsChat.ask (chat.js)
 */
(function () {
  "use strict";
  if (typeof GLOSSARY === "undefined") return;

  const SELECTOR = ".article-body";
  const MAX_PER_PAGE = 14;
  const SKIP_PARENTS = "a, code, pre, script, style, .vt-term, .code-block, .copy-btn, [data-no-define], .no-define";
  const MANUAL_SELECTOR = "[data-term]";

  let _done = false;
  function initDefine() {
    if (_done) return;
    _done = true;
    if (window.VelsDefine) return;
    const article = document.querySelector(SELECTOR);
    if (!article) return;

  // --- helpers ---
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function getArticleTitle() {
    return (document.querySelector(".article-page .title")?.textContent
      || document.querySelector("h1")?.textContent
      || document.title || "").trim();
  }

  // Sort longest first to prefer multi-word terms like "KV cache" over "cache"
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
  const lowerSet = new Set();

  // Track first occurrence per term (lowercase)
  let annotatedCount = 0;

  function createTermSpan(termKey, displayText) {
    const entry = GLOSSARY[termKey];
    if (!entry) return null;
    const sp = document.createElement("span");
    sp.className = "vt-term";
    sp.tabIndex = 0;
    sp.setAttribute("role", "button");
    sp.setAttribute("data-term", termKey);
    sp.setAttribute("aria-label", `Define ${termKey}: ${entry.fullForm}. Press Enter to ask VelsChat.`);
    sp.textContent = displayText;
    return sp;
  }

  function enhanceManualTerms() {
    // Authors can add <span data-term="CustomTerm">CustomTerm</span> for terms not in global glossary,
    // or to force annotation even if auto-wrap would skip. Also upgrades <abbr title="Full Form">ABBR</abbr>.
    article.querySelectorAll(MANUAL_SELECTOR).forEach((el) => {
      if (el.classList.contains("vt-term")) return;
      const key = el.getAttribute("data-term")?.trim();
      if (!key || !GLOSSARY[key]) return;
      if (el.closest("[data-no-define]")) return;
      el.classList.add("vt-term");
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      if (!el.getAttribute("aria-label")) {
        el.setAttribute("aria-label", `Define ${key}: ${GLOSSARY[key].fullForm}. Press Enter to ask VelsChat.`);
      }
      if (!lowerSet.has(key.toLowerCase())) {
        lowerSet.add(key.toLowerCase());
        annotatedCount++;
      }
    });
    // Upgrade <abbr title="Full Form">XYZ</abbr> if XYZ is in glossary
    article.querySelectorAll("abbr[title]").forEach((el) => {
      if (el.classList.contains("vt-term")) return;
      if (el.closest(SKIP_PARENTS)) return;
      if (el.closest("[data-no-define]")) return;
      const txt = el.textContent.trim();
      const key = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === txt.toLowerCase());
      if (!key) return;
      el.classList.add("vt-term");
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("data-term", key);
      el.setAttribute("aria-label", `Define ${key}: ${GLOSSARY[key].fullForm}. Press Enter to ask VelsChat.`);
      if (!lowerSet.has(key.toLowerCase())) {
        lowerSet.add(key.toLowerCase());
        annotatedCount++;
      }
    });
  }

  // First, enhance any manual / abbr terms (counts toward limit but never exceeds)
  enhanceManualTerms();

  // Wrap first occurrence of each term
  for (const term of terms) {
    if (annotatedCount >= MAX_PER_PAGE) break;
    const keyLower = term.toLowerCase();
    if (lowerSet.has(keyLower)) continue;
    // Respect per-element opt-out
    // (walker filter already skips [data-no-define] ancestors)

    // eslint check: exact phrase with word boundaries (case-insensitive)
    const re = new RegExp("\\b" + escRe(term) + "\\b", "i");

    // Walk text nodes
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(SKIP_PARENTS)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-no-define], .no-define")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    let found = false;
    while ((node = walker.nextNode())) {
      // Also ensure container is meaningful prose, not nav/meta
      const parentTag = node.parentElement ? node.parentElement.tagName : "";
      if (["H1", "H2", "H3"].includes(parentTag)) continue; // don't annotate headings
      if (node.parentElement.closest("[data-no-define], .no-define")) continue;

      const text = node.nodeValue;
      const m = text.match(re);
      if (!m) continue;

      const idx = m.index;
      const matched = m[0]; // preserve original casing from document

      // safety: don't annotate if term length < 2
      if (!matched || matched.length < 2) continue;

      const before = text.slice(0, idx);
      const after = text.slice(idx + matched.length);
      const span = createTermSpan(term, matched);
      const parent = node.parentNode;

      // Insert in order: before, span, after
      if (before) parent.insertBefore(document.createTextNode(before), node);
      parent.insertBefore(span, node);
      if (after) {
        const afterNode = document.createTextNode(after);
        parent.insertBefore(afterNode, node);
      }
      parent.removeChild(node);

      lowerSet.add(keyLower);
      annotatedCount++;
      found = true;
      break; // next term
    }
    if (!found) continue;
  }

  if (annotatedCount === 0 && !article.textContent.trim()) return;

  // --- Popover ---
  const pop = document.createElement("div");
  pop.id = "vt-term-popover";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-hidden", "true");
  pop.hidden = true;
  document.body.appendChild(pop);

  let activeTerm = null;
  let hideTimer = null;
  let showTimer = null;

  function renderPopover(termKey) {
    const entry = GLOSSARY[termKey];
    if (!entry) return "";
    const link = entry.link
      ? `<a class="vt-pop-link" href="${entry.link}">Read guide →</a>`
      : "";
    return `
      <div class="vt-pop-head">${termKey} <span>— ${entry.fullForm}</span></div>
      <p class="vt-pop-short">${entry.short}</p>
      <div class="vt-pop-actions">
        <button class="vt-pop-ask" type="button" data-ask="${termKey}">Ask VelsChat →</button>
        ${link}
      </div>
    `;
  }

  function positionPopover(anchor) {
    const rect = anchor.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    // Temporarily make visible to measure if hidden
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX + (rect.width / 2) - (popRect.width / 2);

    // Clamp to viewport
    const margin = 12;
    const vw = document.documentElement.clientWidth;
    if (left < margin) left = margin;
    if (left + popRect.width > vw - margin) left = vw - margin - popRect.width;

    // If near bottom, flip above
    const vh = window.innerHeight;
    if (rect.bottom + popRect.height + 16 > vh) {
      top = rect.top + window.scrollY - popRect.height - 10;
      pop.style.setProperty("--vt-arrow-x", (rect.left + rect.width / 2 - left) + "px");
      pop.dataset.flip = "top";
    } else {
      pop.dataset.flip = "bottom";
      pop.style.setProperty("--vt-arrow-x", (rect.left + rect.width / 2 - left) + "px");
    }

    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function showPopover(termEl) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    const key = termEl.getAttribute("data-term");
    if (!key || !GLOSSARY[key]) return;
    activeTerm = termEl;
    pop.innerHTML = renderPopover(key);
    pop.hidden = false;
    pop.setAttribute("aria-hidden", "false");
    // Need layout before positioning
    requestAnimationFrame(() => {
      positionPopover(termEl);
      requestAnimationFrame(() => pop.classList.add("vt-open"));
    });

    // Bind ask button
    const btn = pop.querySelector("[data-ask]");
    if (btn) {
      btn.addEventListener("click", onAskClick);
    }
  }

  function hidePopoverSoon(delay) {
    clearTimeout(showTimer);
    hideTimer = setTimeout(() => {
      pop.classList.remove("vt-open");
      setTimeout(() => {
        if (!pop.classList.contains("vt-open")) {
          pop.hidden = true;
          pop.setAttribute("aria-hidden", "true");
          activeTerm = null;
        }
      }, 180);
    }, delay || 120);
  }

  function onAskClick(e) {
    const key = e.currentTarget.getAttribute("data-ask") || activeTerm?.getAttribute("data-term");
    if (!key) return;
    const entry = GLOSSARY[key];
    const title = getArticleTitle();
    // Get surrounding paragraph for context
    let ctx = "";
    if (activeTerm) {
      const para = activeTerm.closest("p, li, blockquote");
      if (para) ctx = para.innerText.slice(0, 600);
    }
    const prompt = entry
      ? `Explain "${key}" — full form "${entry.fullForm}" — in the context of this article "${title}". Start your answer exactly with "${key} — ${entry.fullForm}:" on line 1, then ${entry.short}. ${ctx ? "Surrounding text: " + ctx : ""} Keep 2-3 sentences, plain language, and say when it matters.`
      : `What does "${key}" mean (include full form if it's an acronym) in the context of this article "${title}"? Start with "TERM — Full Form:" if applicable.`;

    if (window.VelsChat && typeof window.VelsChat.ask === "function") {
      window.VelsChat.ask(prompt, { forcePage: true });
    } else {
      // Fallback: dispatch event chat.js listens for, or try to open panel and fill input
      const input = document.getElementById("vt-chat-input");
      const bubble = document.getElementById("vt-chat-bubble");
      const panel = document.getElementById("vt-chat-panel");
      if (panel && panel.hidden && bubble) bubble.click();
      if (input) {
        input.value = prompt;
        input.focus();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    hidePopoverSoon(0);
    // analytics
    try {
      if (window.gtag) gtag("event", "glossary_ask", { term: key });
      if (window.plausible) plausible("glossary_ask", { props: { term: key } });
    } catch {}
  }

  // Delegated listeners on terms
  article.addEventListener("mouseenter", (e) => {
    const t = e.target.closest(".vt-term");
    if (!t) return;
    showPopover(t);
  }, true);

  article.addEventListener("mouseleave", (e) => {
    const t = e.target.closest(".vt-term");
    if (!t) return;
    hidePopoverSoon(220);
  }, true);

  article.addEventListener("focusin", (e) => {
    const t = e.target.closest(".vt-term");
    if (t) showPopover(t);
  });

  article.addEventListener("focusout", (e) => {
    const t = e.target.closest(".vt-term");
    if (t) hidePopoverSoon(150);
  });

  article.addEventListener("click", (e) => {
    const t = e.target.closest(".vt-term");
    if (!t) return;
    e.preventDefault();
    if (activeTerm === t && !pop.hidden && pop.classList.contains("vt-open")) {
      hidePopoverSoon(0);
    } else {
      showPopover(t);
    }
  });

  article.addEventListener("keydown", (e) => {
    const t = e.target.closest(".vt-term");
    if (!t) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showPopover(t);
    }
    if (e.key === "Escape") hidePopoverSoon(0);
  });

  // Keep popover alive when hovering it
  pop.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  pop.addEventListener("mouseleave", () => hidePopoverSoon(180));

  // Dismiss on scroll/resize/click outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".vt-term") && !e.target.closest("#vt-term-popover")) {
      hidePopoverSoon(0);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hidePopoverSoon(0);
  });
  window.addEventListener("scroll", () => hidePopoverSoon(0), { passive: true });
  window.addEventListener("resize", () => {
    if (activeTerm && !pop.hidden) positionPopover(activeTerm);
  });

  // --- Selection chip ---
  const chip = document.createElement("button");
  chip.id = "vt-select-chip";
  chip.type = "button";
  chip.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 4V5z"/><circle cx="9" cy="12" r="1"/><circle cx="13" cy="12" r="1"/><circle cx="17" cy="12" r="1"/></svg> <span>Ask VelsChat</span>`;
  chip.hidden = true;
  document.body.appendChild(chip);

  let selTimer = null;
  let lastSelectionText = "";

  function hideChip() {
    chip.classList.remove("vt-open");
    setTimeout(() => { chip.hidden = true; }, 160);
  }

  function showChip(text, rect) {
    lastSelectionText = text;
    chip.querySelector("span").textContent = `Ask about “${text.slice(0, 28)}${text.length > 28 ? "…" : ""}”`;
    chip.hidden = false;
    // position above selection
    requestAnimationFrame(() => {
      const cr = chip.getBoundingClientRect();
      let top = rect.top + window.scrollY - cr.height - 10;
      let left = rect.left + window.scrollX + (rect.width / 2) - (cr.width / 2);
      const margin = 8;
      const vw = document.documentElement.clientWidth;
      if (left < margin) left = margin;
      if (left + cr.width > vw - margin) left = vw - margin - cr.width;
      if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 10;
      chip.style.left = left + "px";
      chip.style.top = top + "px";
      requestAnimationFrame(() => chip.classList.add("vt-open"));
    });
  }

  function handleSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { hideChip(); return; }
    const text = sel.toString().trim();
    if (text.length < 2 || text.length > 80) { hideChip(); return; }
    // must be inside article
    const anchor = sel.anchorNode ? sel.anchorNode.parentElement : null;
    const focus = sel.focusNode ? sel.focusNode.parentElement : null;
    if (!anchor || !focus) { hideChip(); return; }
    if (!anchor.closest(SELECTOR) || !focus.closest(SELECTOR)) { hideChip(); return; }
    // ignore if selection contains our own term popover
    if (text.includes("Ask VelsChat")) { hideChip(); return; }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) { hideChip(); return; }
    showChip(text, rect);
  }

  document.addEventListener("mouseup", () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(handleSelection, 220);
  });
  document.addEventListener("touchend", () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(handleSelection, 320);
  });
  document.addEventListener("selectionchange", () => {
    // debounce slightly – hide if collapsed
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) hideChip();
  });
  document.addEventListener("mousedown", (e) => {
    if (!e.target.closest("#vt-select-chip")) hideChip();
  });
  window.addEventListener("scroll", hideChip, { passive: true });

  chip.addEventListener("click", () => {
    const text = lastSelectionText;
    if (!text) return;
    const title = getArticleTitle();
    // surrounding paragraph for extra context
    const sel = window.getSelection();
    let ctx = "";
    try {
      if (sel && sel.anchorNode) {
        const para = sel.anchorNode.parentElement?.closest("p, li, blockquote");
        if (para) ctx = para.innerText.slice(0, 600);
      }
    } catch {}
    // If selection matches a glossary term, inject its fullForm/short so LLM includes it even for freeform selection
    const norm = text.trim().toLowerCase();
    let gloss = null;
    for (const k of Object.keys(GLOSSARY)) {
      if (k.toLowerCase() === norm) { gloss = { key: k, entry: GLOSSARY[k] }; break; }
    }
    let prompt;
    if (gloss) {
      prompt = `Explain "${gloss.key}" — full form "${gloss.entry.fullForm}" — in the context of this article "${title}". Start exactly with "${gloss.key} — ${gloss.entry.fullForm}:" then ${gloss.entry.short}. ${ctx ? "Context: " + ctx : ""}`;
    } else {
      prompt = `Explain "${text}" as used in this article "${title}" (if it's an acronym, include its full form on line 1 as "TERM — Full Form:"). ${ctx ? "Context: " + ctx : ""} Keep 2-3 sentences, plain language.`;
    }
    if (window.VelsChat && typeof window.VelsChat.ask === "function") {
      window.VelsChat.ask(prompt, { forcePage: true });
    } else {
      const input = document.getElementById("vt-chat-input");
      const bubble = document.getElementById("vt-chat-bubble");
      const panel = document.getElementById("vt-chat-panel");
      if (panel && panel.hidden && bubble) bubble.click();
      if (input) {
        input.value = prompt;
        input.focus();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    hideChip();
    try { window.getSelection().removeAllRanges(); } catch {}
    try {
      if (window.gtag) gtag("event", "selection_ask", { text });
    } catch {}
  });

  // Expose for debugging
  window.VelsDefine = {
    terms: () => Array.from(lowerSet),
    count: () => annotatedCount
  };
  } // end initDefine

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDefine);
  } else {
    initDefine();
  }
})();
