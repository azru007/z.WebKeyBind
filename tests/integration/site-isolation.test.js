/**
 * Integration Tests: Per-Site Shortcut Isolation
 * @req z.WebKeyBind_04
 *
 * Verifies that shortcuts bound on different hostnames are stored and
 * retrieved independently via the storage key prefix convention.
 */

beforeEach(() => {
  __chromeMock.resetStorage();
  __chromeMock.resetMockCalls();
});

describe("Per-site shortcut isolation", () => {
  const siteAShortcut = { key: "A", url: "site-a.com", name: "Button A" };
  const siteBShortcut = { key: "A", url: "site-b.com", name: "Button A (B)" };

  /** @testId WK-INT-11 */
  test("same key on different sites stored independently", (done) => {
    chrome.storage.local.set(
      {
        "sc_site-a.com_A": siteAShortcut,
        "sc_site-b.com_A": siteBShortcut
      },
      () => {
        chrome.storage.local.get(
          ["sc_site-a.com_A", "sc_site-b.com_A"],
          (result) => {
            expect(result["sc_site-a.com_A"].url).toBe("site-a.com");
            expect(result["sc_site-b.com_A"].url).toBe("site-b.com");
            expect(result["sc_site-a.com_A"].name).not.toBe(
              result["sc_site-b.com_A"].name
            );
            done();
          }
        );
      }
    );
  });

  /** @testId WK-INT-12 */
  test("cache filtered by hostname returns only matching site shortcuts", (done) => {
    chrome.storage.local.set(
      {
        "sc_site-a.com_A": siteAShortcut,
        "sc_site-a.com_B": { key: "B", url: "site-a.com" },
        "sc_site-b.com_A": siteBShortcut,
        "sc_site-b.com_C": { key: "C", url: "site-b.com" }
      },
      () => {
        chrome.storage.local.get(null, (allItems) => {
          const targetHost = "site-a.com";
          const filtered = Object.entries(allItems).filter(
            ([k, v]) => k.startsWith("sc_") && v.url === targetHost
          );
          expect(filtered.length).toBe(2);
          filtered.forEach(([, v]) => {
            expect(v.url).toBe(targetHost);
          });
          done();
        });
      }
    );
  });
});
