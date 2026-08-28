/**
 * Unit Tests: Import Conflict Detection Logic
 * @req z.WebKeyBind_06
 *
 * Tests the conflict detection logic used during JSON import operations.
 * Source: import_export.js:373-374
 */

function normalizeUrl(url) {
  if (!url) return "";
  return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split("/")[0].toLowerCase();
}

/**
 * Simulate the conflict detection matching content.js:330-333 and import_export.js:374.
 */
function findKeyConflict(existingShortcuts, newItem) {
  const normImpUrl = normalizeUrl(newItem.url);
  return existingShortcuts.find(
    (ex) =>
      ex.key === newItem.key &&
      (normalizeUrl(ex.url) === normImpUrl || ex.url === "<URL>" || newItem.url === "<URL>")
  );
}

describe("Import conflict detection", () => {
  const existing = [
    { id: "1", key: "A", url: "example.com", name: "Example A" },
    { id: "2", key: "B", url: "other.com", name: "Other B" },
    { id: "3", key: "G", url: "<URL>", name: "Global G" }
  ];

  /** @testId WK-CONF-01 */
  test("detects conflict: same key and same domain", () => {
    const newItem = { key: "A", url: "example.com" };
    const conflict = findKeyConflict(existing, newItem);
    expect(conflict).toBeTruthy();
    expect(conflict.id).toBe("1");
  });

  /** @testId WK-CONF-02 */
  test("no conflict: same key but different domain", () => {
    const newItem = { key: "A", url: "different.com" };
    const conflict = findKeyConflict(existing, newItem);
    expect(conflict).toBeFalsy();
  });

  /** @testId WK-CONF-03 */
  test("no conflict: different key on same domain", () => {
    const newItem = { key: "Z", url: "example.com" };
    const conflict = findKeyConflict(existing, newItem);
    expect(conflict).toBeFalsy();
  });

  /** @testId WK-CONF-04 */
  test("detects conflict: global shortcut (<URL>) conflicts with any domain", () => {
    const newItem = { key: "G", url: "anydomain.com" };
    const conflict = findKeyConflict(existing, newItem);
    expect(conflict).toBeTruthy();
    expect(conflict.id).toBe("3");
  });

  /** @testId WK-CONF-05 */
  test("detects conflict: new global shortcut conflicts with existing site shortcut", () => {
    const newItem = { key: "A", url: "<URL>" };
    const conflict = findKeyConflict(existing, newItem);
    expect(conflict).toBeTruthy();
    expect(conflict.id).toBe("1");
  });

  test("handles normalized URL comparison (strips www and protocol)", () => {
    const newItem = { key: "A", url: "https://www.example.com/page" };
    const conflict = findKeyConflict(existing, newItem);
    expect(conflict).toBeTruthy();
  });
});
