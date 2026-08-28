/**
 * Unit Tests: URL Utility Functions
 * @req z.WebKeyBind_03
 *
 * Tests normalizeUrl() and isValidURL() as defined in popup.js:4-21 and language.js:4-21.
 */

// Inline function definitions matching source (popup.js:19-21)
function normalizeUrl(url) {
  return url
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, "")
    .split("/")[0]
    .toLowerCase();
}

// Inline function definition matching source (popup.js:4-17)
function isValidURL(string) {
  if (!string) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    try {
      new URL("https://" + string);
      return true;
    } catch (__) {
      return false;
    }
  }
}

describe("normalizeUrl", () => {
  /** @testId WK-URL-01 */
  test("strips https:// protocol prefix", () => {
    expect(normalizeUrl("https://example.com/path")).toBe("example.com");
  });

  /** @testId WK-URL-02 */
  test("strips http:// protocol prefix", () => {
    expect(normalizeUrl("http://example.com/page")).toBe("example.com");
  });

  /** @testId WK-URL-03 */
  test("strips www. subdomain prefix", () => {
    expect(normalizeUrl("https://www.example.com")).toBe("example.com");
  });

  /** @testId WK-URL-04 */
  test("lowercases the hostname", () => {
    expect(normalizeUrl("HTTPS://Example.COM")).toBe("example.com");
  });

  /** @testId WK-URL-05 */
  test("strips trailing path segments", () => {
    expect(normalizeUrl("https://example.com/a/b/c?q=1")).toBe("example.com");
  });

  /** @testId WK-URL-06 */
  test("handles bare hostname input", () => {
    expect(normalizeUrl("example.com")).toBe("example.com");
  });

  test("handles empty string without crashing", () => {
    expect(normalizeUrl("")).toBe("");
  });
});

describe("isValidURL", () => {
  /** @testId WK-URL-07 */
  test("returns true for full https URL", () => {
    expect(isValidURL("https://example.com")).toBe(true);
  });

  /** @testId WK-URL-08 */
  test("returns true for bare domain (auto-prepends https)", () => {
    expect(isValidURL("example.com")).toBe(true);
  });

  test("returns false for null", () => {
    expect(isValidURL(null)).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidURL("")).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isValidURL(undefined)).toBe(false);
  });
});
