# VelsTech Weekly – Issue #2

**Date:** Sep 4, 2026 · **Read time:** ~4 min

> How to reuse this file: copy `newsletter/issue-002.md` to `newsletter/issue-003.md`,
> update the number/date, refresh the five picks, and paste into your newsletter provider.
> Placeholders to fill every week: `[DEAL LINK]`, `[SPONSOR SLOT – optional]`, and the
> weekly intro. Also update the "Read Issue #N" link on the homepage (all 3 languages).

---

**Hey, here's VelsTech Weekly #2.** *(edit me each week)*

This week I pointed an AI code reviewer at my own website. It was humbling – I found a
localisation bug on 100 pages, a security hole on my AI API, and a layout-shift gremlin.
All fixed, all written up below, plus the usual: real benchmarks and the stuff worth
clicking. If something's wrong or missing, just reply and tell me.

---

## 🤖 AI

**1. Speculative decoding (MTP) on a 35B MoE – real numbers on 12 GB VRAM**
Tiel-Coder-35B with Multi-Token Prediction vs without, on the RX 6800M at 262K context:
29.09 tok/s with MTP vs 25.39 without. MTP wins, but only with the right expert count –
here's what broke and why.
→ https://velstech.net/tiel-coder-35b-mtp-rx6800m.html

**2. Qwen 27B Ridge: ROCm vs Vulkan on AMD, at 16K and 262K context**
A dense 27B model partially offloaded to system RAM: Vulkan won decode (+20%), ROCm won
the huge-context MoE runs (+30%). The rule: benchmark both backends on your card, don't
trust anyone's table – including mine.
→ https://velstech.net/qwen-27b-ridge-rocm-vs-vulkan.html

## 🖥️ Hardware

**3. The benchmark database now covers 13 GPU × model combos**
Every result is labelled 🧪 Tested (on my hardware) or 📐 Estimated (from the calculator).
Filter by GPU, model, quant, and backend – and see exactly which numbers are real.
→ https://velstech.net/benchmarks/

## 🐧 Linux & Dev

**4. I audited my own site with an AI – three bugs worth knowing about**
An hreflang setup that silently ignored 100 pages of translations, an AI proxy that
anyone on the internet could use as a free SSRF tunnel, and a "Poor" CLS score caused by
JavaScript injecting the nav bar after first paint. The fixes (and the traps) are generic
– if you run a static site, check yours this week.
→ https://velstech.net/start-here.html

**5. Terminal tip: `node --test` is enough**
This site ships with 97 tests and zero npm dependencies – Node's built-in test runner
covers unit tests, and a headless-Chrome guard catches UI regressions. You don't need a
test framework to have tests.
→ https://velstech.net/linux-cheat-sheet.html

## 🛠️ Tools

**6. 10 more articles now have visible FAQ sections**
The questions people actually search ("Is Linux good enough for gaming?", "Are password
managers safe?") – answered at the bottom of each guide. Newest on the first PC build,
Windows vs Linux, and SSD vs HDD guides.
→ https://velstech.net/tutorials.html

## 🔥 Deal of the week

**[Pick one deal – e.g. a GPU, NVMe SSD, or VPS offer.]**
One sentence on why it's a good deal and for whom.
→ [DEAL LINK – add Amazon affiliate link here, e.g. https://www.amazon.in/s?k=NVMe+SSD+1TB&tag=velstechoffl-21]

---

*Some links in this newsletter are affiliate links – if you buy through them, VelsTech may
earn a small commission at no extra cost to you. Full disclosure: https://velstech.net/disclosure.html*

---

**VelsTech – Practical AI, Linux & Hardware.** · [Home](https://velstech.net/) · [Subscribe](https://velstech.net/#newsletter) · [Unsubscribe](mailto:hello@velstech.net?subject=unsubscribe)

*You're receiving this because you subscribed at velstech.net. We don't track or share your
email.*
