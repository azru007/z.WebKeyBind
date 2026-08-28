/**
 * Unit Tests: Translation System
 * @req z.WebKeyBind_05
 *
 * Tests the translation dictionary structure and language key consistency.
 * Source: language.js:564-785
 */

// Load translations from source
const fs = require("fs");
const path = require("path");
const sourceContent = fs.readFileSync(
  path.resolve(__dirname, "..", "..", "language.js"),
  "utf-8"
);

// Extract the translations object by finding its boundaries
const translationsMatch = sourceContent.match(
  /window\.translations\s*=\s*(\{[\s\S]*?\n\});/
);

let translations = {};
if (translationsMatch) {
  try {
    // Use indirect eval only in test context (not in extension source)
    translations = (0, eval)("(" + translationsMatch[1] + ")");
  } catch (e) {
    // Fallback: manually define expected languages
  }
}

const expectedLanguages = ["English", "\u0939\u093F\u0902\u0926\u0940", "\u092E\u0930\u093E\u0920\u0940", "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02"];

describe("Translation dictionary structure", () => {
  /** @testId WK-LANG-01 */
  test("contains all four supported languages", () => {
    expectedLanguages.forEach((lang) => {
      expect(translations).toHaveProperty(lang);
    });
  });

  /** @testId WK-LANG-02 */
  test("all languages have the same key set as English", () => {
    const englishKeys = Object.keys(translations["English"] || {}).sort();
    expectedLanguages.forEach((lang) => {
      if (lang === "English") return;
      const langKeys = Object.keys(translations[lang] || {}).sort();
      expect(langKeys).toEqual(englishKeys);
    });
  });

  /** @testId WK-LANG-03 */
  test("no translation value is empty string", () => {
    expectedLanguages.forEach((lang) => {
      const t = translations[lang] || {};
      Object.entries(t).forEach(([key, value]) => {
        expect(value).not.toBe("");
      });
    });
  });

  /** @testId WK-LANG-04 */
  test("English translations contain all required keys for UI rendering", () => {
    const requiredKeys = [
      "settingsTitle",
      "defaultTitle",
      "savedTitle",
      "addBtn",
      "showAll",
      "showCurrent",
      "deleteAll",
      "p_url",
      "p_name",
      "p_id",
      "p_key",
      "cancelBtn",
      "delete_confirm",
      "delete_all_confirm",
      "importBtn",
      "exportBtn",
      "exportAllBtn",
      "saveChanges"
    ];
    requiredKeys.forEach((key) => {
      expect(translations["English"]).toHaveProperty(key);
    });
  });
});
