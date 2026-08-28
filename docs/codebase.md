# Codebase Map and Module Guide

This document provides a comprehensive structural inventory of all files, modules, function signatures, constants, data structures, and error-handling patterns within the z.WebKeyBind repository.

## Repository File Tree

```
z.WebKeyBind/
├── manifest.json         # Extension Manifest V3 configuration and permission declarations
├── background.js        # Background service worker hotkey event listener and tab message dispatcher
├── content.js           # Content script for DOM highlighting, shortcut recording, healing, and execution
├── language.js          # Global translation strings dictionary, UI translation engine, and language dropdown logic
├── popup.js             # Extension settings popup management, shortcut list UI renderer, manual shortcut modal
├── import_export.js     # JSON file import/export handler, drag-and-drop parser, and conflict resolution modal
├── index.html           # Primary HTML document for extension settings popup and full-tab import view
├── style.css            # Stylesheet containing layout grid, responsive elements, modals, and accessibility focus styles
├── README.md            # User-facing summary and overview documentation
└── icons/               # Extension icons directory
    ├── icon-16.png      # 16x16 icon asset
    ├── icon-32.png      # 32x32 icon asset
    ├── icon-48.png      # 48x48 icon asset
    ├── icon-128.png     # 128x128 icon asset
    ├── icon-512.png     # 512x512 icon asset
    └── logo.png         # Main application logo asset
```

## Module Breakdown

### 1. `manifest.json`
- Purpose: Defines extension metadata, permissions (`storage`, `activeTab`, `scripting`, `tabs`, `notifications`), host permissions (`<all_urls>`), background service worker scripts, content script match rules, web-accessible resources, and browser action commands.
- Key Reference: `manifest.json:1-83`

### 2. `background.js`
- Context: Service worker / background process.
- Purpose: Listens to browser hotkey events (`chrome.commands.onCommand`) and forwards commands to the currently active tab.
- Key Reference: `background.js:1-16`

### 3. `content.js`
- Context: Content script injected into target web pages.
- Purpose: Manages state for creation mode, intercepts keyboard and mouse events, highlights hover target DOM elements, builds robust element selector profiles, persists shortcut keybindings to local storage, maintains an in-memory shortcut cache, performs selector healing when DOM structures change, triggers DOM clicks on shortcut invocation, and announces events via dual ARIA live regions.
- Key Reference: `content.js:1-529`

### 4. `language.js`
- Context: Included in content scripts (`manifest.json:54`) and popup page (`index.html:143`).
- Purpose: Defines the global `window.translations` object containing UI strings for English, Hindi (हिंदी), Marathi (मराठी), and Malayalam (മലയാളം). Implements `window.updateLanguageUI(lang)` to dynamically update DOM text nodes and aria-labels across popup components. Manages language dropdown click and keyboard accessibility events.
- Key Reference: `language.js:1-990`

### 5. `popup.js`
- Context: Popup UI page script (`index.html:145`).
- Purpose: Renders saved shortcuts list filtered by current site or globally, builds manual shortcut modal (`showAddShortcutModal`), validates CSS selectors via `chrome.scripting.executeScript`, manages row deletion and bulk deletion, provides accessibility alerts (`showAccessibleAlert`), accessible confirm dialogs (`showAccessibleConfirm`), and manages keyboard focus loops.
- Key Reference: `popup.js:1-798`

### 6. `import_export.js`
- Context: Popup UI and full-tab import page script (`index.html:144`).
- Purpose: Exports current site shortcuts or all shortcuts as JSON file downloads. Handles JSON drag-and-drop and file input loading. Implements batch processing with step-by-step conflict resolution modal (`showConflictResolutionModal`) offering Replace, Replace All, Skip, Skip All, and Cancel options. Manages full-tab import mode window setup (`?importMode=true`).
- Key Reference: `import_export.js:1-425`

### 7. `index.html`
- Context: Extension Action Popup and full-tab window.
- Purpose: Contains markup for extension header, language selector dropdown, hamburger menu, default shortcuts summary table, how-to-use guide, dynamic shortcut list container, footer actions, and import drop-zone overlay modal.
- Key Reference: `index.html:1-148`

### 8. `style.css`
- Context: Stylesheet loaded by `index.html`.
- Purpose: CSS definitions for standard 800px extension width layout, CSS grid shortcut rows, drop zone area, responsive animations (`popup-fadein`, `modal-fadein`), modal overlays, focus states, and custom accessibility outlines.
- Key Reference: `style.css:1-625`

## Global and Exported API Surface

| Identifier | Context | File Reference | Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `window.translations` | Shared | `language.js:564` | Object | Multilingual translation dictionary structured by language key. |
| `window.currentLang` | Popup / Content | `language.js:787` | String | Active language identifier (default `"English"`). |
| `window.updateLanguageUI` | Popup | `language.js:789` | Function | Re-renders all popup static text nodes to match selected language. |
| `window.loadShortcuts` | Popup | `popup.js:550` | Function | Queries storage and renders matching shortcut rows in UI. |
| `window.showAccessibleAlert` | Popup | `popup.js:81` | Function | Displays accessible floating notification and triggers screen reader announcer. |
| `window.showAccessibleConfirm` | Popup | `popup.js:127` | Function | Displays accessible modal confirmation dialog with focus trap. |
| `window.currentSiteHostname` | Popup | `popup.js:534` | String | Extracted hostname of currently active tab. |

## Internal Function Signatures and Specifications

### Background Script (`background.js`)

#### `sendMessageToActiveTab(actionName)`
- Signature: `function sendMessageToActiveTab(actionName: string): void`
- Purpose: Queries current active tab in focused window and dispatches runtime message payload `{ action: actionName }`.
- Parameters: `actionName` (string, required) - Command identifier to send.
- Return Value: None.
- Side Effects: Sends runtime tab message via `chrome.tabs.sendMessage`.
- File: `background.js:10-16`

### Content Script (`content.js`)

#### `announceToScreenReader(message, color)`
- Signature: `function announceToScreenReader(message: string, color?: string): void`
- Purpose: Triggers visible toast notification and updates dual ARIA live region announcers (`#wkb-announcer-1`, `#wkb-announcer-2`) alternately to force screen reader broadcast.
- Parameters:
  - `message` (string, required) - Announcement text.
  - `color` (string, optional, default `"default"`) - Notification theme (`"blue"`, `"purple"`, `"orange"`, `"red"`, `"green"`, `"info"`, `"hidden"`, `"modal"`).
- Return Value: None.
- Side Effects: DOM mutations on announcer textContent and body toast element.
- File: `content.js:32-51`

#### `showNotification(msg, colorType)`
- Signature: `function showNotification(msg: string, colorType: string): void`
- Purpose: Creates fixed-position top notification banner with automatic fadeout timeout of 4000ms.
- File: `content.js:53-88`

#### `updateShortcutCache()`
- Signature: `function updateShortcutCache(): void`
- Purpose: Reads all shortcuts from `chrome.storage.local` and updates in-memory array `shortcutCache` filtered by hostname matching current `window.location.hostname`.
- File: `content.js:93-104`

#### `isInputActive()`
- Signature: `function isInputActive(): boolean`
- Purpose: Evaluates if `document.activeElement` is an active text input, textarea, select, or `contenteditable` element.
- File: `content.js:117-123`

#### `updateHighlight(newElement)`
- Signature: `function updateHighlight(newElement: HTMLElement | null): void`
- Purpose: Removes existing outline highlight from previously targeted elements and applies focus highlight to `newElement`.
- File: `content.js:218-226`

#### `addHighlight(el)`
- Signature: `function addHighlight(el: HTMLElement): void`
- Purpose: Sets `outline: 4px solid #2196F3`, sets `data-webkeybind-highlight="true"`, stores original outline in dataset, and temporarily sets `role="application"` in creation mode.
- File: `content.js:228-244`

#### `removeHighlight(el)`
- Signature: `function removeHighlight(el: HTMLElement): void`
- Purpose: Restores original outline and original ARIA role on target DOM element.
- File: `content.js:246-265`

#### `switchMode(newMode)`
- Signature: `function switchMode(newMode: string | null): void`
- Purpose: Toggles global extension mode between `null` (normal) and `'creation'` (shortcut recording mode).
- File: `content.js:270-293`

#### `getClickableTarget(el)`
- Signature: `function getClickableTarget(el: HTMLElement): HTMLElement | null`
- Purpose: Traverses DOM tree upwards to find nearest interactive or clickable container (`button`, `a`, `input`, `select`, `textarea`, `[role="button"]`, etc.).
- File: `content.js:295-299`

#### `saveShortcut(element, key)`
- Signature: `function saveShortcut(element: HTMLElement, key: string): void`
- Purpose: Generates robust profile for element, checks key conflict against current domain shortcuts in local storage, and saves `shortcut_[timestamp]` object into `chrome.storage.local`.
- File: `content.js:304-371`

#### `runCachedShortcut(match)`
- Signature: `function runCachedShortcut(match: Object): void`
- Purpose: Attempts element resolution via `findElementWithHealing()`, verifies element visibility (`offsetParent`), announces execution, clicks element, and persists healed profile if selector updated.
- File: `content.js:376-408`

#### `executeShortcut(element)`
- Signature: `function executeShortcut(element: HTMLElement): void`
- Purpose: Focuses target element and invokes `.click()`.
- File: `content.js:410-414`

#### `findElementWithHealing(profile)`
- Signature: `function findElementWithHealing(profile: Object): { element: HTMLElement | null, healed: boolean }`
- Purpose: Evaluates element resolution in priority order: exact ID, link `href`, `data-testid`, CSS path, and `aria-label`. Returns resolved element and `healed` boolean status.
- File: `content.js:416-443`

#### `generateRobustProfile(element)`
- Signature: `function generateRobustProfile(element: HTMLElement): Object`
- Purpose: Extracts element attributes (`id`, `tag`, `text`, `aria`, `testId`, `href`, `path`) into a standardized profile object.
- File: `content.js:446-471`

#### `generateCssPath(el)`
- Signature: `function generateCssPath(el: HTMLElement): string`
- Purpose: Generates unique CSS selector path from element root down to target node using tag names and `:nth-of-type()` indexes.
- File: `content.js:476-506`

#### `readAllShortcuts()`
- Signature: `function readAllShortcuts(): void`
- Purpose: Fetches saved shortcuts for current host and formats a combined audio announcement string describing assigned keys.
- File: `content.js:511-528`

### Popup Script (`popup.js`)

#### `isValidURL(string)`
- Signature: `function isValidURL(string: string): boolean`
- Purpose: Validates string format against standard URL parsing rules.
- File: `popup.js:4-17`

#### `normalizeUrl(url)`
- Signature: `function normalizeUrl(url: string): string`
- Purpose: Strips protocol (`http://`, `https://`), `www.` prefix, and path segments to return clean lowercase hostname root.
- File: `popup.js:19-21`

#### `showAddShortcutModal()`
- Signature: `function showAddShortcutModal(): void`
- Purpose: Constructs DOM overlay dialog for manual shortcut entry with inputs for URL, Action Name, Element ID/Class, and Trigger Key.
- File: `popup.js:198-397`

#### `createRow(data, index)`
- Signature: `function createRow(data: Object, index: number): void`
- Purpose: Generates DOM table row entry for shortcut item with editable inputs, live validation handlers, script execution element presence checks, and deletion buttons.
- File: `popup.js:589-742`

### Import/Export Script (`import_export.js`)

#### `exportShortcuts(exportAll)`
- Signature: `function exportShortcuts(exportAll: boolean): void`
- Purpose: Filters local storage entries by current site or all sites, formats JSON blob, and triggers browser file download.
- File: `import_export.js:93-112`

#### `showConflictResolutionModal(...)`
- Signature: `function showConflictResolutionModal(msg, onReplace, onReplaceAll, onSkip, onSkipAll, onCancel): void`
- Purpose: Renders modal popup offering conflict options during batch JSON importing with keyboard focus trap.
- File: `import_export.js:218-297`

#### `processFile(file)`
- Signature: `function processFile(file: File): void`
- Purpose: Reads uploaded JSON file, parses array schema, verifies item fields (`id`, `key`, `url`), executes sequential batch processing, handles conflict resolution actions, and commits writes to `chrome.storage.local`.
- File: `import_export.js:299-424`

## Data Structures and Schema Definitions

### Shortcut Storage Object Schema
```javascript
{
  "id": "1724838400123",              // Unique string timestamp identifier
  "url": "example.com",               // Targeted hostname or "<URL>"
  "name": "Submit Form",              // Human-readable action label
  "elementId": "#submit-button",      // CSS selector or element query string
  "key": "S",                         // Single uppercase alphanumeric character [A-Z0-9]
  "profile": {                        // Robust profile object for healing
    "id": "submit-button",            // Element ID attribute (null if missing or not unique)
    "tag": "button",                  // HTML tag name in lowercase
    "text": "Submit Now",             // Truncated inner text (first 50 chars)
    "aria": "Submit Form Data",       // aria-label attribute value
    "testId": "btn-submit-main",      // data-testid attribute value
    "href": null,                     // Link href attribute value
    "path": "html > body > form > button#submit-button" // CSS DOM path
  }
}
```

## Error Handling Conventions

1. Browser Extension API Guarding: Wrapped in `try...catch` blocks and runtime availability checks (`if (chrome?.storage?.local)`, `if (!chrome.runtime?.id)`).
2. Runtime Error Interception: Uses `chrome.runtime.lastError` checking inside API callbacks to suppress extension context invalidation crashes.
3. DOM Query Resilience: `findElementBySelector` and `findElementWithHealing` wrap query operations in `try...catch` blocks to prevent syntax crash exceptions when processing invalid CSS selectors.
4. User Notification on Failure: Visual toast alerts (`showNotification` / `showAccessibleAlert`) present descriptive error text directly to the user when element queries fail or required inputs are empty.
