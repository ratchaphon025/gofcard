const translations = new Map();

const translateEnglishToThai = async (text, fetchImpl = fetch) => {
  const cachedTranslation = translations.get(text);
  if (cachedTranslation) return cachedTranslation;

  const url = new URL("https://api.mymemory.translated.net/get");
  url.search = new URLSearchParams({ q: text, langpair: "en|th" }).toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Translation provider returned HTTP ${response.status}`);

    const data = await response.json();
    if (data.responseStatus !== 200) {
      throw new Error(`Translation provider returned status ${data.responseStatus || "unknown"}`);
    }
    const translation = data.responseData?.translatedText || "";
    if (!translation.trim()) throw new Error("Translation provider returned an empty result");
    translations.set(text, translation);
    return translation;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { translateEnglishToThai };
