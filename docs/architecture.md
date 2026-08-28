# Extension Architecture

This document describes the high-level architecture, process boundaries, communication infrastructure, and security boundaries of the z.WebKeyBind extension.

## High-Level Component Diagram

```
[ User Interaction ]
       |
       +---> [ Extension Popup (index.html / popup.js / import_export.js) ]
       |           |                             |
       |           v                             v
       |    [ chrome.storage.local ] <---> [ Content Scripts ]
       |                                   (language.js + content.js)
       +---> [ Global Hotkeys ]                  |
                   |                             v
                   v                     [ Targeted Web Page DOM ]
            [ Background Service Worker ]
            (background.js)
```

## Manifest Version and Key Declarations

The extension operates under WebExtensions Manifest V3 specification defined in `manifest.json:1-83`.

- Manifest Version: 3 (`manifest.json:2`)
- Extension Version: 1.0.2 (`manifest.json:4`)
- Target Runtime Contexts:
  - Background Service Worker: `background.js` declared under `background.scripts` (`manifest.json:42-47`).
  - Content Script Pipeline: `language.js` followed by `content.js` executed at `document_idle` on `<all_urls>` (`manifest.json:48-58`).
  - Extension Action Popup: `index.html` executing `language.js`, `import_export.js`, and `popup.js` (`manifest.json:22-30`, `index.html:143-145`).
  - Full-Tab Import View: `index.html?importMode=true` created via `chrome.tabs.create()` (`import_export.js:152`).

## Process Model

1. Background Worker Process:
   - File: `background.js`
   - Lifecycle: Event-driven background process. Listens to `chrome.commands.onCommand` hotkey triggers (`background.js:4`).
   - Capabilities: Queries active tab via `chrome.tabs.query` and forwards command actions to content scripts via `chrome.tabs.sendMessage` (`background.js:10-15`).

2. Content Script Injected Process:
   - Files: `language.js`, `content.js`
   - Lifecycle: Automatically injected into all document frames matching `<all_urls>` upon reaching `document_idle`.
   - Capabilities: Direct access to target page DOM, window event listening (`keydown`, `mouseover`, `focus`, `click`), ARIA-live DOM node creation, and `chrome.storage.local` interaction.

3. Extension Popup / Options UI Process:
   - Files: `index.html`, `popup.js`, `import_export.js`, `language.js`, `style.css`
   - Lifecycle: Runs when the user opens the extension action icon or triggers `_execute_action` (`Alt+Shift+Z`). Runs in an isolated extension context.
   - Capabilities: Access to full `chrome.storage.local`, `chrome.scripting.executeScript`, `chrome.tabs`, FileReader API, and JSON serialization.

## Communication Channels

| Channel | Source Context | Target Context | Protocol / API | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| Hotkey Command Dispatch | OS / Browser | Background Service Worker | `chrome.commands.onCommand` | Captures global shortcut `Alt+Shift+Z` (`background.js:4`). |
| Tab Messaging | Background Service Worker | Content Script | `chrome.tabs.sendMessage` | Transmits hotkey actions to active content script (`background.js:13`). |
| Popup Port Connection | Extension Popup | Content Script | `chrome.tabs.connect` | Establishes connection named `z-webkeybind-popup` (`popup.js:531`). |
| Script Injection | Extension Popup | Content Script / Page DOM | `chrome.scripting.executeScript` | Validates element selector existence against active tab (`popup.js:339`, `popup.js:707`). |
| State Synchronization | Popup / Content Script | `chrome.storage.local` | `chrome.storage.onChanged` | Synchronizes shortcut cache across open browser tabs (`content.js:109`, `popup.js:446`). |

## Data Flow for Key User Actions

### 1. In-Page Creation Mode Flow (`Alt+Shift+C`)
1. User presses `Alt+Shift+C` on target web page.
2. `content.js:154` intercepts `keydown` event in window capture phase.
3. `content.js:270` (`switchMode`) toggles `currentMode = 'creation'`, changes cursor to `crosshair`, and announces via screen reader announcer.
4. User hovers or tabs onto DOM element. `content.js:125` or `content.js:135` computes element target via `getClickableTarget()` and applies outline styling (`addHighlight()`).
5. User presses key `A-Z` or `0-9`. `content.js:188` intercepts key event and calls `saveShortcut()`.
6. `saveShortcut()` generates robust profile metadata (`generateRobustProfile()`), checks for key conflicts, and persists `shortcut_[timestamp]` object into `chrome.storage.local`.
7. `chrome.storage.onChanged` fires, triggering `updateShortcutCache()` across all tab content scripts (`content.js:109`).

### 2. Execution Flow (`Alt+[Key]`)
1. User presses `Alt+[Key]` on target web page.
2. `content.js:204` checks `shortcutCache` populated from `chrome.storage.local`.
3. If matching key entry exists for current domain or `<URL>`, `content.js:376` (`runCachedShortcut`) executes healing lookup (`findElementWithHealing()`).
4. If element is located, `executeShortcut()` sets focus and triggers `.click()`. Screen reader announcer broadcasts action name.
5. If selector healed to a new path, updated profile is auto-saved back to `chrome.storage.local` (`content.js:403`).

### 3. Settings Popup & Manual Import Flow
1. User clicks extension popup or presses `Alt+Shift+Z`. `index.html` opens.
2. `popup.js:550` calls `loadShortcuts()`, querying `chrome.storage.local.get(null)` and filtering shortcuts by `window.currentSiteHostname`.
3. User opens Import Modal and drops a `.json` file (`import_export.js:202`).
4. `FileReader` parses payload. `import_export.js:364` iterates items, performing conflict detection against existing storage keys.
5. Batch items are committed to `chrome.storage.local.set()`, triggering storage event update across popups and content scripts.

## Security Model & Privilege Boundaries

- Host Permissions: `<all_urls>` requested in `manifest.json:13-15` allows content script injection and script execution across HTTP/HTTPS domains.
- Storage Isolation: Uses `chrome.storage.local` isolated per extension installation. No remote telemetry or cloud synchronization is configured.
- Execution Safety: Selector lookup uses standard DOM traversal methods (`document.querySelector`, `document.getElementById`). `CSS.escape()` is applied on dynamic IDs and class names to block selector injection vulnerabilities.
- Content Security Policy: Extension UI pages run under standard MV3 CSP restricting inline code evaluation (`eval` or `Function()`).

## Dependency Graph of Internal Modules

```
manifest.json
  |
  +---> background.js (Service Worker)
  |
  +---> Content Script Context ( injected into web pages )
  |       |-- language.js (Global translation dictionaries)
  |       +-- content.js  (Core selection, storage caching, execution engine)
  |
  +---> Popup UI Context ( index.html )
          |-- style.css
          |-- language.js (UI translation and language selector engine)
          |-- import_export.js (JSON parser, file drop, conflict solver)
          +-- popup.js (Shortcut list management, manual addition modal)
```
