/**
 * VelsTech i18n – EN / TA / HI
 * Single source for UI strings. Keep keys flat for simplicity.
 * Loaded before script.js and chat.js so both can use window.VelsI18n
 */
(function () {
  const TRANSLATIONS = {
    en: {
      lang_name: "English",
      nav_home: "Home",
      nav_getstarted: "Get Started",
      nav_topics: "Topics",
      nav_lab: "Lab",
      nav_benchmarks: "Benchmarks",
      nav_tools: "Tools",
      nav_guides: "Guides",
      search_placeholder: "Search articles…",
      search_empty: 'No results for "',
      theme_toggle: "Toggle theme",
      accent_toggle: "Accent color",
      tag_search: "Search",
      footer_subscribe: "Subscribe",
      footer_resources: "Resources",
      footer_advertise: "Advertise",
      footer_disclosure: "Affiliate Disclosure",
      footer_terms: "Terms",
      footer_privacy: "Privacy",
      footer_contact: "Contact",
      footer_networking: "Networking",
      footer_security: "Security",
      footer_development: "Development",
      footer_tutorials: "Tutorials",
      footer_note: "Content on this site is generated with the assistance of AI and is for informational purposes only.",
      footer_rights: "All rights reserved.",
      share_label: "Share",
      copy: "Copy",
      copied: "Copied!",
      copy_title: "Copy code to clipboard",
      copy_aria: "Copy code",
      related_heading: "Related articles",
      faq_heading: "Frequently asked questions",
      continue_reading: "Continue reading",
      prev: "← Previous",
      next: "Next →",
      author_visit: "Visit the Lab →",
      tag_updated: "· Updated ",
      hot_topic_cta: "Read article",
      // chat
      chat_title: "VelsChat",
      chat_sub: "AI · answers from the blog + general",
      chat_placeholder: "Ask about the blog or anything else…",
      chat_send: "Send",
      chat_close: "Close",
      chat_open: "Open AI assistant",
      chat_explain_page: "✨ Explain this page",
      chat_explain_hint: "Summarize what this page says",
      chat_disclaimer: "AI can make mistakes. Check important facts.",
      chat_welcome: "👋 Hi – I'm the VelsTech assistant. Ask me about articles on this site (AI, hardware, Linux, security…) or anything else.<br><span style=\"opacity:.7;font-size:12px\">Tip: try “Explain this page” when viewing an article.</span>",
      // glossary / define
      ask_velschat: "Ask VelsChat →",
      read_guide: "Read guide →",
      ask_about: "Ask about",
      // language
      lang_en: "EN",
      lang_ta: "TA",
      lang_hi: "HI"
    },
    ta: {
      lang_name: "தமிழ்",
      nav_home: "முகப்பு",
      nav_getstarted: "தொடங்குக",
      nav_topics: "தலைப்புகள்",
      nav_lab: "ஆய்வகம்",
      nav_benchmarks: "பெஞ்ச்மார்க்",
      nav_tools: "கருவிகள்",
      nav_guides: "வழிகாட்டிகள்",
      search_placeholder: "கட்டுரைகளைத் தேடுக…",
      search_empty: '"',
      theme_toggle: "தீம் மாற்று",
      accent_toggle: "நிறம்",
      tag_search: "தேடுக",
      footer_subscribe: "குழுசேர்",
      footer_resources: "வளங்கள்",
      footer_advertise: "விளம்பரம்",
      footer_disclosure: "கூட்டு வெளிப்படுத்தல்",
      footer_terms: "விதிமுறைகள்",
      footer_privacy: "தனியுரிமை",
      footer_contact: "தொடர்பு",
      footer_networking: "நெட்வொர்க்கிங்",
      footer_security: "பாதுகாப்பு",
      footer_development: "மேம்பாடு",
      footer_tutorials: "பயிற்சிகள்",
      footer_note: "இந்த தளத்தின் உள்ளடக்கம் AI உதவியுடன் உருவாக்கப்பட்டது, தகவல் நோக்கத்திற்காக மட்டுமே.",
      footer_rights: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
      share_label: "பகிர்",
      copy: "நகலெடு",
      copied: "நகலெடுக்கப்பட்டது!",
      copy_title: "குறியீட்டை நகலெடுக்கவும்",
      copy_aria: "குறியீட்டை நகலெடு",
      related_heading: "தொடர்புடைய கட்டுரைகள்",
      faq_heading: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
      continue_reading: "தொடர்ந்து படிக்க",
      prev: "← முந்தைய",
      next: "அடுத்து →",
      author_visit: "ஆய்வகத்தைப் பார்க்க →",
      tag_updated: "· புதுப்பிக்கப்பட்டது ",
      hot_topic_cta: "கட்டுரையைப் படிக்க",
      chat_title: "VelsChat",
      chat_sub: "AI · வலைப்பதிவு + பொது பதில்கள்",
      chat_placeholder: "வலைப்பதிவு பற்றி அல்லது எதையும் கேளுங்கள்…",
      chat_send: "அனுப்பு",
      chat_close: "மூடு",
      chat_open: "AI உதவியாளரைத் திற",
      chat_explain_page: "✨ இந்த பக்கத்தை விளக்குக",
      chat_explain_hint: "இந்த பக்கம் என்ன சொல்கிறது",
      chat_disclaimer: "AI தவறு செய்யலாம். முக்கிய தகவல்களை சரிபார்க்கவும்.",
      chat_welcome: "👋 வணக்கம் – நான் VelsTech உதவியாளர். இந்த தளத்தின் கட்டுரைகள் (AI, ஹார்டுவேர், Linux, பாதுகாப்பு…) பற்றி அல்லது எதையும் கேளுங்கள்.<br><span style=\"opacity:.7;font-size:12px\">குறிப்பு: கட்டுரையில் “இந்த பக்கத்தை விளக்குக” முயற்சிக்கவும்.</span>",
      ask_velschat: "VelsChat-ஐ கேளுங்கள் →",
      read_guide: "வழிகாட்டியைப் படிக்க →",
      ask_about: "பற்றி கேளுங்கள்",
      lang_en: "EN",
      lang_ta: "TA",
      lang_hi: "HI"
    },
    hi: {
      lang_name: "हिन्दी",
      nav_home: "होम",
      nav_getstarted: "शुरू करें",
      nav_topics: "विषय",
      nav_lab: "लैब",
      nav_benchmarks: "बेंचमार्क",
      nav_tools: "टूल्स",
      nav_guides: "गाइड",
      search_placeholder: "लेख खोजें…",
      search_empty: '"',
      theme_toggle: "थीम बदलें",
      accent_toggle: "रंग",
      tag_search: "खोजें",
      footer_subscribe: "सब्सक्राइब",
      footer_resources: "संसाधन",
      footer_advertise: "विज्ञापन",
      footer_disclosure: "संबद्ध प्रकटीकरण",
      footer_terms: "शर्तें",
      footer_privacy: "प्राइवेसी",
      footer_contact: "संपर्क",
      footer_networking: "नेटवर्किंग",
      footer_security: "सुरक्षा",
      footer_development: "डेवलपमेंट",
      footer_tutorials: "ट्यूटोरियल",
      footer_note: "इस साइट की सामग्री AI की सहायता से बनाई गई है, केवल जानकारी के लिए।",
      footer_rights: "सर्वाधिकार सुरक्षित।",
      share_label: "शेयर",
      copy: "कॉपी",
      copied: "कॉपी हो गया!",
      copy_title: "कोड कॉपी करें",
      copy_aria: "कोड कॉपी करें",
      related_heading: "संबंधित लेख",
      faq_heading: "अक्सर पूछे जाने वाले सवाल",
      continue_reading: "आगे पढ़ें",
      prev: "← पिछला",
      next: "अगला →",
      author_visit: "लैब देखें →",
      tag_updated: "· अपडेट ",
      hot_topic_cta: "लेख पढ़ें",
      chat_title: "VelsChat",
      chat_sub: "AI · ब्लॉग + सामान्य उत्तर",
      chat_placeholder: "ब्लॉग के बारे में या कुछ भी पूछें…",
      chat_send: "भेजें",
      chat_close: "बंद करें",
      chat_open: "AI सहायक खोलें",
      chat_explain_page: "✨ इस पेज को समझाएँ",
      chat_explain_hint: "यह पेज क्या कहता है",
      chat_disclaimer: "AI गलत कर सकता है। महत्वपूर्ण तथ्य जाँच लें।",
      chat_welcome: "👋 नमस्ते – मैं VelsTech सहायक हूँ। इस साइट के लेखों (AI, हार्डवेयर, Linux, सुरक्षा…) के बारे में या कुछ भी पूछें।<br><span style=\"opacity:.7;font-size:12px\">टिप: लेख में “इस पेज को समझाएँ” आज़माएँ।</span>",
      ask_velschat: "VelsChat से पूछें →",
      read_guide: "गाइड पढ़ें →",
      ask_about: "के बारे में पूछें",
      lang_en: "EN",
      lang_ta: "TA",
      lang_hi: "HI"
    }
  };

  function getLang() {
    try {
      const s = localStorage.getItem("vt-lang");
      if (s && TRANSLATIONS[s]) return s;
    } catch {}
    return "en";
  }

  function t(key) {
    const lang = getLang();
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
  }

  function setLang(lang) {
    if (!TRANSLATIONS[lang]) lang = "en";
    try { localStorage.setItem("vt-lang", lang); } catch {}
    document.documentElement.setAttribute("lang", lang);
    // For chat to pick up, also dispatch event
    try { window.dispatchEvent(new CustomEvent("vt-lang-change", { detail: lang })); } catch {}
  }

  // init lang attribute early
  try { document.documentElement.setAttribute("lang", getLang()); } catch {}

  // expose globally for script.js / chat.js / define.js
  window.VelsI18n = { TRANSLATIONS, getLang, t, setLang };
  window.t = t;
  window.getLang = getLang;
})();
