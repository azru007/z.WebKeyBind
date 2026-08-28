/**
 * Helpers to extract testable functions from vanilla JS source files.
 *
 * Since the extension source files are not modules (no exports), these helpers
 * use Function constructor-free approaches to make functions available in tests.
 * We define the functions inline in test files, matching the source exactly,
 * to avoid eval() and maintain MV3 compliance in test code.
 */

const fs = require("fs");
const path = require("path");

/**
 * Read a source file and return its content as a string.
 * @param {string} filename - Filename relative to project root.
 * @returns {string} File content.
 */
function readSource(filename) {
  return fs.readFileSync(path.resolve(__dirname, "..", "..", filename), "utf-8");
}

/**
 * Check if a source file contains a specific string pattern.
 * @param {string} filename - Filename relative to project root.
 * @param {string} pattern - String to search for.
 * @returns {boolean} True if pattern found.
 */
function sourceContains(filename, pattern) {
  const content = readSource(filename);
  return content.includes(pattern);
}

/**
 * Check if a source file matches a regex pattern.
 * @param {string} filename - Filename relative to project root.
 * @param {RegExp} regex - Regex pattern to test.
 * @returns {boolean} True if regex matches.
 */
function sourceMatches(filename, regex) {
  const content = readSource(filename);
  return regex.test(content);
}

module.exports = {
  readSource,
  sourceContains,
  sourceMatches
};
