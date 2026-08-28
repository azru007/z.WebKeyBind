# Glossary of Domain Terms

This document provides definitions for technical terms, architectural concepts, and domain jargon used across the z.WebKeyBind codebase and documentation.

## Terminology Inventory

### Accessibility Engine
The internal subsystem (`content.js:12-51`, `popup.js:48-83`) responsible for broadcasting speech announcements to screen readers using dual alternating ARIA live region containers (`#wkb-announcer-1` and `#wkb-announcer-2`).

### Action Popup
The modal HTML user interface (`index.html`) rendered when clicking the extension action icon in the browser toolbar or pressing `Alt+Shift+Z`.

### ARIA Live Region
A dynamic HTML element configured with `aria-live="assertive"` that instructs assistive technologies (screen readers) to immediately announce changes made to its inner text content.

### Content Script
JavaScript files (`language.js`, `content.js`) injected into web pages matching `<all_urls>` that run inside isolated browser contexts with access to the host page DOM.

### Creation Mode
The interactive recording state (`currentMode = 'creation'`) enabled via `Alt+Shift+C` wherein hovering or tabbing to DOM elements highlights them and pressing an alphanumeric key saves a shortcut keybinding.

### Dual-Toggle Announcer
A pattern using two alternating DOM live region elements to ensure back-to-back screen reader voice announcements are not suppressed when consecutive message strings are identical.

### Element Selector Healing
The fallback resolution mechanism (`findElementWithHealing`) that attempts alternative DOM queries (ID, link href, testId, aria-label) when an element's saved primary CSS path no longer exists on the page.

### Focus Trap
An accessibility keyboard handler that intercepts `Tab` key navigation within modal dialogs, looping focus between the first and last interactive controls to prevent focus from escaping behind open overlays.

### Host Permissions
Match patterns declared in `manifest.json` (`<all_urls>`) granting extension content scripts permission to execute across web domains.

### Isolated World
A browser security boundary ensuring content scripts operate in isolated execution environments separate from host web page scripts, preventing web scripts from reading extension memory or APIs.

### Robust Profile
A JSON metadata structure stored alongside keybindings (`shortcut_[timestamp].profile`) containing element attributes (ID, tag, text, aria-label, testId, href, CSS path) used to heal broken element selectors.

### Service Worker
The background script (`background.js`) running in an isolated event-driven background process responsible for intercepting hotkey commands and dispatching messages.

### Shortcut Cache
An in-memory array (`shortcutCache` in `content.js:8`) loaded from `chrome.storage.local` that stores site keybindings synchronously to eliminate storage query latency when keys are pressed.
