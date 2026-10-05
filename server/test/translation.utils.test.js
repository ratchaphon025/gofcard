const test = require("node:test");
const assert = require("node:assert/strict");
const { translateEnglishToThai } = require("../src/utils/translation.utils");

test("returns the Thai translation from the provider", async () => {
  const source = `Translate this sentence ${Date.now()}.`;
  const translation = await translateEnglishToThai(source, async (url, options) => {
    assert.equal(new URL(url).searchParams.get("langpair"), "en|th");
    assert.equal(new URL(url).searchParams.get("q"), source);
    assert.ok(options.signal);
    return {
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: { translatedText: "จั่วการ์ด 1 ใบ" },
      }),
    };
  });

  assert.equal(translation, "จั่วการ์ด 1 ใบ");
});

test("reports translation provider failures", async () => {
  await assert.rejects(
    translateEnglishToThai("Draw 1 card.", async () => ({ ok: false, status: 503 })),
    /HTTP 503/
  );
});

test("rejects empty translation results", async () => {
  await assert.rejects(
    translateEnglishToThai("Draw 1 card.", async () => ({
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: "" } }),
    })),
    /empty result/
  );
});
