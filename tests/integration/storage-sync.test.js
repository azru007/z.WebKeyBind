/**
 * Integration Tests: Storage Synchronization
 * @req z.WebKeyBind_03
 * @req z.WebKeyBind_04
 *
 * Tests the round-trip storage lifecycle: save, retrieve, cache update, and delete.
 * Verifies chrome.storage.onChanged triggers cache refresh across simulated contexts.
 */

beforeEach(() => {
  __chromeMock.resetStorage();
  __chromeMock.resetMockCalls();
});

describe("Storage round-trip lifecycle", () => {
  /** @testId WK-INT-01 */
  test("saved shortcut is retrievable via get", (done) => {
    const shortcut = {
      key: "A",
      elementId: "btn-submit",
      url: "example.com",
      name: "Submit Button"
    };
    chrome.storage.local.set({ "sc_example.com_A": shortcut }, () => {
      chrome.storage.local.get(["sc_example.com_A"], (result) => {
        expect(result["sc_example.com_A"]).toEqual(shortcut);
        done();
      });
    });
  });

  /** @testId WK-INT-02 */
  test("onChanged listener fires on storage write", (done) => {
    const listener = (changes, area) => {
      expect(area).toBe("local");
      expect(changes).toHaveProperty("sc_test_B");
      expect(changes["sc_test_B"].newValue).toEqual({ key: "B" });
      done();
    };
    chrome.storage.onChanged.addListener(listener);
    chrome.storage.local.set({ "sc_test_B": { key: "B" } });
  });

  /** @testId WK-INT-03 */
  test("deletion propagates via onChanged with oldValue only", (done) => {
    chrome.storage.local.set({ "sc_del_C": { key: "C" } }, () => {
      const listener = (changes, area) => {
        expect(changes["sc_del_C"].oldValue).toEqual({ key: "C" });
        expect(changes["sc_del_C"].newValue).toBeUndefined();
        done();
      };
      chrome.storage.onChanged.addListener(listener);
      chrome.storage.local.remove("sc_del_C");
    });
  });

  /** @testId WK-INT-04 */
  test("multiple shortcuts stored independently", (done) => {
    chrome.storage.local.set(
      {
        "sc_site1_A": { key: "A", url: "site1.com" },
        "sc_site1_B": { key: "B", url: "site1.com" },
        "sc_site2_A": { key: "A", url: "site2.com" }
      },
      () => {
        chrome.storage.local.get(null, (result) => {
          expect(Object.keys(result).length).toBe(3);
          expect(result["sc_site1_A"].url).toBe("site1.com");
          expect(result["sc_site2_A"].url).toBe("site2.com");
          done();
        });
      }
    );
  });
});

describe("Storage isolation", () => {
  test("get with defaults returns default for missing keys", (done) => {
    chrome.storage.local.get({ "missing_key": "default_value" }, (result) => {
      expect(result["missing_key"]).toBe("default_value");
      done();
    });
  });

  test("clear removes all data", (done) => {
    chrome.storage.local.set({ "key1": "a", "key2": "b" }, () => {
      chrome.storage.local.clear(() => {
        chrome.storage.local.get(null, (result) => {
          expect(Object.keys(result).length).toBe(0);
          done();
        });
      });
    });
  });
});
