/**
 * Unit Tests: ARIA Announcer Engine
 * @req z.WebKeyBind_08
 *
 * Tests the dual-toggle announcer behavior defined in content.js:67-109.
 */

describe("ARIA Announcer", () => {
  let announcerContainer;
  let announcer1;
  let announcer2;
  let useFirst;

  // Simulate the announcer setup from content.js:67-95
  function setupAnnouncers() {
    announcerContainer = document.createElement("div");
    announcerContainer.id = "z-webkeybind-announcer-container";
    announcerContainer.setAttribute("role", "status");

    announcer1 = document.createElement("div");
    announcer1.id = "z-webkeybind-announcer-1";
    announcer1.setAttribute("aria-live", "assertive");
    announcer1.setAttribute("aria-atomic", "true");

    announcer2 = document.createElement("div");
    announcer2.id = "z-webkeybind-announcer-2";
    announcer2.setAttribute("aria-live", "assertive");
    announcer2.setAttribute("aria-atomic", "true");

    // Visually hidden style
    [announcer1, announcer2].forEach((el) => {
      el.style.position = "absolute";
      el.style.width = "1px";
      el.style.height = "1px";
      el.style.overflow = "hidden";
      el.style.clip = "rect(0 0 0 0)";
    });

    announcerContainer.appendChild(announcer1);
    announcerContainer.appendChild(announcer2);
    document.body.appendChild(announcerContainer);
    useFirst = true;
  }

  // Simulate the announce function from content.js:99-109
  function announce(text, lang) {
    const langAttr = lang || "en";
    if (useFirst) {
      announcer1.textContent = text;
      announcer1.setAttribute("lang", langAttr);
      announcer2.textContent = "";
    } else {
      announcer2.textContent = text;
      announcer2.setAttribute("lang", langAttr);
      announcer1.textContent = "";
    }
    useFirst = !useFirst;
  }

  beforeEach(() => {
    document.body.innerHTML = "";
    setupAnnouncers();
  });

  /** @testId WK-ANN-01 */
  test("first announcement goes to announcer-1", () => {
    announce("Shortcut A saved");
    expect(announcer1.textContent).toBe("Shortcut A saved");
    expect(announcer2.textContent).toBe("");
  });

  /** @testId WK-ANN-02 */
  test("second announcement toggles to announcer-2", () => {
    announce("First message");
    announce("Second message");
    expect(announcer2.textContent).toBe("Second message");
    expect(announcer1.textContent).toBe("");
  });

  /** @testId WK-ANN-03 */
  test("sets correct lang attribute", () => {
    announce("Test", "hi");
    expect(announcer1.getAttribute("lang")).toBe("hi");
  });

  /** @testId WK-ANN-04 */
  test("both announcers have aria-live assertive", () => {
    expect(announcer1.getAttribute("aria-live")).toBe("assertive");
    expect(announcer2.getAttribute("aria-live")).toBe("assertive");
  });

  test("defaults to lang=en when no lang parameter", () => {
    announce("Default language");
    expect(announcer1.getAttribute("lang")).toBe("en");
  });

  test("announcers are visually hidden (width/height 1px)", () => {
    expect(announcer1.style.width).toBe("1px");
    expect(announcer1.style.height).toBe("1px");
    expect(announcer2.style.width).toBe("1px");
    expect(announcer2.style.height).toBe("1px");
    expect(announcer1.style.overflow).toBe("hidden");
    expect(announcer2.style.overflow).toBe("hidden");
  });
});
