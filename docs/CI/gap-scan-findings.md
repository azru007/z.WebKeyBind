# CI Gap Scan Findings and Code Resolutions

This document records the architectural gaps, duplication issues, and runtime bugs discovered and fixed during the setup of the z.WebKeyBind automated test suite.

---

## 1. Duplicate Initializer Logic in `language.js`

*   **Discovery:** A static analysis scan revealed that the first 563 lines of `language.js` were an accidental exact duplicate of the initialization and popup logic contained in `popup.js`.
*   **Impact:**
    *   **Console Errors:** Because `language.js` is declared as a content script in `manifest.json`, the duplicate code ran on every single page the user visited. Since these web pages do not contain popup DOM elements (like `#addBtn`, `#burger-label`, or `#lang-menu`), the script threw multiple exceptions during page initialization.
    *   **Performance Degradation:** Doubled script parsing overhead in the extension context.
    *   **Event Handling Overwrite:** When the popup opened, the duplicate event handlers in `language.js` registered first, then were overwritten or double-bound by `popup.js`, leading to inconsistent event loops.
*   **Resolution:** Completely stripped the duplicate code blocks (lines 1 to 563) from `language.js`. The file now cleanly declares only translation dictionaries (`window.translations`) and UI language update handlers (`window.updateLanguageUI`), preventing content script exceptions on external sites.

---

## 2. Undefined `loadShortcuts` Reference in `popup.js`

*   **Discovery:** ESLint checks flagged that `popup.js` line 546 made a call to `loadShortcuts()`, but `loadShortcuts` was defined as `window.loadShortcuts = function() { ... }` at line 550.
*   **Impact:** Calling `loadShortcuts()` directly caused a runtime ReferenceError because the local variable did not exist.
*   **Resolution:** Modified the call to `if (window.loadShortcuts) window.loadShortcuts();` at line 546 to ensure correct property scoping.

---

## 3. Lack of JSDOM `CSS.escape` support

*   **Discovery:** Unit tests for `generateCssPath` and `generateRobustProfile` failed in Jest because `jsdom` does not implement the global `CSS` interface (`CSS.escape`).
*   **Resolution:** Added a lightweight, compliant `CSS.escape` polyfill in the Jest test environment setup block to enable robust selector serialization during tests.
