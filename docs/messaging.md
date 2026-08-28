# Extension Messaging Protocol

This document specifies all runtime messaging channels, message formats, event targets, port connections, and command dispatch routes in z.WebKeyBind.

## Messaging Topology Overview

```
[ OS Hotkey ] ---> [ Chrome Command API ] ---> [ background.js ]
                                                     |
                                            (chrome.tabs.sendMessage)
                                                     |
                                                     v
                                             [ active tab ]

[ popup.js ] ---- (chrome.tabs.connect) ----> [ content.js ]
              Port Name: "z-webkeybind-popup"
```

---

## Message Types and Payloads

### 1. Command Action Dispatch Message

- Direction: Background Service Worker -> Active Content Script
- Channel: `chrome.tabs.sendMessage` (`background.js:13`)
- Trigger: User presses browser command hotkey mapped in `manifest.json:74`.
- Payload Schema:
```json
{
  "action": "action_command_name"
}
```
- Parameters:
  - `action` (string, required): Command name identifier (excluding `_execute_action`).
- Processing Pattern: Asynchronous runtime message transmission handled by content script listener.

---

## Port Connections (Long-Lived Channels)

### Popup Connection Port

- Direction: Extension Popup -> Content Script
- API: `chrome.tabs.connect` (`popup.js:531`)
- Channel Name: `"z-webkeybind-popup"`
- Code Reference:
```javascript
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) chrome.tabs.connect(tabs[0].id, { name: "z-webkeybind-popup" });
});
```
- Lifecycle: Port is established when popup UI initializes and closes automatically when extension popup is dismissed.
- Purpose: Signals content script that popup settings window is active.

---

## Storage Event Broadcast Channel

While not an explicit messaging API, `chrome.storage.onChanged` operates as a pub/sub event bus across extension components:

| Sender Context | Trigger Action | Event Listener | Receiver Action |
| :--- | :--- | :--- | :--- |
| Content Script | Shortcut recorded (`saveShortcut`) | `content.js:109` | Refreshes `shortcutCache` across all tabs. |
| Popup Script | Manual add / Edit row / Delete | `popup.js:446` | Re-renders UI rows via `loadShortcuts()`. |
| Import Script | Batch JSON restore | `content.js:109`, `popup.js:446` | Synchronizes storage writes across UI and content scripts. |

---

## External Messaging Boundaries

- External Messaging (`chrome.runtime.onMessageExternal`): Not configured. Web pages cannot send messages to extension background scripts.
- Web Page Window Messaging (`window.postMessage`): Not used. Extension content script operates exclusively in WebExtension isolated world context.
