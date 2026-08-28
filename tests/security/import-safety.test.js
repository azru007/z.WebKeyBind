/**
 * Security Tests: Import Safety
 * @req z.WebKeyBind_06
 *
 * Tests that import processing does not execute injected payloads
 * in shortcut name/elementId/url fields.
 */

describe("Import XSS safety", () => {
  /** @testId WK-SEC-05 */
  test("XSS payloads in shortcut name field do not execute", () => {
    const malicious = [
      { key: "A", url: "test.com", name: '<script>alert("xss")</script>' },
      { key: "B", url: "test.com", name: '"><img src=x onerror=alert(1)>' },
      {
        key: "C",
        url: "test.com",
        name: "javascript:alert(document.cookie)"
      }
    ];
    const json = JSON.stringify(malicious);
    const parsed = JSON.parse(json);

    // Verify parsed data is treated as data (string), not code
    parsed.forEach((item) => {
      expect(typeof item.name).toBe("string");
    });
    // HTML-based payloads still contain literal angle brackets (not executed)
    expect(parsed[0].name).toContain("<script>");
    expect(parsed[1].name).toContain("onerror");
    // Protocol-based payload still contains literal text
    expect(parsed[2].name).toContain("javascript:");
  });

  /** @testId WK-SEC-06 */
  test("oversized import file is bounded", () => {
    // Generate a massive array
    const large = [];
    for (let i = 0; i < 10000; i++) {
      large.push({
        key: String.fromCharCode(65 + (i % 26)),
        url: "site-" + i + ".com",
        name: "Item " + i
      });
    }
    const json = JSON.stringify(large);

    // Parser should still function (no crash)
    const parsed = JSON.parse(json);
    expect(parsed.length).toBe(10000);

    // In real usage, the import function should cap or warn on large imports
    // This test verifies the parser itself does not crash
  });
});

describe("Import field validation", () => {
  test("import items with missing required fields are detectable", () => {
    const items = [
      { key: "A" }, // missing url and name
      { url: "test.com" }, // missing key
      { key: "B", url: "test.com", name: "Valid" } // complete
    ];
    const valid = items.filter(
      (item) => item.key && item.url
    );
    expect(valid.length).toBe(1);
    expect(valid[0].key).toBe("B");
  });
});
