/**
 * Unit Tests: isInputActive() function
 * @req z.WebKeyBind_04
 *
 * Tests element type detection for suppressing shortcut capture during text input.
 * Source: content.js:117-123
 */

// Inline function matching content.js:117-123
function isInputActive(activeElement) {
  const el = activeElement;
  if (!el) return false;
  const tagName = el.tagName.toLowerCase();
  const isEditable = el.getAttribute("contenteditable") === "true";
  return tagName === "input" || tagName === "textarea" || tagName === "select" || isEditable;
}

describe("isInputActive", () => {
  /** @testId WK-INPUT-01 */
  test("returns true for input elements", () => {
    const el = document.createElement("input");
    expect(isInputActive(el)).toBe(true);
  });

  /** @testId WK-INPUT-02 */
  test("returns true for textarea elements", () => {
    const el = document.createElement("textarea");
    expect(isInputActive(el)).toBe(true);
  });

  /** @testId WK-INPUT-03 */
  test("returns true for select elements", () => {
    const el = document.createElement("select");
    expect(isInputActive(el)).toBe(true);
  });

  /** @testId WK-INPUT-04 */
  test("returns true for contenteditable elements", () => {
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "true");
    expect(isInputActive(el)).toBe(true);
  });

  test("returns false for button elements", () => {
    const el = document.createElement("button");
    expect(isInputActive(el)).toBe(false);
  });

  test("returns false for div elements", () => {
    const el = document.createElement("div");
    expect(isInputActive(el)).toBe(false);
  });

  test("returns false for anchor elements", () => {
    const el = document.createElement("a");
    expect(isInputActive(el)).toBe(false);
  });

  test("returns false for null", () => {
    expect(isInputActive(null)).toBe(false);
  });

  test("returns false for contenteditable=false", () => {
    const el = document.createElement("div");
    el.setAttribute("contenteditable", "false");
    expect(isInputActive(el)).toBe(false);
  });
});
