/**
 * VelsTech Glossary – single source for inline definitions.
 * Global auto-wrap uses this. Keep keys as they appear in prose (case-insensitive match).
 * `short` is shown in tooltip (1 line). `fullForm` shown as subtitle. `link` optional deep-dive.
 */
const GLOSSARY = {
  "LLM": {
    fullForm: "Large Language Model",
    short: "AI model trained to predict the next token – powers ChatGPT, Claude, etc.",
    link: "what-is-an-llm.html"
  },
  "GPU": {
    fullForm: "Graphics Processing Unit",
    short: "Parallel processor for graphics and AI. More cores = faster model inference.",
    link: "cpu-vs-gpu.html"
  },
  "CPU": {
    fullForm: "Central Processing Unit",
    short: "General-purpose processor – handles system tasks, fewer but faster cores than GPU.",
    link: "cpu-vs-gpu.html"
  },
  "VRAM": {
    fullForm: "Video RAM",
    short: "Dedicated memory on your GPU. Determines which LLM sizes fit on the card.",
    link: "how-much-vram-for-llm.html"
  },
  "RAM": {
    fullForm: "Random Access Memory",
    short: "System memory. Unified memory on Macs is shared between CPU and GPU.",
    link: "first-pc-build.html"
  },
  "NPU": {
    fullForm: "Neural Processing Unit",
    short: "Dedicated AI chip for efficient on-device inference.",
    link: "xiaomi-ai-cube.html"
  },
  "SSD": {
    fullForm: "Solid State Drive",
    short: "Fast flash storage – makes any PC feel new vs a hard drive.",
    link: "ssd-vs-hdd.html"
  },
  "HDD": {
    fullForm: "Hard Disk Drive",
    short: "Spinning-disk storage – cheaper per TB, much slower than SSD.",
    link: "ssd-vs-hdd.html"
  },
  "ROCm": {
    fullForm: "Radeon Open Compute",
    short: "AMD's GPU compute stack for local AI on Radeon cards.",
    link: "rocm-vulkan-amd-guide.html"
  },
  "Vulkan": {
    fullForm: "Vulkan API",
    short: "Cross-platform GPU API. Works on more AMD cards than ROCm, often simpler.",
    link: "rocm-vulkan-amd-guide.html"
  },
  "CUDA": {
    fullForm: "Compute Unified Device Architecture",
    short: "NVIDIA's GPU compute platform – smoothest setup for llama.cpp/Ollama.",
    link: "best-gpu-for-local-llm.html"
  },
  "GGUF": {
    fullForm: "GGML Universal File",
    short: "Single-file container for quantized LLMs (successor to GGML) used by llama.cpp and Ollama – packs weights, tokenizer, and metadata so models run on consumer hardware.",
    link: "gguf-explained.html"
  },
  "Quantization": {
    fullForm: "Quantization",
    short: "Shrinking model weights from 16-bit to 4-bit (Q4) so it fits on consumer hardware.",
    link: "quantization-deep-dive.html"
  },
  "Q4": {
    fullForm: "4-bit Quantization (Q4_K_M)",
    short: "Best size/quality trade-off for most users. Try Q5 if you have headroom.",
    link: "quantization-deep-dive.html"
  },
  "Q5": {
    fullForm: "5-bit Quantization (Q5_K_M)",
    short: "Sharper than Q4, needs more RAM/VRAM.",
    link: "quantization-deep-dive.html"
  },
  "Q8": {
    fullForm: "8-bit Quantization",
    short: "Near-lossless quality, much larger file.",
    link: "quantization-deep-dive.html"
  },
  "KV cache": {
    fullForm: "Key-Value Cache",
    short: "Memory that grows with context length – reason long prompts eat VRAM.",
    link: "kv-cache-explained.html"
  },
  "Context window": {
    fullForm: "Context Window",
    short: "Maximum tokens the model can see at once (prompt + reply).",
    link: "kv-cache-explained.html"
  },
  "Tokens": {
    fullForm: "Tokens",
    short: "Chunks of text (~3-4 chars) the model reads and predicts one at a time.",
    link: "what-is-an-llm.html"
  },
  "Token": {
    fullForm: "Token",
    short: "Chunk of text the model predicts. A word is usually 1-2 tokens.",
    link: "what-is-an-llm.html"
  },
  "Temperature": {
    fullForm: "Temperature",
    short: "Creativity dial: low=deterministic, high=random/creative.",
    link: "what-is-an-llm.html"
  },
  "Hallucination": {
    fullForm: "Hallucination",
    short: "Confident but wrong output – model predicting plausible text, not checking facts.",
    link: "what-is-an-llm.html"
  },
  "RAG": {
    fullForm: "Retrieval-Augmented Generation",
    short: "Answer questions using your own documents – retrieve chunks, then generate.",
    link: "rag-from-scratch.html"
  },
  "MoE": {
    fullForm: "Mixture of Experts",
    short: "Only a few expert sub-networks run per token – large total size, small active cost.",
    link: "moe-vs-dense-rx6800m-16k-vs-262k.html"
  },
  "Embeddings": {
    fullForm: "Embeddings",
    short: "Vectors that capture meaning so similar texts are nearby for search/RAG.",
    link: "rag-from-scratch.html"
  },
  "Flash Attention": {
    fullForm: "Flash Attention",
    short: "Faster, memory-efficient attention – enabled automatically on supported GPUs.",
    link: "flash-attention-guide.html"
  },
  "Speculative decoding": {
    fullForm: "Speculative Decoding",
    short: "Draft model guesses, big model verifies – same output, faster.",
    link: "flash-attention-guide.html"
  },
  "Ollama": {
    fullForm: "Ollama",
    short: "One-command local LLM runner – wraps llama.cpp, handles GPU detection.",
    link: "how-to-get-started-local-ai.html"
  },
  "llama.cpp": {
    fullForm: "llama.cpp",
    short: "C++ engine that runs GGUF models with GPU acceleration.",
    link: "llama-cpp-guide.html"
  },
  "PSU": {
    fullForm: "Power Supply Unit",
    short: "Powers all components – wattage and quality matter for stability.",
    link: "psu-calculator.html"
  },
  "DNS": {
    fullForm: "Domain Name System",
    short: "Translates velstech.net → IP address so browsers can connect.",
    link: "how-internet-works.html"
  },
  "IP": {
    fullForm: "Internet Protocol",
    short: "Address of a device on the internet.",
    link: "how-internet-works.html"
  },
  "API": {
    fullForm: "Application Programming Interface",
    short: "How apps talk to each other (e.g., your site ↔ AI provider).",
    link: "ai-api-cost-calculator.html"
  },
  "Open Source": {
    fullForm: "Open Source",
    short: "Code anyone can view, run, and modify locally.",
    link: "learn-to-code.html"
  },
  "Self-hosting": {
    fullForm: "Self-hosting",
    short: "Running services on your own hardware instead of the cloud.",
    link: "self-hosting-101.html"
  },
  "VPN": {
    fullForm: "Virtual Private Network",
    short: "Encrypted tunnel for private browsing.",
    link: "security-habits.html"
  },
  "2FA": {
    fullForm: "Two-Factor Authentication",
    short: "Second login step (authenticator app/security key) – best single habit.",
    link: "security-habits.html"
  },
  "Phishing": {
    fullForm: "Phishing",
    short: "Fake message pretending to be legit to steal credentials.",
    link: "spotting-phishing.html"
  },
  "Git": {
    fullForm: "Git",
    short: "Version control – tracks changes, lets you undo and collaborate.",
    link: "git-beginners.html"
  }
};

if (typeof module !== "undefined" && module.exports) module.exports = GLOSSARY;
if (typeof window !== "undefined") window.GLOSSARY = GLOSSARY;
