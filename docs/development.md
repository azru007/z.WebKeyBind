# Developer Guide and Local Workflow

This document provides instructions for local extension development, context-specific debugging techniques, reloading workflows, and code style rules.

## Local Environment Setup

1. Repository Checkout:
   ```bash
   git clone https://github.com/yourdomain/z.WebKeyBind.git
   cd z.WebKeyBind
   ```
2. Dependency Installation (Testing Tools):
   ```bash
   npm install
   ```

---

## Loading Unpackaged Extension in Browsers

### Google Chrome & Microsoft Edge
1. Navigate to `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
2. Enable the **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `z.WebKeyBind` project root directory.

### Mozilla Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` inside the project root directory.

---

## Context-Specific Debugging Instructions

Because browser extensions operate across isolated execution contexts, debugging requires selecting the correct DevTools window for each context:

### 1. Debugging Content Scripts (`content.js`, `language.js`)
- Context: Injected directly into host web pages.
- Accessing DevTools: Open Chrome DevTools on target webpage (`F12` or `Ctrl+Shift+I`).
- Console Messages: Log statements printed by `content.js` appear in the web page's primary Console tab.
- Frame Selection: If debugging iframe injection, select target frame context from top-left drop-down in Console tab.

### 2. Debugging Extension Popup (`popup.js`, `import_export.js`)
- Context: Popup window UI (`index.html`).
- Accessing DevTools: Right-click inside open extension popup card and select **Inspect**.
- Console Messages: Log statements printed by `popup.js` appear in dedicated popup DevTools window.
- Breakpoints: Navigate to Sources tab -> `popup.js` to set breakpoints.

### 3. Debugging Background Service Worker (`background.js`)
- Context: Event-driven background process.
- Accessing DevTools: Navigate to `chrome://extensions`, locate **z.WebKeyBind**, and click **Inspect views: service worker**.
- Console Messages: Logs printed by `background.js` appear in background DevTools console.

---

## Live Reloading and Reload Protocol

- Extension Code Reload: When modifying `background.js` or `manifest.json`, click the refresh icon on the extension card in `chrome://extensions`.
- Content Script Reload: After reloading extension, refresh active browser tab (`F5` or `Ctrl+R`) to re-inject updated `content.js`.
- Popup Reload: Re-opening popup UI automatically reloads `popup.js` and `index.html`.

---

## Code Style and Formatting Rules

1. Indentation: 4 spaces per indent level.
2. Variable Declaration: Use `const` by default; use `let` when reassignment is required. Avoid `var`.
3. String Concatenation: Prefer template literals (`` `text ${var}` ``).
4. Asynchronous Code: Prefer Promises and `async/await` syntax over deep callback nesting.
5. DOM Mutation Safety: Use `textContent` for string injection; avoid `innerHTML` when handling dynamic data.
6. Selector Safety: Always wrap dynamic IDs and class names with `CSS.escape()` before evaluating selectors.
