/**
 * Security Tests: No Dynamic Code Execution
 *
 * Static scan of all extension JS source files for eval(), Function(),
 * setTimeout(string), and setInterval(string) patterns that violate MV3 CSP.
 */

const { sourceMatches, readSource } = require("../setup/test-helpers");

const sourceFiles = [
  "background.js",
  "content.js",
  "popup.js",
  "import_export.js",
  "language.js"
];

describe("No dynamic code execution in source files", () => {
  /** @testId WK-SEC-04 */
  sourceFiles.forEach((file) => {
    test(file + " does not use eval()", () => {
      // Match eval( but not in comments
      const content = readSource(file);
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        const evalMatch = /\beval\s*\(/.test(trimmed);
        if (evalMatch) {
          throw new Error(
            file + ":" + (idx + 1) + " contains eval(): " + trimmed
          );
        }
      });
    });

    test(file + " does not use new Function()", () => {
      const content = readSource(file);
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        if (/new\s+Function\s*\(/.test(trimmed)) {
          throw new Error(
            file + ":" + (idx + 1) + " contains new Function(): " + trimmed
          );
        }
      });
    });

    test(file + " does not use setTimeout with string argument", () => {
      const content = readSource(file);
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        // Match setTimeout("string" or setTimeout('string'
        if (/setTimeout\s*\(\s*["']/.test(trimmed)) {
          throw new Error(
            file +
              ":" +
              (idx + 1) +
              " contains setTimeout with string: " +
              trimmed
          );
        }
      });
    });

    test(file + " does not use setInterval with string argument", () => {
      const content = readSource(file);
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        if (/setInterval\s*\(\s*["']/.test(trimmed)) {
          throw new Error(
            file +
              ":" +
              (idx + 1) +
              " contains setInterval with string: " +
              trimmed
          );
        }
      });
    });
  });
});
