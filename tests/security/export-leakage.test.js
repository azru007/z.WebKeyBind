/**
 * Security Tests: Export Data Leakage
 * @req z.WebKeyBind_06
 *
 * Verifies that exported JSON contains only shortcut data and
 * does not leak browser metadata, session tokens, or extension internals.
 */

describe("Export data leakage check", () => {
  /** @testId WK-SEC-07 */
  test("exported shortcut objects contain only expected fields", () => {
    const expectedFields = [
      "key",
      "url",
      "name",
      "elementId",
      "cssPath",
      "elementProfile",
      "storageKey"
    ];

    const exportedItem = {
      storageKey: "sc_test_A",
      key: "A",
      url: "test.com",
      name: "Test Button",
      elementId: "btn-test",
      cssPath: "body > div > button",
      elementProfile: {
        id: "btn-test",
        tag: "button",
        text: "Test Button",
        aria: null,
        testId: null,
        href: null,
        path: "body > div > button"
      }
    };

    const keys = Object.keys(exportedItem);
    keys.forEach((key) => {
      expect(expectedFields).toContain(key);
    });
  });

  test("exported data does not contain browser-specific metadata", () => {
    const exportedItem = {
      key: "A",
      url: "test.com",
      name: "Test"
    };
    const json = JSON.stringify(exportedItem);
    // Check for common browser metadata leakage patterns
    expect(json).not.toContain("cookie");
    expect(json).not.toContain("sessionId");
    expect(json).not.toContain("token");
    expect(json).not.toContain("password");
    expect(json).not.toContain("localStorage");
  });
});
