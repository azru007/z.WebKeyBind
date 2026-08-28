/**
 * Unit Tests: Robust Profile Generator
 * @req z.WebKeyBind_04
 *
 * Tests generateRobustProfile() as defined in content.js:446-471.
 */

// Polyfill CSS.escape for jsdom
if (typeof globalThis.CSS === "undefined") {
  globalThis.CSS = {
    escape: function (value) {
      return String(value).replace(/([^\w-])/g, "\\$1");
    }
  };
}

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

// Inline function matching content.js:446-471
function generateRobustProfile(element) {
  if (!element) return null;
  let safeId = null;
  if (element.id) {
    const escapedId = CSS.escape(element.id);
    const count = document.querySelectorAll("#" + escapedId).length;
    if (count === 1) {
      safeId = element.id;
    }
  }
  let href = element.getAttribute("href") || null;
  if (!href && element.closest("a")) {
    href = element.closest("a").getAttribute("href");
  }
  return {
    id: safeId,
    tag: element.tagName.toLowerCase(),
    text: (element.innerText || element.textContent) ? (element.innerText || element.textContent).trim().substring(0, 50) : null,
    aria: element.getAttribute("aria-label") || null,
    testId: element.getAttribute("data-testid") || null,
    href: href,
    path: generateCssPath(element)
  };
}

describe("generateRobustProfile", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  /** @testId WK-PROF-01 */
  test("extracts unique element ID", () => {
    document.body.innerHTML = '<button id="submit-btn">Submit</button>';
    const el = document.getElementById("submit-btn");
    const profile = generateRobustProfile(el);
    expect(profile.id).toBe("submit-btn");
  });

  /** @testId WK-PROF-02 */
  test("sets id to null for duplicate IDs", () => {
    document.body.innerHTML = '<button id="dup">A</button><button id="dup">B</button>';
    const el = document.querySelector("#dup");
    const profile = generateRobustProfile(el);
    expect(profile.id).toBeNull();
  });

  /** @testId WK-PROF-03 */
  test("extracts tag name in lowercase", () => {
    document.body.innerHTML = "<BUTTON>Click</BUTTON>";
    const el = document.querySelector("button");
    const profile = generateRobustProfile(el);
    expect(profile.tag).toBe("button");
  });

  /** @testId WK-PROF-04 */
  test("extracts aria-label attribute", () => {
    document.body.innerHTML = '<button aria-label="Submit Form">Go</button>';
    const el = document.querySelector("button");
    const profile = generateRobustProfile(el);
    expect(profile.aria).toBe("Submit Form");
  });

  /** @testId WK-PROF-05 */
  test("extracts data-testid attribute", () => {
    document.body.innerHTML = '<button data-testid="btn-main">Go</button>';
    const el = document.querySelector("button");
    const profile = generateRobustProfile(el);
    expect(profile.testId).toBe("btn-main");
  });

  /** @testId WK-PROF-06 */
  test("returns null for null element", () => {
    expect(generateRobustProfile(null)).toBeNull();
  });

  test("extracts href from parent anchor", () => {
    document.body.innerHTML = '<a href="/home"><span>Home</span></a>';
    const el = document.querySelector("span");
    const profile = generateRobustProfile(el);
    expect(profile.href).toBe("/home");
  });

  test("truncates text content to 50 characters", () => {
    const longText = "A".repeat(100);
    document.body.innerHTML = "<button>" + longText + "</button>";
    const el = document.querySelector("button");
    const profile = generateRobustProfile(el);
    expect(profile.text).toBeTruthy();
    expect(profile.text.length).toBeLessThanOrEqual(50);
  });

  test("generates CSS path property", () => {
    document.body.innerHTML = "<div><button>Click</button></div>";
    const el = document.querySelector("button");
    const profile = generateRobustProfile(el);
    expect(profile.path).toBeTruthy();
    expect(typeof profile.path).toBe("string");
  });
});
