# Adding Automated Tests

This document describes how to expand test coverage in the z.WebKeyBind repository.

## Traceability Tagging Requirements

All test suites must be mapped to requirements and individual assertions:
1.  **Requirement Annotation (`@req`):** Every new test file or test group (`describe`) must document the requirement ID it validates using the `@req` tag in a JSDoc block:
    ```javascript
    /**
     * @req z.WebKeyBind_04
     */
    ```
2.  **Test Case ID Annotation (`@testId`):** Every individual test assertion (`test` or `it`) must declare a unique Test Case ID using the `@testId` tag in a JSDoc block:
    ```javascript
    /** @testId WK-HEAL-08 */
    test("heals selector by custom element profile attribute", () => { ... });
    ```
    If these tags are missing, the **Coverage Gate Stage** in the CI pipeline will fail.

---

## 1. Adding Unit Tests

Unit tests are meant for pure logic functions (e.g., helper utilities, selectors, math, string parsing).

1.  Create a file under `tests/unit/` naming it `[feature].test.js`.
2.  Import target functions. Because vanilla source files are not Node modules, you must copy or inline the function matching the source logic inside the test file (see `tests/unit/css-path.test.js` as an example).
3.  Write the test assertions using Jest:
    ```javascript
    /**
     * Unit Tests for Feature X
     * @req z.WebKeyBind_03
     */
    describe("Feature X logic", () => {
      /** @testId WK-FEATX-01 */
      test("should output correct format", () => {
        expect(formatInput("raw")).toBe("[raw]");
      });
    });
    ```
4.  Run unit tests locally: `npm run test:unit`.

---

## 2. Adding Integration Tests

Integration tests cover interaction boundaries like extension storage sync or messaging channels.

1.  Create a file under `tests/integration/` naming it `[flow].test.js`.
2.  Ensure you call `__chromeMock.resetStorage()` and `__chromeMock.resetMockCalls()` in `beforeEach` to prevent state leakage.
3.  Utilize the mock storage API to simulate extension reads and writes:
    ```javascript
    /**
     * @req z.WebKeyBind_04
     */
    describe("Integration Flow", () => {
      beforeEach(() => {
        __chromeMock.resetStorage();
      });

      /** @testId WK-INT-99 */
      test("writes config to storage", (done) => {
        chrome.storage.local.set({ "pref": "value" }, () => {
          chrome.storage.local.get("pref", (res) => {
            expect(res.pref).toBe("value");
            done();
          });
        });
      });
    });
    ```
4.  Run integration tests locally: `npm run test:integration`.

---

## 3. Adding E2E Tests

E2E tests use Playwright to automate actual browser interactions against our test fixtures.

1.  Create a file under `tests/e2e/` naming it `[action].spec.js`.
2.  Use the persistent context helper to launch Chromium with the unpacked extension:
    ```javascript
    const { test, expect } = require("@playwright/test");
    const path = require("path");
    const EXTENSION_PATH = path.resolve(__dirname, "..", "..");

    test.describe("Action E2E", () => {
      /** @testId WK-E2E-99 */
      test("interacts with page elements", async () => {
        const { chromium } = require("@playwright/test");
        const context = await chromium.launchPersistentContext("", {
          headless: false,
          args: [
            "--disable-extensions-except=" + EXTENSION_PATH,
            "--load-extension=" + EXTENSION_PATH,
            "--no-first-run",
            "--disable-gpu"
          ]
        });

        const page = await context.newPage();
        await page.goto("http://localhost:8765/test-page-basic.html");
        
        // Assertions ...
        await expect(page.locator("h1")).toBeVisible();

        await context.close();
      });
    });
    ```
3.  Run E2E tests: `npm run test:e2e`.
