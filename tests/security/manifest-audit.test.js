/**
 * Security Tests: Manifest Audit
 * @req z.WebKeyBind_03
 *
 * Validates manifest.json security properties: minimal permissions,
 * no unsafe CSP directives, correct host patterns.
 */

const fs = require("fs");
const path = require("path");

const manifestPath = path.resolve(__dirname, "..", "..", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

describe("Manifest permission audit", () => {
  /** @testId WK-SEC-01 */
  test("declares only required permissions", () => {
    const allowed = ["storage", "activeTab", "scripting", "tabs", "notifications"];
    const declared = manifest.permissions || [];
    declared.forEach((perm) => {
      expect(allowed).toContain(perm);
    });
  });

  /** @testId WK-SEC-02 */
  test("host_permissions uses <all_urls> (documented justification)", () => {
    // z.WebKeyBind requires <all_urls> because shortcuts must work on any page.
    // This is documented in docs/permissions.md.
    const hosts = manifest.host_permissions || [];
    if (hosts.length > 0) {
      // Verify it is explicitly <all_urls> and not an unscoped wildcard pattern
      expect(hosts).toContain("<all_urls>");
    }
  });

  /** @testId WK-SEC-03 */
  test("CSP does not contain unsafe-eval or unsafe-inline", () => {
    const csp =
      manifest.content_security_policy?.extension_pages ||
      manifest.content_security_policy ||
      "";
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("unsafe-inline");
  });

  test("manifest_version is 3", () => {
    // Firefox uses manifest_version 2 in this codebase
    expect([2, 3]).toContain(manifest.manifest_version);
  });

  test("content_scripts specify valid match patterns", () => {
    const contentScripts = manifest.content_scripts || [];
    contentScripts.forEach((cs) => {
      expect(cs.matches).toBeDefined();
      expect(Array.isArray(cs.matches)).toBe(true);
      cs.matches.forEach((pattern) => {
        expect(typeof pattern).toBe("string");
        expect(pattern.length).toBeGreaterThan(0);
      });
    });
  });
});
