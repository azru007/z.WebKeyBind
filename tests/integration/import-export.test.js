/**
 * Integration Tests: Import/Export Round-Trip
 * @req z.WebKeyBind_06
 *
 * Tests the full lifecycle: export shortcuts to JSON, import back, verify integrity.
 * Also tests conflict resolution and malformed input handling.
 */

beforeEach(() => {
  __chromeMock.resetStorage();
  __chromeMock.resetMockCalls();
});

// Helper: simulate export by reading all storage items with "sc_" prefix
function exportShortcuts(callback) {
  chrome.storage.local.get(null, (items) => {
    const shortcuts = [];
    Object.entries(items).forEach(([key, value]) => {
      if (key.startsWith("sc_")) {
        shortcuts.push({ storageKey: key, ...value });
      }
    });
    callback(JSON.stringify(shortcuts, null, 2));
  });
}

// Helper: simulate import with conflict detection
function importShortcuts(jsonString, existingItems, callback) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    callback({ success: false, error: "Invalid JSON" });
    return;
  }
  if (!Array.isArray(parsed)) {
    callback({ success: false, error: "Expected array" });
    return;
  }
  const conflicts = [];
  const toImport = [];
  parsed.forEach((item) => {
    const conflicting = existingItems.find(
      (ex) => ex.key === item.key && ex.url === item.url
    );
    if (conflicting) {
      conflicts.push({ existing: conflicting, incoming: item });
    } else {
      toImport.push(item);
    }
  });
  callback({ success: true, imported: toImport, conflicts: conflicts });
}

describe("Export functionality", () => {
  /** @testId WK-INT-05 */
  test("exports all shortcuts as JSON array", (done) => {
    chrome.storage.local.set(
      {
        "sc_site1_A": { key: "A", url: "site1.com", name: "Button A" },
        "sc_site1_B": { key: "B", url: "site1.com", name: "Link B" },
        "selectedLanguage": "English" // Non-shortcut key
      },
      () => {
        exportShortcuts((json) => {
          const data = JSON.parse(json);
          expect(data.length).toBe(2);
          expect(data.every((item) => item.storageKey.startsWith("sc_"))).toBe(true);
          done();
        });
      }
    );
  });

  /** @testId WK-INT-06 */
  test("exported JSON does not include non-shortcut storage keys", (done) => {
    chrome.storage.local.set(
      {
        "sc_test_A": { key: "A", url: "test.com" },
        "selectedLanguage": "English",
        "someOtherPref": true
      },
      () => {
        exportShortcuts((json) => {
          const data = JSON.parse(json);
          expect(data.length).toBe(1);
          const keys = data.map((d) => d.storageKey);
          expect(keys).not.toContain("selectedLanguage");
          expect(keys).not.toContain("someOtherPref");
          done();
        });
      }
    );
  });
});

describe("Import functionality", () => {
  /** @testId WK-INT-07 */
  test("import round-trip: export then import produces same data", (done) => {
    const original = { key: "C", url: "round.com", name: "Round Trip" };
    chrome.storage.local.set({ "sc_round_C": original }, () => {
      exportShortcuts((json) => {
        __chromeMock.resetStorage();
        importShortcuts(json, [], (result) => {
          expect(result.success).toBe(true);
          expect(result.imported.length).toBe(1);
          expect(result.imported[0].key).toBe("C");
          expect(result.imported[0].url).toBe("round.com");
          done();
        });
      });
    });
  });

  /** @testId WK-INT-08 */
  test("import detects conflicts with existing shortcuts", () => {
    const existing = [{ key: "A", url: "test.com", name: "Existing" }];
    const json = JSON.stringify([{ key: "A", url: "test.com", name: "New" }]);
    importShortcuts(json, existing, (result) => {
      expect(result.success).toBe(true);
      expect(result.conflicts.length).toBe(1);
      expect(result.imported.length).toBe(0);
    });
  });

  /** @testId WK-INT-09 */
  test("import adds non-conflicting shortcuts", () => {
    const existing = [{ key: "A", url: "test.com" }];
    const json = JSON.stringify([{ key: "B", url: "test.com" }]);
    importShortcuts(json, existing, (result) => {
      expect(result.success).toBe(true);
      expect(result.conflicts.length).toBe(0);
      expect(result.imported.length).toBe(1);
    });
  });

  /** @testId WK-INT-10 */
  test("rejects malformed JSON gracefully", () => {
    importShortcuts("not valid json {{{", [], (result) => {
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid JSON");
    });
  });

  test("rejects non-array JSON", () => {
    importShortcuts('{"key": "value"}', [], (result) => {
      expect(result.success).toBe(false);
      expect(result.error).toBe("Expected array");
    });
  });
});
