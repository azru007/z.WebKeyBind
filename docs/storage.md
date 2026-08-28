# Storage Architecture and Data Schemas

This document defines the storage architecture, data schemas, key naming conventions, concurrency guarantees, and migration patterns for z.WebKeyBind.

## Storage Engines Used

- Primary Engine: `chrome.storage.local`
- Secondary Engine: In-memory runtime cache (`shortcutCache` in `content.js:8`)
- Scope: Extension instance storage, persistent across browser restarts, isolated per browser profile.

---

## Storage Key Inventory

| Key Pattern / Name | Data Type | Writer Modules | Reader Modules | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `shortcut_[timestamp]` | Object | `content.js:356`, `popup.js:365`, `import_export.js:346` | `content.js:97`, `popup.js:563`, `import_export.js:95` | Stores individual shortcut binding object for a target domain. Key suffix is a unique string timestamp (e.g. `shortcut_1724838400123`). |
| `ui_language` | String | `language.js:944` | `content.js:324`, `popup.js:537`, `language.js:337` | Stores user's preferred UI language identifier (`"English"`, `"हिंदी"`, `"मराठी"`, `"മലയാളം"`). |

---

## Detailed Data Schemas

### 1. Shortcut Record Schema (`shortcut_[timestamp]`)

```json
{
  "id": "1724838400123",
  "url": "example.com",
  "name": "Submit Form",
  "elementId": "#submit-button",
  "key": "S",
  "profile": {
    "id": "submit-button",
    "tag": "button",
    "text": "Submit Form Now",
    "aria": "Submit Form Data",
    "testId": "btn-submit-main",
    "href": null,
    "path": "html > body > div#app > form > button#submit-button"
  }
}
```

Field Specifications:
- `id` (string, required): Unique timestamp string generated via `Date.now().toString() + Math.random().toString(36).substring(2, 6)`.
- `url` (string, required): Target hostname extracted via `window.location.hostname` or normalized URL string. Special value `"<URL>"` denotes a global fallback shortcut matching any domain.
- `name` (string, required): Human-readable descriptive action label used in UI list rows and screen reader audio announcements.
- `elementId` (string, required): Primary selector used for DOM lookups (e.g. `#id`, `.class`, `[data-testid="..."]`).
- `key` (string, required): Single uppercase alphanumeric trigger character `[A-Z0-9]`.
- `profile` (object, required): Robust profile structure used by the selector healing engine (`findElementWithHealing`).
  - `profile.id` (`string | null`): Element `id` attribute if unique on document.
  - `profile.tag` (string): Lowercase tag name (e.g. `button`, `a`, `input`).
  - `profile.text` (`string | null`): First 50 characters of trimmed element `innerText`.
  - `profile.aria` (`string | null`): `aria-label` attribute value.
  - `profile.testId` (`string | null`): `data-testid` attribute value.
  - `profile.href` (`string | null`): `href` attribute value if element or ancestor is an anchor link (`<a>`).
  - `profile.path` (string): Fully qualified CSS selector path generated via `generateCssPath()`.

### 2. UI Language Preference Schema (`ui_language`)

```json
"ui_language": "English"
```

Allowed Values: `"English"`, `"हिंदी"`, `"मराठी"`, `"മലയാളം"`.

---

## Read, Write, and Cache Consistency Patterns

```
   [ Action: Save / Delete Shortcut ]
                 |
                 v
     [ chrome.storage.local.set() ]
                 |
                 +---- (Fires chrome.storage.onChanged) ----+
                 |                                          |
                 v                                          v
      [ Popup UI re-renders ]                  [ Content Scripts ]
      (loadShortcuts())                        (updateShortcutCache())
                                               Refreshes in-memory shortcutCache
```

1. Atomic Writes: Shortcut additions, modifications, and deletions write directly to `chrome.storage.local` using object key namespaces (`shortcut_[id]`).
2. Reactive Storage Synchronization:
   - Content Scripts listen for `chrome.storage.onChanged` (`content.js:109`). Any change to `local` storage triggers `updateShortcutCache()`, updating `shortcutCache` across all open tabs instantly.
   - Extension Popup listens for `chrome.storage.onChanged` (`popup.js:446`). Any write to keys starting with `shortcut_` triggers `window.loadShortcuts()`, refreshing the list table.
3. Cache Isolation: Content scripts execute execution key lookups against `shortcutCache` synchronously on keypress, eliminating asynchronous storage latency during shortcut execution.

---

## Database Versioning and Migration Strategy

- Current Schema Version: 1.0.2
- Migration Protocol:
  - Backward Compatibility: `findElementWithHealing()` checks whether `match.profile` exists. If an legacy shortcut record lacks `profile`, it falls back to raw selector lookup via `findElementBySelector(match.elementId)`.
  - Self-Healing Migration: When a legacy shortcut record without profile succeeds in finding an element, `runCachedShortcut()` constructs a new profile and saves updated object back to `chrome.storage.local` automatically (`content.js:393-404`).
