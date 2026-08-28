# Modifying Automated Tests

This document outlines the procedure to safely modify existing test suites and assertions.

## Rationale for Modification

Tests should be modified only under the following conditions:
1.  **Refactoring Code:** When internal function signatures are updated, requiring corresponding test setups to be updated.
2.  **Updating Requirements:** When user-facing feature behaviors are modified, changing the expected outcomes of assertions.
3.  **Fixing Flaky Tests:** When E2E browser automation timing issues produce intermittent test failures.

---

## Modification Steps

### Step 1: Trace the Impact
Before editing a test, trace its Test Case ID (`WK-xx`) and Requirement ID (`z.WebKeyBind_xx`). Confirm that modifying this test does not break coverage metrics in `coverage-report.json`.

### Step 2: Edit Assertions
*   Make the required changes to the target test file.
*   **Do not change the `WK-xx` tag unless you are splitting one test case into multiple.** Changing these IDs breaks history tracking.
*   If changing logic inside pure helper files, remember to keep inline definitions in sync if the test file uses copied functions.

### Step 3: Local Verification
Run the modified test locally first. Ensure it executes cleanly:
```bash
# Run the specific modified test file
npx jest tests/unit/url-utils.test.js

# Or run the specific Playwright E2E spec
npx playwright test tests/e2e/extension-open.spec.js
```

### Step 4: Run the Quality Check Matrix
Validate the changes against the pipeline check commands:
1.  Run `npm run lint` to verify syntax.
2.  Run `npm run test:coverage-gate` to check if requirement coverage remains complete.

---

## Dealing with Flaky E2E Tests

If a Playwright test fails intermittently due to DOM load delay or action timing:
1.  **Avoid hard timeouts:** Do not use `page.waitForTimeout(3000)`.
2.  **Use locator assertions:** Rely on web-first assertions like `await expect(locator).toBeVisible()` or `await expect(locator).toHaveText()`, which automatically retry for up to 5 seconds.
3.  **State waits:** Wait for specific network idle or DOM load state changes using `await page.waitForLoadState("domcontentloaded")`.
