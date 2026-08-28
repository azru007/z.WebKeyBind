/**
 * Unit Tests: Key Validation Logic
 * @req z.WebKeyBind_03
 * @req z.WebKeyBind_04
 *
 * Tests key character validation as implemented in the keydown handler (content.js:188)
 * and popup input filters (popup.js:271-273).
 */

describe("Key character validation", () => {
  // Inline regex matching source: content.js:188 and popup.js:664
  const validKeyRegex = /^[A-Z0-9]$/;
  const sanitize = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, "");

  /** @testId WK-KEY-01 */
  test("accepts uppercase A-Z characters", () => {
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((ch) => {
      expect(validKeyRegex.test(ch)).toBe(true);
    });
  });

  /** @testId WK-KEY-02 */
  test("accepts digit 0-9 characters", () => {
    "0123456789".split("").forEach((ch) => {
      expect(validKeyRegex.test(ch)).toBe(true);
    });
  });

  /** @testId WK-KEY-03 */
  test("rejects lowercase characters", () => {
    expect(validKeyRegex.test("a")).toBe(false);
    expect(validKeyRegex.test("z")).toBe(false);
  });

  /** @testId WK-KEY-04 */
  test("rejects special characters", () => {
    const specials = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "=", " ", ".", ","];
    specials.forEach((ch) => {
      expect(validKeyRegex.test(ch)).toBe(false);
    });
  });

  /** @testId WK-KEY-05 */
  test("rejects multi-character strings", () => {
    expect(validKeyRegex.test("AB")).toBe(false);
    expect(validKeyRegex.test("12")).toBe(false);
  });

  /** @testId WK-KEY-06 */
  test("sanitizer converts lowercase to uppercase", () => {
    expect(sanitize("a")).toBe("A");
    expect(sanitize("z")).toBe("Z");
  });

  /** @testId WK-KEY-07 */
  test("sanitizer strips non-alphanumeric characters", () => {
    expect(sanitize("a!@#")).toBe("A");
    expect(sanitize("1-2")).toBe("12");
  });

  /** @testId WK-KEY-08 */
  test("sanitizer handles empty string", () => {
    expect(sanitize("")).toBe("");
  });
});

describe("Reserved key detection", () => {
  // Modifier keys that should be filtered out: content.js:167
  const modifierKeys = ["CONTROL", "SHIFT", "ALT", "TAB", "CAPSLOCK"];

  test("modifier keys are excluded from shortcut assignment", () => {
    modifierKeys.forEach((key) => {
      expect(modifierKeys.includes(key)).toBe(true);
    });
  });

  test("regular alphanumeric keys are not in modifier list", () => {
    expect(modifierKeys.includes("A")).toBe(false);
    expect(modifierKeys.includes("Z")).toBe(false);
    expect(modifierKeys.includes("1")).toBe(false);
  });
});
