# API Reference

This document provides a technical specification for all functions, handlers, and methods implemented across the z.WebKeyBind codebase.

## 1. Background Service Worker Module (`background.js`)

### `sendMessageToActiveTab(actionName)`
- Calling Context: Background Service Worker (`background.js:10`)
- Signature: `function sendMessageToActiveTab(actionName: string): void`
- Description: Queries the active tab in the current window and sends a runtime message containing the specified action name.
- Parameters:
  - `actionName` (string, required): The command string to transmit (e.g., global hotkey action).
- Return Value: `void`
- Thrown Errors: None. Catches promise rejection if content script is not ready (`background.js:14`).
- Side Effects: Sends message via `chrome.tabs.sendMessage`.
- Call Sites: `background.js:6` inside `chrome.commands.onCommand.addListener`.

---

## 2. Content Script Module (`content.js`)

### `announceToScreenReader(message, color)`
- Calling Context: Content Script (`content.js:32`)
- Signature: `function announceToScreenReader(message: string, color?: string): void`
- Description: Triggers a visible toast notification and updates dual ARIA live region announcers alternately to broadcast accessibility voice messages.
- Parameters:
  - `message` (string, required): Announcement message text.
  - `color` (string, optional, default `"default"`): Notification style color token (`"blue"`, `"purple"`, `"orange"`, `"red"`, `"green"`, `"info"`, `"hidden"`, `"modal"`).
- Return Value: `void`
- Thrown Errors: None.
- Side Effects: Mutates DOM node content of `#wkb-announcer-1` or `#wkb-announcer-2`, appends top notification banner.
- Call Sites: `content.js:199`, `content.js:277`, `content.js:290`, `content.js:344`, `content.js:358`, `content.js:384`, `content.js:388`, `content.js:406`, `content.js:521`, `content.js:526`.

### `showNotification(msg, colorType)`
- Calling Context: Content Script (`content.js:53`)
- Signature: `function showNotification(msg: string, colorType: string): void`
- Description: Creates a fixed-position floating toast banner at the top of the webpage with automatic removal after 4000ms.
- Parameters:
  - `msg` (string, required): Message string to display.
  - `colorType` (string, required): Theme color identifier.
- Return Value: `void`
- Thrown Errors: None.
- Side Effects: Appends `#webkeybind-notification` `div` element to `document.body`.
- Call Sites: `content.js:34`.

### `updateShortcutCache()`
- Calling Context: Content Script (`content.js:93`)
- Signature: `function updateShortcutCache(): void`
- Description: Queries `chrome.storage.local` for all stored shortcuts and populates `shortcutCache` filtered by domain matching `window.location.hostname`.
- Parameters: None.
- Return Value: `void`
- Thrown Errors: None. Catches internal storage errors silently.
- Side Effects: Updates in-memory global array `shortcutCache`.
- Call Sites: `content.js:106`, `content.js:110` (inside `chrome.storage.onChanged.addListener`).

### `isInputActive()`
- Calling Context: Content Script (`content.js:117`)
- Signature: `function isInputActive(): boolean`
- Description: Checks whether currently active element is a user editable text field (`input`, `textarea`, `select`, or `contenteditable="true"`).
- Parameters: None.
- Return Value: `boolean` - `true` if active element is an editable input; otherwise `false`.
- Thrown Errors: None.
- Side Effects: Reads `document.activeElement`.
- Call Sites: `content.js:184`, `content.js:189`.

### `updateHighlight(newElement)`
- Calling Context: Content Script (`content.js:218`)
- Signature: `function updateHighlight(newElement: HTMLElement | null): void`
- Description: Removes focus highlight from all previously highlighted DOM elements and applies creation mode outline highlight to `newElement`.
- Parameters:
  - `newElement` (`HTMLElement | null`, required): Target element to highlight.
- Return Value: `void`
- Thrown Errors: None.
- Side Effects: Mutates element CSS style `outline` and dataset properties.
- Call Sites: `content.js:130`, `content.js:139`, `content.js:275`, `content.js:287`.

### `addHighlight(el)`
- Signature: `function addHighlight(el: HTMLElement): void`
- Description: Applies 4px blue solid outline to element, sets `data-webkeybind-highlight="true"`, stores original outline, and sets `role="application"` in creation mode.
- Parameters: `el` (`HTMLElement`, required)
- Return Value: `void`
- Call Sites: `content.js:224`, `content.js:344`.

### `removeHighlight(el)`
- Signature: `function removeHighlight(el: HTMLElement): void`
- Description: Restores original outline styling and original ARIA role attribute on element.
- Parameters: `el` (`HTMLElement`, required)
- Return Value: `void`
- Call Sites: `content.js:220`, `content.js:366`.

### `switchMode(newMode)`
- Signature: `function switchMode(newMode: string | null): void`
- Description: Switches extension global mode between `null` and `'creation'`, updating cursor styles and screen reader announcements.
- Parameters: `newMode` (`string | null`, required)
- Return Value: `void`
- Call Sites: `content.js:162`, `content.js:179`.

### `getClickableTarget(el)`
- Signature: `function getClickableTarget(el: HTMLElement): HTMLElement | null`
- Description: Traverses parent nodes to find the closest interactive element (`button`, `a`, `input`, `select`, `textarea`, `[role="button"]`, etc.).
- Parameters: `el` (`HTMLElement`, required)
- Return Value: `HTMLElement | null`
- Call Sites: `content.js:128`, `content.js:138`, `content.js:145`.

### `saveShortcut(element, key)`
- Signature: `function saveShortcut(element: HTMLElement, key: string): void`
- Description: Computes element profile metadata, checks domain key conflict in storage, and writes `shortcut_[timestamp]` object to `chrome.storage.local`.
- Parameters:
  - `element` (`HTMLElement`, required): Highlighted element.
  - `key` (string, required): Single uppercase alphanumeric key character.
- Return Value: `void`
- Call Sites: `content.js:197`.

### `runCachedShortcut(match)`
- Signature: `function runCachedShortcut(match: Object): void`
- Description: Runs element resolution via healing engine, checks visibility, broadcasts announcement, executes click, and saves healed profile if selector updated.
- Parameters: `match` (Object, required): Shortcut item object.
- Return Value: `void`
- Call Sites: `content.js:209`.

### `executeShortcut(element)`
- Signature: `function executeShortcut(element: HTMLElement): void`
- Description: Sets focus on target element and invokes `.click()`.
- Parameters: `element` (`HTMLElement`, required)
- Return Value: `void`
- Call Sites: `content.js:390`.

### `findElementWithHealing(profile)`
- Signature: `function findElementWithHealing(profile: Object): { element: HTMLElement | null, healed: boolean }`
- Description: Attempts element lookup using hierarchy: unique ID -> href -> testId -> path -> aria-label.
- Parameters: `profile` (Object, required)
- Return Value: `{ element: HTMLElement | null, healed: boolean }`
- Call Sites: `content.js:379`.

### `generateRobustProfile(element)`
- Signature: `function generateRobustProfile(element: HTMLElement): Object`
- Description: Extracts element attributes (`id`, `tag`, `text`, `aria`, `testId`, `href`, `path`) into profile structure.
- Parameters: `element` (`HTMLElement`, required)
- Return Value: `Object` profile metadata object.
- Call Sites: `content.js:307`, `content.js:393`.

### `generateCssPath(el)`
- Signature: `function generateCssPath(el: HTMLElement): string`
- Description: Generates full CSS DOM path string for element using node names and `:nth-of-type()` indexes.
- Parameters: `el` (`HTMLElement`, required)
- Return Value: `string` CSS selector path.
- Call Sites: `content.js:469`.

### `readAllShortcuts()`
- Signature: `function readAllShortcuts(): void`
- Description: Reads all shortcuts saved for current site and speaks summary text via screen reader announcer.
- Parameters: None.
- Return Value: `void`
- Call Sites: `content.js:173`.

---

## 3. UI and Language Module (`language.js` / `popup.js`)

### `isValidURL(string)`
- Calling Context: Shared Utility (`popup.js:4`, `language.js:4`)
- Signature: `function isValidURL(string: string): boolean`
- Description: Validates string against URL structure rules.
- Parameters: `string` (string, required)
- Return Value: `boolean`

### `normalizeUrl(url)`
- Calling Context: Shared Utility (`popup.js:19`, `language.js:19`)
- Signature: `function normalizeUrl(url: string): string`
- Description: Normalizes domain string by stripping protocol, `www.` prefix, and trailing paths.
- Parameters: `url` (string, required)
- Return Value: `string` normalized host.

### `window.updateLanguageUI(lang)`
- Calling Context: Popup UI (`language.js:789`)
- Signature: `function updateLanguageUI(lang: string): void`
- Description: Dynamically updates all text content, labels, and table headers in extension settings UI to target language.
- Parameters: `lang` (string, required): `"English"`, `"हिंदी"`, `"मराठी"`, or `"മലയാളം"`.
- Return Value: `void`

### `showAccessibleAlert(msg, type)`
- Calling Context: Popup UI (`popup.js:81`, `language.js:36`)
- Signature: `function showAccessibleAlert(msg: string, type?: string): void`
- Description: Displays floating bottom alert banner in popup window and triggers voice announcement.
- Parameters:
  - `msg` (string, required): Text message string.
  - `type` (string, optional, default `"error"`): Alert level (`"error"`, `"success"`, `"info"`).
- Return Value: `void`

### `showAccessibleConfirm(msg, onConfirmCallback, onCancelCallback, customYesTxt, customNoTxt)`
- Calling Context: Popup UI (`popup.js:127`, `language.js:84`)
- Signature: `function showAccessibleConfirm(msg: string, onConfirmCallback: Function, onCancelCallback?: Function, customYesTxt?: string, customNoTxt?: string): void`
- Description: Renders modal confirmation overlay dialog with focus trap.
- Return Value: `void`

### `showAddShortcutModal()`
- Calling Context: Popup UI (`popup.js:198`, `language.js:156`)
- Signature: `function showAddShortcutModal(): void`
- Description: Builds and displays modal overlay form for manual shortcut entry.
- Return Value: `void`

### `window.loadShortcuts()`
- Calling Context: Popup UI (`popup.js:550`, `language.js:350`)
- Signature: `function loadShortcuts(): void`
- Description: Fetches items from storage and renders filtered shortcut table rows into `.shortcut-list`.
- Return Value: `void`

---

## 4. Import / Export Module (`import_export.js`)

### `exportShortcuts(exportAll)`
- Calling Context: Popup UI (`import_export.js:93`)
- Signature: `function exportShortcuts(exportAll: boolean): void`
- Description: Downloads JSON file backup containing site shortcuts or all saved shortcuts.
- Parameters: `exportAll` (boolean, required)
- Return Value: `void`

### `showConflictResolutionModal(msg, onReplace, onReplaceAll, onSkip, onSkipAll, onCancel)`
- Calling Context: Import View (`import_export.js:218`)
- Signature: `function showConflictResolutionModal(msg: string, onReplace: Function, onReplaceAll: Function, onSkip: Function, onSkipAll: Function, onCancel: Function): void`
- Description: Displays modal dialogue resolving key conflicts during batch import operations.
- Return Value: `void`

### `processFile(file)`
- Calling Context: Import View (`import_export.js:299`)
- Signature: `function processFile(file: File): void`
- Description: Parses uploaded JSON file and executes sequential storage write process with conflict handling.
- Parameters: `file` (`File`, required)
- Return Value: `void`
