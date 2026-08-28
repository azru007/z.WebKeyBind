# Extension Security Architecture and Risk Model

This document outlines the security architecture, Content Security Policy, input validation boundaries, selector injection safeguards, and threat mitigations for z.WebKeyBind.

## Content Security Policy (CSP)

Operating under WebExtensions Manifest V3, extension pages (`index.html`) inherit Chrome/Edge/Firefox MV3 default Content Security Policies:

```http
script-src 'self'; object-src 'self';
```

- Disallows Remote Code Execution: Inline scripts, `eval()`, `new Function()`, and remote code loading are strictly prohibited.
- Local Resource Isolation: Extension pages only load bundled scripts (`language.js`, `import_export.js`, `popup.js`).

---

## Input Validation and Sanitization Audit

### 1. Element ID Escaping (`CSS.escape`)
- Hazard: Dynamically interpolating user-controlled element IDs or class names into `document.querySelector()` strings allows CSS selector injection attacks.
- Mitigation: Codebase applies `CSS.escape()` across selector generation functions:
  - `content.js:315`: `simpleId = '#' + CSS.escape(profile.id)`
  - `content.js:319`: `CSS.escape(c)` for class list joining
  - `content.js:450`: `CSS.escape(element.id)`
  - `content.js:484`: `CSS.escape(el.id)`
  - `popup.js:398`: `CSS.escape(match.profile.id)`

### 2. InnerHTML vs TextContent Replacement
- Hazard: Assigning untrusted string content to `innerHTML` can introduce Cross-Site Scripting (XSS) or DOM injection vulnerabilities.
- Mitigation: All UI renderers, table row builders, alert popups, and modal managers enforce strict `textContent` and `appendChild()` text node construction:
  - `popup.js:90`: `alertDiv.textContent = msg`
  - `popup.js:153`: `text.textContent = msg`
  - `popup.js:605`: `indexSpan.textContent = index`
  - `language.js:795`: `saveAllBtn.textContent = t.saveChanges`

### 3. File Import Validation
- Hazard: Processing malicious or malformed backup files uploaded by users during JSON import operations.
- Mitigation (`import_export.js:299-313`):
  - Enforces `.json` file extension check (`file.name.endsWith('.json')`).
  - Wraps JSON parsing in `try...catch` block.
  - Verifies parsed output is a valid Javascript `Array` (`Array.isArray(importedData)`).
  - Validates individual item schema fields (`item.id && item.key && item.url`) prior to processing.

---

## Privilege Separation and Threat Mitigations

```
[ Web Page DOM (Untrusted) ]
          |
    (Isolated World Boundary)
          |
          v
[ Content Script (z.WebKeyBind) ]
          |
    (chrome.storage.local)
          |
          v
[ Extension Popup UI (Privileged) ]
```

1. Web Page Isolation: Content scripts run inside isolated worlds. Target web pages cannot intercept content script memory, override extension callbacks, or access `chrome.storage.local`.
2. Zero External Network Requests: Extension declares no network permissions (`fetch`, `XMLHttpRequest`, `webRequest`). Extension storage remains 100% local to the browser client.
3. DOM Injection Guarding: Selector verification scripts injected via `chrome.scripting.executeScript` (`popup.js:339`, `popup.js:707`) execute as read-only selector evaluation checks (`document.querySelector(selector)`), returning boolean presence flags without mutating DOM state.
