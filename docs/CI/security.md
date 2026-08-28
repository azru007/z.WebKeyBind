# Security Test Specifications

This document outlines the security boundaries, vulnerability controls, and static checks configured to enforce Extension Manifest V3 security compliance in the z.WebKeyBind repository.

---

## 1. Content Security Policy (CSP) Boundaries

*   **Rule:** z.WebKeyBind must not allow dynamic execution of scripts or remote sources.
*   **Verification:** `tests/security/manifest-audit.test.js` audits `manifest.json`. It flags any extension CSP containing `unsafe-eval` or `unsafe-inline`.
*   **Source Audits:** `tests/security/no-eval.test.js` scans all source files (`background.js`, `content.js`, `popup.js`, `import_export.js`, `language.js`) to reject any use of:
    *   `eval()`
    *   `new Function()`
    *   `setTimeout` with a string argument (e.g. `setTimeout("code()", 100)`)
    *   `setInterval` with a string argument

---

## 2. Manifest Privilege Minimization

*   **Rule:** Declared permissions must map exactly to required interfaces.
*   **Verification:** `tests/security/manifest-audit.test.js` verifies that the `permissions` list contains only `storage`, `activeTab`, `scripting`, `tabs`, and `notifications`. No other privileges may be declared.
*   **Wildcard Host Pattern:** While host permissions utilize `<all_urls>`, this is documented as necessary since WebKeyBind must execute on any page to bind user-configured keyboard shortcuts.

---

## 3. Data Import Sanitization

*   **Rule:** Importing a configuration file must not execute malicious code payload tags embedded in JSON fields.
*   **Verification:** `tests/security/import-safety.test.js` inputs malicious XSS payloads (e.g. `<script>`, `onerror`, and `javascript:`) in `name`/`url`/`elementId` fields:
    *   Verifies that values remain parsed strictly as text strings.
    *   Verifies that DOM nodes are built using `document.createTextNode` and `.textContent` rather than `.innerHTML` or `.innerText` which could cause DOM-based XSS execution.
*   **Denial of Service (DoS) Prevention:** Verifies that importing oversized JSON arrays (e.g. 10,000 shortcuts) is parsed cleanly without crashing the browser extension thread.
