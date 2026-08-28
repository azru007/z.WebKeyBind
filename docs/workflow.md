# User Workflows and Execution Sequences

This document outlines step-by-step sequences, component interaction timelines, state machine transitions, and initialization logic for all primary extension functions.

## End-to-End User Workflows

### 1. In-Page Shortcut Creation (`Alt+Shift+C`)

```
[ User ]           [ Content Script ]         [ Page DOM ]       [ Local Storage ]
   |                        |                      |                    |
   |--- Alt+Shift+C ------->|                      |                    |
   |                        |-- switchMode('creation')                 |
   |                        |-- Set cursor: crosshair                   |
   |                        |-- Announce: "Creation Mode Enabled"       |
   |                        |                      |                    |
   |--- Hover / Tab ------->|                      |                    |
   |                        |-- getClickableTarget()                    |
   |                        |-- addHighlight() --->|                    |
   |                        |   (Outline: 4px)     |                    |
   |                        |                      |                    |
   |--- Press Key 'B' ----->|                      |                    |
   |                        |-- generateRobustProfile()                 |
   |                        |-- Check conflict ------------------------>|
   |                        |-- Save shortcut ------------------------->|
   |                        |-- Outline: Green (#00E676)                |
   |                        |-- Announce: "Saved shortcut Alt B"        |
```

Detailed Step Sequence:
1. User navigates to a target domain (e.g. `example.com`).
2. User presses keyboard hotkey `Alt+Shift+C`.
3. `content.js:154` `keydown` listener intercepts key combination.
4. `content.js:270` `switchMode('creation')` sets `currentMode = 'creation'`, changes cursor to `crosshair`, and broadcasts screen reader announcement.
5. User moves mouse over an element or presses `Tab`.
6. Mouseover (`content.js:125`) or focus (`content.js:135`) event fires.
7. Target element is passed to `getClickableTarget()`, finding nearest matching interactive parent node.
8. `updateHighlight()` clears existing outlines and invokes `addHighlight()`.
9. `addHighlight()` sets `outline: 4px solid #2196F3`, stores dataset values, and sets `role="application"`.
10. User presses an alphanumeric key (e.g., `K`).
11. `content.js:187` verifies key character, calls `saveShortcut(activeHoverElement, 'K')`.
12. `saveShortcut()` calls `generateRobustProfile()`, queries `chrome.storage.local` to evaluate duplicate key conflicts.
13. If conflict exists, element turns red (`#DC3545`) and screen reader announces conflict message.
14. If valid, object is written to `chrome.storage.local` with key `shortcut_[timestamp]`.
15. Outline temporarily turns green (`#00E676`), announcement broadcasts, and blue creation highlight is restored.

---

### 2. In-Page Shortcut Execution (`Alt+[Key]`)

```
[ User ]           [ Content Script ]         [ Page DOM ]       [ Storage Cache ]
   |                        |                      |                    |
   |--- Alt + K ----------->|                      |                    |
   |                        |-- Query shortcutCache ------------------->|
   |                        |   Match found for key 'K'                 |
   |                        |                      |                    |
   |                        |-- findElementWithHealing(profile)         |
   |                        |-- Evaluates: ID -> href -> testId -> path |
   |                        |                      |                    |
   |                        |-- Execute click ---->|                    |
   |                        |   (element.focus(),  |                    |
   |                        |    element.click())  |                    |
   |                        |                      |                    |
   |                        |-- Announce: "Executing shortcut: Submit"  |
```

Detailed Step Sequence:
1. User presses `Alt+K` on an active web page.
2. `content.js:154` intercepts `keydown` event.
3. `content.js:204` checks `shortcutCache` memory array for matching entry where `key === 'K'` and domain matches current host.
4. `runCachedShortcut()` passes saved profile to `findElementWithHealing()`.
5. Healing lookup hierarchy:
   - Check `document.getElementById(profile.id)`.
   - Query link `a[href="..."]`.
   - Query attribute `[data-testid="..."]`.
   - Query stored CSS selector `profile.path`.
   - Query `[aria-label="..."]`.
6. If element exists and is visible (`offsetParent !== null`), `executeShortcut()` triggers `.focus()` and `.click()`.
7. Screen reader broadcasts blue execution notification.
8. If element was healed via fallback path, updated selector profile is saved back to `chrome.storage.local`.

---

### 3. Settings Popup Management and Manual Shortcut Addition

```
[ User ]               [ Popup UI ]         [ Scripting API ]    [ Local Storage ]
   |                        |                      |                    |
   |--- Click Extension --->|                      |                    |
   |    or Alt+Shift+Z      |-- Load index.html    |                    |
   |                        |-- loadShortcuts() ----------------------->|
   |                        |   Render row items                       |
   |                        |                      |                    |
   |--- Add Shortcut ------>|                      |                    |
   |                        |-- Render Modal       |                    |
   |                        |   Enter Name, ID, Key|                    |
   |                        |                      |                    |
   |--- Save Shortcut ----->|                      |                    |
   |                        |-- executeScript() -->|                    |
   |                        |   Validate selector  |                    |
   |                        |                      |                    |
   |                        |-- Save to Storage ----------------------->|
   |                        |-- Reload rows        |                    |
```

Detailed Step Sequence:
1. User opens popup via browser toolbar or `Alt+Shift+Z`.
2. `popup.js:550` `loadShortcuts()` queries `chrome.storage.local.get(null)`.
3. Hostname `window.currentSiteHostname` is extracted from active tab.
4. Shortcuts are filtered by site domain or global state, sorted alphabetically, and rendered as table rows.
5. User clicks `Add Shortcut` (`.btn-add`).
6. `showAddShortcutModal()` displays modal form.
7. User fills Action Name, Element ID/Class, and Key.
8. `btnSave.onclick` validates input completeness and queries storage for key duplication.
9. `chrome.scripting.executeScript` runs selector lookup script against active tab to verify element presence.
10. If selector is valid, shortcut object is committed to `chrome.storage.local`, modal closes, list reloads, and success message is displayed.

---

### 4. JSON Import Workflow with Conflict Resolution

```
[ User ]               [ Import Modal ]       [ File Reader ]     [ Local Storage ]
   |                        |                      |                    |
   |--- Drop JSON File ---->|                      |                    |
   |                        |-- Read file -------->|                    |
   |                        |                      |-- Return Array     |
   |                        |                      |                    |
   |                        |-- Process item [0]                        |
   |                        |-- Conflict detected                       |
   |                        |                      |                    |
   |                        |-- Prompt Resolution Modal                 |
   |                        |   (Replace / Replace All / Skip / Skip All)
   |                        |                      |                    |
   |--- Click Action ------>|                      |                    |
   |                        |-- Apply Action                            |
   |                        |-- Batch write --------------------------->|
   |                        |-- Announce "Shortcuts imported"           |
```

Detailed Step Sequence:
1. User opens hamburger menu in popup and clicks `Import Shortcuts`.
2. Extension opens full-tab mode (`index.html?importMode=true`) or displays import drop zone modal (`import_export.js:145`).
3. User selects or drops a `.json` backup file onto `#drop-zone`.
4. `processFile()` validates `.json` extension and initializes `FileReader`.
5. File content is parsed via `JSON.parse()`. Validated as an array of shortcut items.
6. Storage is queried for existing shortcuts to build conflict map.
7. Loop processes items sequentially:
   - If key conflict exists on domain, `showConflictResolutionModal()` presents options.
   - User selection (`Replace`, `Replace All`, `Skip`, `Skip All`, `Cancel`) updates execution state `globalConflictAction`.
8. Batch changes are collected into `pendingSaves` and `keysToRemove`.
9. `finalizeBatchSave()` executes `chrome.storage.local.remove()` followed by `chrome.storage.local.set()`.
10. UI announces completion and closes window or modal after 2000ms.

---

## State Transition Models

### Global Creation Mode State Machine (`currentMode`)

```
      +-------------------------------------------------------+
      |                                                       |
      v                                                       |
[ NULL (Default) ] --- (Alt+Shift+C) ---> [ CREATION MODE ] ---+
      ^                                          |            (Escape / Alt+Shift+C)
      |                                          |
      +------------ (Save Shortcut) -------------+
```

State Variable: `currentMode` (`content.js:4`)
- Values: `null` (Inactive execution mode), `'creation'` (Active selector recording mode).
- Transitions:
  - `null` -> `'creation'`: Triggered by `Alt+Shift+C` (`content.js:179`) or `switchMode('creation')`. Sets body cursor to `crosshair`, highlights focused target, announces mode enable.
  - `'creation'` -> `null`: Triggered by `Escape` (`content.js:158`), `Alt+Shift+C` toggle, or `switchMode(null)`. Clears element outlines, restores default body cursor, announces mode disable.

---

## Extension Lifecycle Sequences

### Extension Initialization
1. Browser launches or extension is reloaded.
2. Background service worker `background.js` registers command listener (`chrome.commands.onCommand.addListener`).
3. Content scripts `language.js` and `content.js` are injected into web pages at `document_idle`.
4. `content.js` appends ARIA announcers `#wkb-announcer-1` and `#wkb-announcer-2` to DOM.
5. `content.js` calls `updateShortcutCache()`, reading `chrome.storage.local` to populate in-memory `shortcutCache`.
6. Storage listener `chrome.storage.onChanged` is bound to automatically refresh `shortcutCache` on any storage write.

### Extension Shutdown / Context Invalidation
1. Tab navigated or extension disabled.
2. Active event listeners on DOM window terminate automatically.
3. Content script API calls guarded by `chrome.runtime?.id` checks prevent invalidation exception logging.
