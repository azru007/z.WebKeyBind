/**
 * Unit Tests: CSS Path Generator
 * @req z.WebKeyBind_04
 *
 * Tests generateCssPath() as defined in content.js:476-506.
 */

// Polyfill CSS.escape for jsdom (not available in JSDOM environment)
if (typeof globalThis.CSS === "undefined") {
  globalThis.CSS = {
    escape: function (value) {
      return String(value).replace(/([^\w-])/g, "\\$1");
    }
  };
}

// Inline function matching content.js:476-506
function generateCssPath(el) {
  if (!(el instanceof Element)) return;
  const path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    let isUnique = false;
    if (el.id) {
      const escaped = CSS.escape(el.id);
      if (document.querySelectorAll("#" + escaped).length === 1) {
        isUnique = true;
      }
    }
    if (isUnique) {
      selector += "#" + CSS.escape(el.id);
      path.unshift(selector);
      break;
    } else {
      let sib = el;
      let nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() === selector) nth++;
      }
      selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(" > ");
}

describe("generateCssPath", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  /** @testId WK-CSS-01 */
  test("generates path for a simple nested element", () => {
    document.body.innerHTML = '<div><span><button>Click</button></span></div>';
    const btn = document.querySelector("button");
    const result = generateCssPath(btn);
    expect(result).toContain("button:nth-of-type(1)");
    expect(result).toContain(" > ");
  });

  /** @testId WK-CSS-02 */
  test("stops at unique ID and includes it in path", () => {
    document.body.innerHTML = '<div id="root"><span><button>Click</button></span></div>';
    const btn = document.querySelector("button");
    const result = generateCssPath(btn);
    expect(result).toContain("div#root");
    // Should not traverse past the unique ID
    expect(result.indexOf("div#root")).toBe(0);
  });

  /** @testId WK-CSS-03 */
  test("uses nth-of-type for sibling disambiguation", () => {
    document.body.innerHTML = "<div><button>A</button><button>B</button></div>";
    const buttons = document.querySelectorAll("button");
    const pathA = generateCssPath(buttons[0]);
    const pathB = generateCssPath(buttons[1]);
    expect(pathA).toContain("button:nth-of-type(1)");
    expect(pathB).toContain("button:nth-of-type(2)");
  });

  /** @testId WK-CSS-04 */
  test("returns undefined for non-Element input", () => {
    expect(generateCssPath("not-an-element")).toBeUndefined();
    expect(generateCssPath(null)).toBeUndefined();
  });

  /** @testId WK-CSS-05 */
  test("generated path selects the correct element when queried", () => {
    document.body.innerHTML =
      '<div><p>A</p><p>B</p><section><p id="target">C</p></section></div>';
    const target = document.getElementById("target");
    const path = generateCssPath(target);
    const resolved = document.querySelector(path);
    expect(resolved).toBe(target);
  });
});
