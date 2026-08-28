# Feature Specifications

This document provides detailed specifications for all end-user and developer features implemented in z.WebKeyBind.

## Feature Matrix Summary

| Feature Name | Entry Point | Dependent Modules | Permissions Required | Storage Keys |
| :--- | :--- | :--- | :--- | :--- |
| Creation Mode | Hotkey `Alt+Shift+C` | `content.js`, `language.js` | `storage` | `shortcut_[timestamp]` |
| Shortcut Execution | Hotkey `Alt+[Key]` | `content.js` | `storage` | `shortcut_[timestamp]` |
| Element Selector Healing | Internal call in execution | `content.js` | `storage` | `shortcut_[timestamp]` |
| Accessibility Voice Announcer | Internal call | `content.js`, `popup.js` | None | `ui_language` |
| Manual Shortcut Builder | Popup Button `btn-add` | `popup.js`, `index.html` | `storage`, `activeTab`, `scripting` | `shortcut_[timestamp]` |
| JSON Backup Import & Export | Popup Menu | `import_export.js`, `popup.js` | `storage`, `tabs` | `shortcut_[timestamp]` |
| Multilingual Localizer | Dropdown `lang-button` | `language.js`, `popup.js` | `storage` | `ui_language` |

---

## Detailed Feature Specifications

### 1. In-Page Creation Mode (`Alt+Shift+C`)
- Purpose: Allows users to interactively record custom single-key shortcuts (`A-Z`, `0-9`) targeting any visible, clickable DOM element without opening the extension settings window.
- Entry Points: Hotkey `Alt+Shift+C` intercepted by window keydown listener (`content.js:176`).
- Dependent Modules: `content.js:125-371`, `language.js:564-785`.
- Permissions Required: `storage`.
- Storage Keys Written: `shortcut_[timestamp]` objects in `chrome.storage.local`.
- Messages Exchanged: None.
- Edge Cases:
  - Text input elements: Hovering over inputs in creation mode allows targeting, but typing in focused text fields bypasses creation hotkeys (`isInputActive()` returns `true`).
  - Frames / Iframes: Injected content script runs independently in frame contexts, allowing in-frame binding.
  - SVG and Shadow DOM: SVG children resolve to parent clickable containers (`getClickableTarget`).
- Failure Modes:
  - If `chrome.runtime.id` is invalidated, `switchMode()` alerts user to refresh the page (`content.js:271`).
  - Attempting to save key bound to another element on the same domain displays a red highlight warning and broadcasts a screen reader conflict notice (`content.js:342`).

---

### 2. Shortcut Execution Engine (`Alt+[Key]`)
- Purpose: Triggers assigned click events on mapped DOM elements instantly when matching key combination is pressed.
- Entry Points: Window keydown listener (`content.js:154`, `content.js:204`).
- Dependent Modules: `content.js:203-212`, `content.js:376-414`.
- Permissions Required: `storage`.
- Storage Keys Read: `shortcut_[timestamp]` objects loaded into `shortcutCache` array (`content.js:93`).
- Messages Exchanged: Action payload sent via `chrome.tabs.sendMessage` from background worker when global commands trigger (`background.js:13`).
- Edge Cases:
  - Input field focus: Shortcut execution is blocked when user is typing inside text inputs, textareas, or `contenteditable` elements unless modifier keys (`Alt` or `Ctrl+Shift`) are pressed.
  - Hidden elements: If element resolved has `offsetParent === null`, execution halts and screen reader announces `"Element is hidden."` (`content.js:383`).
- Failure Modes:
  - Element missing: If element cannot be located by original selector or fallback healing paths, screen reader announces `"Element not found on page."` (`content.js:406`).

---

### 3. Selector Healing Engine
- Purpose: Automatically locates target DOM elements when page updates break saved CSS selector paths.
- Entry Points: Called automatically during `runCachedShortcut()` execution (`content.js:379`).
- Dependent Modules: `content.js:416-506`.
- Permissions Required: `storage`.
- Storage Keys Updated: `shortcut_[timestamp]` object re-saved with updated selector profile upon successful healing (`content.js:403`).
- Messages Exchanged: None.
- Healing Fallback Hierarchy (`content.js:416`):
  1. Unique Element ID (`document.getElementById(profile.id)`).
  2. Anchor Link Href (`a[href="..."]`).
  3. Test ID attribute (`[data-testid="..."]`).
  4. Full CSS selector path (`profile.path`).
  5. ARIA Label attribute (`[aria-label="..."]`).
- Failure Modes: If all 5 criteria return `null`, healing returns `{ element: null, healed: false }`.

---

### 4. Accessibility Screen Reader Voice Engine
- Purpose: Provides instant spoken feedback for screen reader software (NVDA, JAWS, VoiceOver) and visible color-coded toast banners during mode changes, creation, execution, and error events.
- Entry Points: `announceToScreenReader()` in content script (`content.js:32`), `showAccessibleAlert()` in popup script (`popup.js:81`).
- Dependent Modules: `content.js:13-51`, `popup.js:47-83`.
- Permissions Required: None.
- Storage Keys Read: `ui_language`.
- Mechanism: Uses two alternating ARIA live region `div` containers (`#wkb-announcer-1` and `#wkb-announcer-2`) configured with `aria-live="assertive"` and `aria-atomic="true"`. Alternating DOM writes prevents screen readers from missing back-to-back identical message updates.
- Edge Cases: Dynamically updates container `lang` attribute (`en`, `hi`, `mr`, `ml`) matching active user UI language.

---

### 5. Manual Shortcut Builder Modal
- Purpose: Allows manual shortcut creation directly inside extension settings popup by typing action name, DOM ID or class name, and trigger key.
- Entry Points: Button `.btn-add` in popup UI (`popup.js:405`).
- Dependent Modules: `popup.js:198-397`, `index.html:115`.
- Permissions Required: `storage`, `activeTab`, `scripting`.
- Storage Keys Written: `shortcut_[timestamp]`.
- Messages Exchanged: None.
- Script Injection Validation: Calls `chrome.scripting.executeScript()` (`popup.js:339`) to run inline function against active tab DOM to verify element selector presence before allowing save.
- Failure Modes: Displays accessible alert `Element "..." not found on page` if script injection returns `false`.

---

### 6. JSON Backup Import and Export
- Purpose: Enables users to backup site-specific or global shortcuts into formatted JSON files and restore shortcuts across browser installations.
- Entry Points: Hamburger menu items `btn-export-site`, `btn-export-all`, `btn-import` (`import_export.js:5-7`).
- Dependent Modules: `import_export.js:1-425`, `index.html:42-50`.
- Permissions Required: `storage`, `tabs`.
- Storage Keys Read/Written: `shortcut_[timestamp]`.
- Features:
  - File Drop Zone: Drag-and-drop or file upload picker supporting `.json` files (`import_export.js:187`).
  - Conflict Resolver Modal: Sequential batch processing checking key conflicts. Renders dialog with options `Replace`, `Replace All`, `Skip`, `Skip All`, and `Cancel` (`import_export.js:218`).
  - Full-Tab Import Mode: Opens `index.html?importMode=true` in dedicated browser tab for full screen import workflow (`import_export.js:152`).

---

### 7. Multilingual Localizer
- Purpose: Dynamic UI internationalization providing full translation for extension text, instructions, and voice announcements.
- Entry Points: Language dropdown menu `.language-dropdown` (`language.js:917`).
- Dependent Modules: `language.js:564-990`, `popup.js:537-548`.
- Permissions Required: `storage`.
- Storage Keys Read/Written: `ui_language` (values: `"English"`, `"हिंदी"`, `"मराठी"`, `"മലയാളം"`).
- Implementation: `window.updateLanguageUI(lang)` dynamically updates DOM text content (`textContent`), accessibility aria labels, table headings, and instruction list nodes.
