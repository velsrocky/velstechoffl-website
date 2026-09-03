const ARTICLES = [
  {
    title: "Tiel-Coder 35B-A3B on RX 6800M: MTP vs non-MTP at 262K – VelsTech Lab",
    url: "tiel-coder-35b-mtp-rx6800m.html",
    date: "2026-09-01",
    updated: "2026-09-01",
    category: "AI",
    featured: true,
    tags: ["VelsTech Lab", "MoE", "MTP", "RX 6800M", "Speculative Decoding", "Benchmark"],
    description: "Tested Tiel-Coder-35B-A3B Q4_K_XL on RX 6800M – MTP speculative decoding at 29.09 tok/s vs 25.39 tok/s without MTP, at 262K q8 KV, 28-32 CPU experts, ROCm 10.0.",
  },
  {
    title: "ROCm & Vulkan on AMD: running local AI on Radeon",
    url: "rocm-vulkan-amd-guide.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["ROCm", "Vulkan", "AMD", "Local AI"],
    description: "ROCm vs Vulkan on AMD GPUs for local AI – what each backend is, which to choose, how to install, and real benchmark results on the RX 6800M.",
    faq: [
      {
        q: "Which is faster, ROCm or Vulkan on AMD?",
        a: "It depends on the workload. In our RX 6800M tests, Vulkan won decode on a dense 27B model (+20%), while ROCm won on a huge-context MoE (+30%). Try both and benchmark on your own card.",
      },
      {
        q: "Does my AMD GPU support ROCm?",
        a: "ROCm officially supports a specific list of cards. If yours isn't on it, Vulkan is almost always the working option – it's the simpler, broader-compatibility backend.",
      },
    ],
  },
  {
    title: "Running LLMs on Apple Silicon: a practical guide",
    url: "apple-silicon-llm-guide.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["Apple Silicon", "Metal", "Local AI"],
    description: "How M1/M2/M3/M4 Macs run local AI, what unified memory means, which models fit your Mac, and how to get started with Metal.",
    faq: [
      {
        q: "Can a Mac run LLMs?",
        a: "Yes – and often better than a PC at the same price, because unified memory means the entire system RAM is available for the model. A 16 GB Mac is a solid local-AI daily driver.",
      },
      {
        q: "How much RAM do I need for local AI on a Mac?",
        a: "Roughly: 16 GB runs 7B–9B models at Q4, 24 GB runs 13B–14B, 32 GB runs 27B–30B, and 64 GB runs 70B. Buy the RAM you'll want in a few years – it's soldered.",
      },
    ],
  },
  {
    title: "RAG from scratch: ask questions about your own documents",
    url: "rag-from-scratch.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["RAG", "Embeddings", "Local AI"],
    description: "What RAG is, how it works, and a working local example – build a private question-answering system over your own files with an LLM and embeddings.",
    faq: [
      {
        q: "What is RAG?",
        a: "RAG (Retrieval-Augmented Generation) lets an LLM answer questions using your own documents. It retrieves the few relevant chunks for a question, then has the model answer using only that context – no retraining needed.",
      },
      {
        q: "Can RAG run entirely locally?",
        a: "Yes. With a local LLM and a small embedding model (both via Ollama), the whole load-embed-retrieve-generate pipeline runs offline and private.",
      },
    ],
  },
  {
    title: "Quantization deep dive: how Q4, Q5, and Q8 change quality and speed",
    url: "quantization-deep-dive.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["Quantization", "GGUF", "Local AI"],
    description: "How quantization levels (Q4, Q5, Q8) affect LLM quality, size, and speed – with real numbers and practical advice for local AI.",
    faq: [
      {
        q: "Is Q4 much worse than Q8?",
        a: "For most tasks – chat, summarization, code generation – the difference between Q4_K_M and Q8 is imperceptible. The gap only shows in hard reasoning, math, or factual recall where a single wrong token cascades.",
      },
      {
        q: "Which quantization should I use?",
        a: "Q4_K_M is the default for everyone. Step up to Q5_K_M if you have headroom and want the best quality. Drop to Q3 only if the model won't fit at Q4.",
      },
    ],
  },
  {
    title: "KV cache explained: why context windows eat memory",
    url: "kv-cache-explained.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["KV Cache", "VRAM", "Local AI"],
    description: "Why longer context windows eat memory, how the key-value cache grows with tokens, and how to calculate it for your own GPU.",
    faq: [
      {
        q: "Does the KV cache affect speed?",
        a: "Yes – a larger KV cache means more data to read per token, which slows decode. Quantizing the KV cache (q8, q4) helps both memory and speed.",
      },
      {
        q: "How much memory does the KV cache use?",
        a: "It depends on the model architecture and context. For a 7B model at 8K context, roughly 1 GB. At 32K, about 4 GB. At 128K, it can be 12 GB or more.",
      },
    ],
  },
  {
    title: "Flash Attention & speculative decoding: making LLMs faster",
    url: "flash-attention-guide.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["Flash Attention", "Speculative Decoding", "Local AI"],
    description: "How Flash Attention and speculative decoding make LLMs faster and use less memory – and why they matter for running models locally.",
    faq: [
      {
        q: "Do I need to configure Flash Attention?",
        a: "No – it's enabled automatically by llama.cpp, Ollama, and LM Studio on supported GPUs. You just benefit silently.",
      },
      {
        q: "Does speculative decoding change the output?",
        a: "No. The big model verifies the draft's guesses, so the final output is identical to running the big model alone – just faster.",
      },
    ],
  },
  {
    title: "GGUF explained: the format that makes local LLMs work",
    url: "gguf-explained.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["GGUF", "Quantization", "Local AI"],
    description: "GGUF is the file format that makes running LLMs locally possible. Here's what it is, what quantization levels mean, and how to pick the right one for your hardware.",
    faq: [
      {
        q: "What is a GGUF file?",
        a: "GGUF is a container format for quantized LLMs – it packs a model's weights, tokenizer, and metadata into one file that llama.cpp, Ollama, and LM Studio can load directly. The quantization is what shrinks a model enough to run on consumer hardware.",
      },
      {
        q: "Which GGUF quantization should I download?",
        a: "Q4_K_M is the safe default – the best quality-per-gigabyte. If you have spare RAM, try Q5_K_M for noticeably sharper output. Drop to Q3 or Q2 only if the model doesn't fit.",
      },
    ],
  },
  {
    title: "llama.cpp guide: run GGUF models locally",
    url: "llama-cpp-guide.html",
    date: "2026-08-30",
    updated: "2026-08-30",
    category: "AI",
    tags: ["llama.cpp", "GGUF", "Local AI"],
    description: "Complete guide to llama.cpp – install it, run GGUF models, enable GPU acceleration, and read the benchmark output. The engine behind Ollama, explained.",
    faq: [
      {
        q: "Do I need llama.cpp if I use Ollama?",
        a: "No – Ollama wraps llama.cpp and handles installation, downloads, and GPU detection for you. Learning llama.cpp is useful for benchmarking and fine-tuning, but not required to run local AI.",
      },
      {
        q: "How do I speed up llama.cpp?",
        a: "Offload more layers to your GPU with -ngl 999 if VRAM allows, make sure you built with the right backend (CUDA/ROCm/Vulkan), and use the highest quantization that still fits in memory.",
      },
    ],
  },
  {
    title: "How to get started with local AI (2026)",
    url: "how-to-get-started-local-ai.html",
    date: "2026-08-29",
    updated: "2026-08-29",
    category: "AI",
    featured: true,
    tags: ["Local AI", "Ollama", "Getting Started", "Beginner"],
    description: "How to get started with local AI in 2026 – pick the right hardware, install Ollama, download a model, and run it on your own machine. No cloud, no subscription, no jargon.",
    faq: [
      {
        q: "Can I run local AI on a laptop without a GPU?",
        a: "Yes. A modern laptop with 16 GB of RAM can run a 7B model at conversational speed via CPU-only inference. It won't be as fast as a GPU, but it's perfectly usable for chat, summarization, and coding assistance.",
      },
      {
        q: "Is local AI as good as ChatGPT?",
        a: "For many everyday tasks, yes. A 7B or 13B model running locally handles chat, summarization, and code generation well. The biggest models (70B+) are closer to frontier models but need more hardware.",
      },
      {
        q: "Do I need an internet connection to use local AI?",
        a: "No. Once the model is downloaded, everything runs entirely on your device. No internet needed, no data sent anywhere, no subscription.",
      },
    ],
  },
  {
    title: "DGX Spark vs RTX Spark vs Ryzen AI Halo: the 2026 local-AI desktop showdown",
    url: "dgx-spark-rtx-spark-ryzen-ai-halo.html",
    date: "2026-08-29",
    updated: "2026-08-29",
    category: "Hardware",
    featured: true,
    tags: ["AI Hardware", "GPU", "Local AI", "NVIDIA", "AMD"],
    description: "NVIDIA DGX Spark, NVIDIA RTX Spark, and AMD Ryzen AI Max (Strix Halo) – three ways to run local AI in 2026. Specs, what each is for, and which one you should buy.",
    faq: [
      {
        q: "Can these run AI models without an internet connection?",
        a: "Yes. That's the whole point of unified memory and on-device compute – models run locally with no cloud dependency and your data never leaves the machine.",
      },
      {
        q: "How much VRAM do they have?",
        a: "None in the traditional sense. All three use unified memory (up to 128 GB) shared between CPU and GPU, so the full memory is available for the model – far more than any consumer GPU's dedicated VRAM.",
      },
      {
        q: "Which is the best value for local AI?",
        a: "For price per gigabyte of unified memory, AMD's Ryzen AI Max (Strix Halo) mini PCs win at roughly ₹70k–1.1 lakh. NVIDIA's RTX Spark offers the best blend of performance, Windows compatibility, and gaming. DGX Spark is the most powerful but the most expensive.",
      },
    ],
  },
  {
    title: "Best GPU for running LLMs locally (2026)",
    url: "best-gpu-for-local-llm.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "Hardware",
    featured: true,
    tags: ["GPU", "LLM", "Local AI", "Benchmarks", "VelsTech Lab"],
    description: "The best GPUs for running LLMs locally in 2026 – RTX vs Radeon, how much VRAM you really need, and what actually matters for llama.cpp and Ollama.",
    faq: [
      {
        q: "How much VRAM do I need to run an LLM locally?",
        a: "For a 7B model at 4-bit quantization you want 8 GB; for 13–14B models 12–16 GB; and for 32B models 24 GB or more if you want to fit weights plus the KV cache in memory.",
      },
      {
        q: "NVIDIA or AMD GPU for local LLMs?",
        a: "NVIDIA (CUDA) has the smoothest setup with llama.cpp and Ollama. AMD (ROCm/Vulkan) works well too and often gives more VRAM per rupee, but needs slightly more tinkering.",
      },
      {
        q: "Is CPU-only inference worth it?",
        a: "For occasional use, yes – modern CPUs can run 7B models at a few tokens per second. For daily use, a GPU with 12 GB+ of VRAM is a much better experience.",
      },
    ],
  },
  {
    title: "How much VRAM do you need for 7B, 14B, and 32B models?",
    url: "how-much-vram-for-llm.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "AI",
    tags: ["VRAM", "LLM", "GPU", "Quantization", "VelsTech Lab"],
    description: "VRAM needed for 7B, 14B, and 32B LLMs – weights, quantization, KV cache, and context length, with a quick-reference table.",
    faq: [
      {
        q: "What does quantization mean for VRAM?",
        a: "Quantization lowers the precision of the model's weights (e.g. from 16-bit to 4-bit), which shrinks the memory footprint. A 7B model at 4-bit takes roughly half the VRAM it does at 16-bit.",
      },
      {
        q: "Does a longer context window need more VRAM?",
        a: "Yes. The KV cache grows with context length, so a 32K context can add several GB of VRAM on top of the weights. Use a tool like the LLM VRAM calculator to check your exact setup.",
      },
    ],
  },
  {
    title: "Best GPU for AI under ₹50,000 (India, 2026)",
    url: "best-gpu-ai-under-50000.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "Hardware",
    tags: ["GPU", "Budget", "India", "Local AI", "VelsTech Lab"],
    description: "The best GPUs for AI under ₹50,000 in India – which cards actually fit the budget and can run local LLMs, with VRAM per rupee compared.",
    faq: [
      {
        q: "Can I run a local LLM on a GPU under ₹50,000?",
        a: "Yes. A 12 GB card in that budget (like a used Radeon RX 6800 XT or an RTX 3060 12GB) can run 7B–13B models comfortably at 4-bit quantization, and lighter 32B models with CPU offload.",
      },
      {
        q: "Should I buy new or used for the best VRAM per rupee?",
        a: "Used Radeon cards often win on raw VRAM per rupee, but check warranty and mining history. For the smoothest setup with the least tinkering, an NVIDIA card is usually easier to get working.",
      },
    ],
  },
  {
    title: "Xiaomi AI Cube: the mini desktop built for local AI",
    url: "xiaomi-ai-cube.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "Hardware",
    featured: true,
    tags: ["AI Hardware", "NPU", "Mini PC", "VelsTech Lab"],
    description: "Xiaomi's AI Cube is a small desktop with a big NPU – made to run LLMs locally. Here's what it is, what's inside, and whether it's worth buying.",
    faq: [
      {
        q: "What is an NPU and why does it matter?",
        a: "An NPU is a dedicated chip for AI workloads like running LLMs. It does what a GPU can but far more efficiently for inference, which is why the AI Cube can run models locally in a small, quiet, low-power desktop.",
      },
      {
        q: "Can I run AI on it without an internet connection?",
        a: "Yes – that's the point. Because the model runs on the device's NPU, you get private, offline AI with no data leaving your machine.",
      },
    ],
  },
  {
    title: "Qwen3.8 Flash Next: Alibaba's new fast reasoning model",
    url: "qwen3-8-flash-next.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "AI",
    tags: ["LLM", "Qwen", "Reasoning"],
    description: "Qwen3.8 Flash Next is Alibaba's newest reasoning model – faster, cheaper, and smarter. Here's what changed, how it performs, and how it compares.",
  },
  {
    title: "GLM 5.3: what's new in Zhipu AI's latest model",
    url: "glm-5-3.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "AI",
    tags: ["LLM", "GLM", "Benchmarks"],
    description: "GLM 5.3 is Zhipu AI's newest update – stronger reasoning, better coding, and competitive pricing. Here's what's new and who it's for.",
  },
  {
    title: "Omarchy: the beautiful, opinionated Linux distro everyone's talking about",
    url: "omarchy.html",
    date: "2026-08-26",
    updated: "2026-08-26",
    category: "Operating Systems",
    featured: true,
    tags: ["Linux", "Arch", "Distro"],
    description: "The Arch-based distro made by DHH of Basecamp – beautiful, opinionated, terminal-first. Here's what it is, why it's trending, and whether you should try it.",
  },
  {
    title: "What is machine learning, really?",
    url: "what-is-machine-learning.html",
    date: "2026-08-25",
    updated: "2026-09-04",
    category: "AI",
    tags: ["Basics", "ML"],
    description: "A plain-language look at what learning from data actually means – training, models, and prediction – without the jargon.",
    faq: [
      {
        q: "How is machine learning different from normal programming?",
        a: "In normal programming you write the rules and the computer follows them. Machine learning flips it: you show the computer thousands of labelled examples and it figures out the rules itself by hunting for patterns.",
      },
      {
        q: "What is an LLM in simple terms?",
        a: "A large language model is one kind of machine learning – a model with a lot of adjustable numbers that learned language patterns by repeatedly guessing, measuring the error, and adjusting across huge amounts of text.",
      },
      {
        q: "Why does machine learning get things wrong?",
        a: "A model is only as good as the examples it learned from. If the training data is narrow or biased – like a weather model trained only on desert data – the model's guesses fail outside what it has seen.",
      },    ],
  },
  {
    title: "What is a Large Language Model, really?",
    url: "what-is-an-llm.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "AI",
    tags: ["LLM", "Basics"],
    description: "A plain-language look at how LLMs work under the hood – tokens, context, and probabilities – without the jargon.",
    faq: [
      {
        q: "Is a large language model the same as artificial intelligence?",
        a: "No. An LLM is one kind of AI – a model trained to predict the next word. 'AI' is a much bigger umbrella that includes vision, robotics, and more.",
      },
      {
        q: "Do LLMs actually understand what they're saying?",
        a: "They don't reason the way a human does. They compute the most likely next token based on patterns in their training data, which often looks a lot like understanding.",
      },
    ],
  },
  {
    title: "How to write better prompts",
    url: "better-prompts.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "AI",
    tags: ["Prompting", "Tools"],
    description: "Practical prompting patterns that get better answers from ChatGPT, Claude, and similar tools.",
    faq: [
      {
        q: "Why is being specific in a prompt important?",
        a: "LLMs answer based on the words you give them. Clear, specific instructions narrow the answer space, so you get relevant output instead of a generic guess.",
      },
      {
        q: "What if the model ignores my instructions?",
        a: "Try breaking the request into steps, giving an example of the format you want, or asking it to work through the problem before answering.",
      },
    ],
  },
  {
    title: "Local vs cloud AI: which should you choose?",
    url: "local-vs-cloud-ai.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "AI",
    tags: ["Privacy", "Hardware"],
    description: "Privacy, cost, and capability – a comparison of running models on your own hardware versus cloud APIs.",
    faq: [
      {
        q: "Is running AI locally actually free?",
        a: "After the hardware, yes – you download a model once and chat with it offline forever, with no subscription or per-token fees. Cloud AI costs money every time you use it.",
      },
      {
        q: "Can I run something like ChatGPT on my own computer?",
        a: "You can run open models locally with tools like Ollama, LM Studio, and llama.cpp – typically 7B to 30B quality on capable hardware. The frontier models are too big to run at home, so cloud still wins on raw quality.",
      },
      {
        q: "Is local AI more private than ChatGPT?",
        a: "Yes – a local model never sends your prompts anywhere; everything stays on your machine. Cloud AI sends your prompts to a third party's servers, which is the main reason privacy-conscious users go local.",
      },
      {
        q: "Do I need a powerful PC for local AI?",
        a: "You need enough RAM/VRAM for the model size – a phone or old laptop handles small models (7B and under), while bigger models need a desktop GPU. If you don't want to think about hardware, cloud has zero setup.",
      },    ],
  },
  {
    title: "How to choose parts for your first PC build",
    url: "first-pc-build.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Hardware",
    tags: ["PC Build", "Guide"],
    description: "A beginner-friendly guide to picking a CPU, GPU, RAM, and storage that actually match how you'll use the PC.",
    faq: [
      {
        q: "What matters most in a first PC build?",
        a: "Your use case decides the budget split: gaming puts most money in the GPU, programming and general work want a balanced build with a good CPU, and editing needs strong CPU + GPU + lots of RAM. Decide what you'll actually do before buying anything.",
      },
      {
        q: "How much RAM do I need in a new PC?",
        a: "16 GB is the new minimum for gaming and general use; 32 GB is comfortable for editing, virtual machines, and heavy multitasking. More capacity beats more speed, and a matched two-stick kit runs in dual-channel mode – effectively faster memory.",
      },
      {
        q: "Should my first build use SSD or HDD?",
        a: "SSD first, always. An NVMe SSD for the operating system is the single biggest quality-of-life decision – starting with a spinning boot drive is the most common first-build regret. Add a cheap HDD later for bulk storage if you need it.",
      },
      {
        q: "Does the CPU have to match the motherboard?",
        a: "Yes – the CPU socket must match the board, and the board must support your RAM type (DDR4 or DDR5) and form factor (ATX, micro-ATX, mini-ITX). Pick the CPU first, then choose a board that fits it and your case.",
      },    ],
  },
  {
    title: "CPU vs GPU: what does each one do?",
    url: "cpu-vs-gpu.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Hardware",
    tags: ["Components", "Basics"],
    description: "Breaking down the two most important components in your machine and when each one matters most.",
    faq: [
      {
        q: "What is the difference between a CPU and a GPU?",
        a: "A CPU is a few fast, smart cores that handle complex sequential work – the operating system, apps, and anything with lots of branching logic. A GPU is thousands of simple cores doing the same operation on many things at once – pixels, matrix math, video frames.",
      },
      {
        q: "Do I need a GPU for AI?",
        a: "For serious work, yes – neural networks are matrix math repeated at massive scale, which is exactly what a GPU's thousands of parallel cores are built for. A CPU can run small models, but a GPU with enough VRAM is what makes local AI practical.",
      },
      {
        q: "Which should I spend more on, CPU or GPU?",
        a: "Whatever your workload is bottlenecked on: gaming and AI want the biggest GPU your budget allows, while programming and general use benefit more from a strong CPU. A fast CPU makes everything feel snappy; a GPU only helps the tasks that can use it.",
      },    ],
  },
  {
    title: "SSD vs HDD: the upgrade that changes everything",
    url: "ssd-vs-hdd.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Hardware",
    tags: ["Storage", "Upgrade"],
    description: "Why an SSD makes an old computer feel new again, and how to pick the right drive and size.",
    faq: [
      {
        q: "Is upgrading to an SSD worth it?",
        a: "It's the single biggest 'wow, my computer is new' upgrade: boot time drops from 30–60+ seconds to 10–15, apps open in about a second, and the drive is silent with no moving parts to wear out.",
      },
      {
        q: "Why are SSDs so much faster than HDDs?",
        a: "An HDD has to physically move an arm over a spinning platter for every read – milliseconds of seek time, thousands of times per session. An SSD reads flash chips electronically, so there's nothing to wait for.",
      },
      {
        q: "Should I use both an SSD and an HDD?",
        a: "A common combo is a 1 TB NVMe SSD for the OS, programs, and games plus a 2–4 TB HDD for bulk storage like backups and media. HDDs still win on cost per gigabyte for data you access rarely.",
      },    ],
  },
  {
    title: "Linux for beginners: getting started",
    url: "linux-beginners.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Operating Systems",
    tags: ["Linux", "Beginners"],
    description: "Picking a distro, installing it, and surviving your first week without breaking anything.",
    faq: [
      {
        q: "Which Linux distro should a beginner choose?",
        a: "Ubuntu or Linux Mint are the most beginner-friendly – huge communities, tons of tutorials, and software that installs easily. Start there before trying Arch-based distros.",
      },
      {
        q: "Do I need to know how to use the terminal to use Linux?",
        a: "No. Modern distros work fine with a graphical interface. The terminal is a power tool you can learn gradually – grab the free Linux command cheat sheet to speed that up.",
      },
    ],
  },
  {
    title: "Essential terminal commands everyone should know",
    url: "terminal-commands.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Operating Systems",
    tags: ["Terminal", "Basics"],
    description: "Navigation, files, permissions, and package management – the commands you'll use every single day.",
  },
  {
    title: "Windows vs Linux: when to use which",
    url: "windows-vs-linux.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Operating Systems",
    tags: ["Linux", "Windows"],
    description: "An honest comparison of the two for daily use, gaming, and development work.",
    faq: [
      {
        q: "Is Linux good enough for gaming now?",
        a: "Steam Deck and Proton closed much of the gap, but Windows is still the safest bet for gaming – most titles target it first and some anti-cheat software remains Windows-only.",
      },
      {
        q: "Can I use Windows and Linux together?",
        a: "Yes, three common ways: dual boot (pick at startup, one at a time), Linux with a Windows VM for occasional Windows apps, or WSL for a real Linux terminal inside Windows while you keep your Windows software.",
      },
      {
        q: "Is Linux really free?",
        a: "Yes – the OS, updates, and the app catalog cost nothing, forever. The trade-off is a learning curve: the terminal and package managers replace the settings menus you know from Windows.",
      },
      {
        q: "Which is more private, Windows or Linux?",
        a: "Linux is private by default – no forced telemetry, no ads in the OS, no account requirements. Windows collects data and pushes a Microsoft account; it's good on security with updates, but it's not quiet.",
      },    ],
  },
  {
    title: "How does the internet actually work?",
    url: "how-internet-works.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Networking",
    tags: ["Basics", "DNS"],
    description: "A straightforward walkthrough of IP addresses, DNS, and routing – the basics that make the internet tick.",
    faq: [
      {
        q: "What is the difference between an IP address and DNS?",
        a: "An IP address is the street address of a computer (like 185.199.108.153). DNS is the phone book that translates names like velstech.net into those addresses, so you never have to remember numbers.",
      },
      {
        q: "What actually happens when I type a website address?",
        a: "Your computer asks a DNS server for the site's IP. If it isn't cached, the query follows a chain – root servers, then the .net servers, then the domain's nameserver – which returns the IP in milliseconds, and it gets cached for next time.",
      },
      {
        q: "Why are there two versions of IP addresses?",
        a: "IPv4 has only about 4.3 billion addresses and we ran out, so devices share one public address through your home router (NAT). IPv6 has a vastly larger pool and is rolling out slowly.",
      },    ],
  },
  {
    title: "Setting up a domain and pointing it anywhere",
    url: "setup-domain.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Networking",
    tags: ["DNS", "Self-hosting"],
    description: "How to buy a domain, configure DNS records, and connect it to GitHub Pages, a VPS, or a home server.",
  },
  {
    title: "Self-hosting 101: what can you run at home?",
    url: "self-hosting-101.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Networking",
    tags: ["Self-hosting", "Projects"],
    description: "From a media server to a personal cloud – services you can run on a Raspberry Pi or old laptop.",
  },
  {
    title: "The only 5 security habits you really need",
    url: "security-habits.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Security & Privacy",
    tags: ["Basics", "Passwords"],
    description: "Passwords, two-factor authentication, updates, backups, and skepticism – the checklist that covers most risks.",
    faq: [
      {
        q: "What is the single most effective security habit?",
        a: "Use a password manager with unique passwords for every account, and turn on two-factor authentication everywhere it's available. That covers most real-world attacks.",
      },
      {
        q: "Is two-factor authentication really necessary?",
        a: "Yes. Even if a password leaks, a second factor like an authenticator app or security key stops most account takeovers cold.",
      },
    ],
  },
  {
    title: "Password managers: why you need one",
    url: "password-managers.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Security & Privacy",
    tags: ["Passwords", "Tools"],
    description: "How a password manager works, what to look for, and why reusing passwords is the biggest risk most people have.",
    faq: [
      {
        q: "Are password managers safe to use?",
        a: "Yes – the vault is encrypted with your master password on your device before anything reaches the cloud. Even if the company's servers are breached, an attacker sees only encrypted gibberish, because the decryption key exists only in your head.",
      },
      {
        q: "Which password manager should I use?",
        a: "Bitwarden and KeePassXC both have free plans and are open-source; 1Password is the polished paid option. Any of them beats the real alternatives people use: one password everywhere, predictable variations, or a notebook.",
      },
      {
        q: "Why is reusing one password so dangerous?",
        a: "One site breach compromises every account, because attackers try the leaked email/password pair everywhere. Variations like 'Facebook#1' and 'Gmail#1' are just as bad – the pattern is easy to guess once one password leaks.",
      },    ],
  },
  {
    title: "Spotting phishing attempts",
    url: "spotting-phishing.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Security & Privacy",
    tags: ["Phishing", "Awareness"],
    description: "Real examples of fake emails and messages, and the red flags that give them away before you click.",
    faq: [
      {
        q: "What is the most common sign of a phishing email?",
        a: "Urgency or fear – 'your account is locked', 'verify within 24 hours'. Legitimate companies don't threaten you into acting fast, because pressure is the tool that short-circuits your judgment. When you feel rushed, slow down.",
      },
      {
        q: "How do I check if a sender address is real?",
        a: "Look at the actual email address, not the display name – the display name can say anything. 'paypa1-security@update-now.xyz' is fake even if it says 'PayPal'; 'no-reply@paypal.com' is the real domain. Hover over links to see where they truly go.",
      },
      {
        q: "What should I do if I get a suspicious email?",
        a: "Don't click links or attachments, don't hit 'unsubscribe' (it confirms your address works), and don't reply. If it claims to be from a service you use, open a new tab, type the real address yourself, and check your account there.",
      },    ],
  },
  {
    title: "How to start learning to code in 2026",
    url: "learn-to-code.html",
    date: "2026-08-24",
    updated: "2026-09-04",
    category: "Programming & Web",
    tags: ["Beginners", "Roadmap"],
    description: "A realistic roadmap – pick a language, build tiny projects, and avoid the tutorial trap.",
    faq: [
      {
        q: "Which programming language should I learn first?",
        a: "Match the language to what you want to build: JavaScript for websites, Python for data/AI/automation, C# or Godot for games. If you genuinely have no idea, start with Python – it reads almost like English and has the friendliest learning curve.",
      },
      {
        q: "What is the tutorial trap?",
        a: "Watching course after course without ever building anything – you can watch 200 hours of video and still not write a program from scratch. The fix: watch one lesson, close the video, type the code yourself, break it, then rebuild it from memory.",
      },
      {
        q: "What should my first real coding project be?",
        a: "Classic starters that teach everything: a to-do list app (data, events, state), a calculator (logic and edge cases), a number guesser (loops and conditionals), or a personal website you deploy free on GitHub Pages.",
      },    ],
  },
  {
    title: "HTML, CSS, and JavaScript: what does each one do?",
    url: "html-css-js.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Programming & Web",
    tags: ["Web", "Basics"],
    description: "The three building blocks of every website, explained with a simple analogy.",
  },
  {
    title: "Version control with Git for complete beginners",
    url: "git-beginners.html",
    date: "2026-08-24",
    updated: "2026-08-24",
    category: "Programming & Web",
    tags: ["Git", "Tools"],
    description: "Why every developer uses Git, and the handful of commands that cover 90% of daily work.",
  },
  {
    title: "Installing ROCm on Ubuntu for Radeon GPUs",
    url: "install-rocm-ubuntu.html",
    date: "2026-08-25",
    updated: "2026-08-25",
    category: "Tutorials",
    featured: true,
    tags: ["ROCm", "Radeon", "GPU"],
    description: "Step-by-step guide to installing ROCm 7.14 on Ubuntu 26.04 for AMD Radeon (RDNA2/RDNA3) GPUs – from apt setup to rocminfo verification.",
  },
  {
    title: "Installing PyTorch with ROCm on Radeon GPUs",
    url: "install-pytorch-rocm-ubuntu.html",
    date: "2026-08-25",
    updated: "2026-08-25",
    category: "Tutorials",
    tags: ["PyTorch", "ROCm", "Radeon"],
    description: "Step-by-step guide to installing PyTorch with ROCm support on Ubuntu for AMD Radeon (RDNA2) GPUs – venv setup, pip install, and GPU verification.",
  },
  {
    title: "Apple's new Mac desktops: Mac Studio M5 Max/Ultra and Mac mini M6/M5 Pro",
    url: "new-mac-desktops.html",
    date: "2026-08-25",
    updated: "2026-08-25",
    category: "Hardware",
    tags: ["Apple Silicon", "Mac", "Desktop"],
    featured: true,
    description: "Apple's compact desktops land on 22 September – the Mac Studio with M5 Max and M5 Ultra, plus the Mac mini with M6 and M5 Pro. Here's what changed and which one is yours.",
  },
  {
    title: "Qwen 27B Ridge 3.7bpw on RX 6800M: ROCm vs Vulkan at 16K – VelsTech Lab",
    url: "qwen-27b-ridge-rocm-vs-vulkan.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "AI",
    featured: true,
    tags: ["VelsTech Lab", "Qwen", "RX 6800M", "ROCm", "Vulkan", "Benchmark"],
    description: "Tested Qwen 27B Ridge at 3.7bpw on a 12GB RX 6800M – ROCm 18.1 tok/s vs Vulkan 21.8 tok/s decode at 16K, with prompt-eval tradeoffs and VRAM fit.",
  },
  {
    title: "Ornith 35B MoE at 262K on RX 6800M: ROCm vs Vulkan – VelsTech Lab",
    url: "ornith-35b-moe-262k-rocm-vs-vulkan.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "AI",
    featured: true,
    tags: ["VelsTech Lab", "MoE", "Ornith 35B", "RX 6800M", "ROCm", "Vulkan", "Benchmark"],
    description: "Tested Ornith 1.5 35B-A3B MoE at 262K on RX 6800M – ROCm 25.6 tok/s vs Vulkan 19.6 tok/s decode, 83 tok/s prompt, with 28 CPU experts and q8 KV.",
  },
  {
    title: "MoE vs Dense on RX 6800M: 3B Active vs 27B at 16K/262K – VelsTech Lab",
    url: "moe-vs-dense-rx6800m-16k-vs-262k.html",
    date: "2026-08-27",
    updated: "2026-08-27",
    category: "AI",
    featured: true,
    tags: ["VelsTech Lab", "MoE vs Dense", "RX 6800M", "Benchmark"],
    description: "Same RX 6800M 12GB – Ornith 35B MoE (3B active, 262K) vs Qwen 27B dense (27B, 16K) at q8 KV, ROCm vs Vulkan head-to-head.",
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = ARTICLES;
}
