/**
 * Unit Tests: Element Healing Engine
 * @req z.WebKeyBind_04
 *
 * Tests findElementWithHealing() as defined in content.js:416-443.
 * Verifies the priority-ordered fallback resolution chain.
 */

// Inline function matching content.js:416-443
function findElementWithHealing(profile) {
  if (!profile) return { element: null, healed: false };
  if (profile.id && document.getElementById(profile.id)) {
    return { element: document.getElementById(profile.id), healed: false };
  }
  if (profile.href) {
    try {
      const link = document.querySelector(
        'a[href="' + profile.href.replace(/"/g, '\\"') + '"]'
      );
      if (link) return { element: link, healed: true };
    } catch (e) {
      // Invalid selector
    }
  }
  if (profile.testId) {
    const e = document.querySelector('[data-testid="' + profile.testId + '"]');
    if (e) return { element: e, healed: true };
  }
  if (profile.path) {
    try {
      const e = document.querySelector(profile.path);
      if (e) return { element: e, healed: true };
    } catch (e) {
      // Invalid path
    }
  }
  if (profile.aria) {
    const e = document.querySelector(
      '[aria-label="' + profile.aria.replace(/"/g, '\\"') + '"]'
    );
    if (e) return { element: e, healed: true };
  }
  return { element: null, healed: false };
}

describe("findElementWithHealing", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  /** @testId WK-HEAL-01 */
  test("resolves by exact element ID (no healing needed)", () => {
    document.body.innerHTML = '<button id="my-btn">Click</button>';
    const result = findElementWithHealing({ id: "my-btn" });
    expect(result.element).toBe(document.getElementById("my-btn"));
    expect(result.healed).toBe(false);
  });

  /** @testId WK-HEAL-02 */
  test("heals by href when ID is missing", () => {
    document.body.innerHTML = '<a href="/settings">Settings</a>';
    const result = findElementWithHealing({ id: "gone-id", href: "/settings" });
    expect(result.element.tagName).toBe("A");
    expect(result.healed).toBe(true);
  });

  /** @testId WK-HEAL-03 */
  test("heals by data-testid", () => {
    document.body.innerHTML = '<button data-testid="btn-save">Save</button>';
    const result = findElementWithHealing({ id: null, testId: "btn-save" });
    expect(result.element.getAttribute("data-testid")).toBe("btn-save");
    expect(result.healed).toBe(true);
  });

  /** @testId WK-HEAL-04 */
  test("heals by CSS path", () => {
    document.body.innerHTML = "<div><span><button>Go</button></span></div>";
    const btn = document.querySelector("button");
    const path = "div:nth-of-type(1) > span:nth-of-type(1) > button:nth-of-type(1)";
    const result = findElementWithHealing({ id: null, path: path });
    expect(result.element).toBe(btn);
    expect(result.healed).toBe(true);
  });

  /** @testId WK-HEAL-05 */
  test("heals by aria-label as last resort", () => {
    document.body.innerHTML = '<button aria-label="Submit Form">Submit</button>';
    const result = findElementWithHealing({ id: null, aria: "Submit Form" });
    expect(result.element.getAttribute("aria-label")).toBe("Submit Form");
    expect(result.healed).toBe(true);
  });

  /** @testId WK-HEAL-06 */
  test("returns null element when no fallback resolves", () => {
    document.body.innerHTML = "<div>Empty page</div>";
    const result = findElementWithHealing({
      id: "nonexistent",
      href: "/nowhere",
      testId: "no-such",
      path: "div#nope",
      aria: "No Such Label"
    });
    expect(result.element).toBeNull();
    expect(result.healed).toBe(false);
  });

  /** @testId WK-HEAL-07 */
  test("returns null for null profile input", () => {
    const result = findElementWithHealing(null);
    expect(result.element).toBeNull();
    expect(result.healed).toBe(false);
  });

  test("priority: ID is checked before href", () => {
    document.body.innerHTML =
      '<button id="primary">Primary</button><a href="/alt">Alt</a>';
    const result = findElementWithHealing({ id: "primary", href: "/alt" });
    expect(result.element.id).toBe("primary");
    expect(result.healed).toBe(false);
  });
});
