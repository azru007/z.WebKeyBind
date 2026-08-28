# Removing Automated Tests

This document describes how to retire, deprecate, or delete obsolete test cases while preserving pipeline requirements.

## Deletion Constraints

> [!WARNING]
> Never delete a test case if it is the **only** test coverage for a baseline requirement (`z.WebKeyBind_01` through `z.WebKeyBind_08`). If you do, the **Coverage Gate Stage** in the CI pipeline will fail, blocking deployment.

---

## Retiring a Test Case

Follow these steps to clean up obsolete tests:

### Step 1: Identify Alternatives
Verify that the target requirement is sufficiently covered by other tests. Check the coverage report:
```bash
node scripts/coverage-gate.js
```
Confirm that after removing the test, the coverage count for that requirement ID is still greater than zero.

### Step 2: Delete Code and Annotations
*   Remove the `test(...)` block containing the obsolete assertion from the test file.
*   Delete the associated `@testId` JSDoc annotation.
*   If the entire test file is no longer needed, delete the file and remove any file references in `jest.config.js` or `playwright.config.js`.

### Step 3: Run the Coverage Gate
Execute the coverage validator locally to verify that the requirements matrix remains fully satisfied:
```bash
npm run test:coverage-gate
```
If the output shows any `uncovered` requirements, you must author replacement tests first before proceeding.
