# Extension Permissions and Host Security Boundaries

This document details all declared API permissions, host match patterns, justification maps, code references, and privilege isolation boundaries for z.WebKeyBind.

## Declared Permissions Matrix

| Permission Name | Manifest Reference | API Surface Used | Required Code Paths | Purpose and Privilege Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `storage` | `manifest.json:7` | `chrome.storage.local` | `content.js:97`, `content.js:356`, `popup.js:321`, `popup.js:523`, `import_export.js:95` | Required to store user keybindings, robust element profiles, UI language preferences (`ui_language`), and perform offline persistent caching across sessions. |
| `activeTab` | `manifest.json:8` | `chrome.tabs.query` | `background.js:11`, `popup.js:334`, `popup.js:530`, `popup.js:541` | Grants temporary access to the active browser tab when user opens extension popup or triggers commands to query domain URL and tab ID. |
| `scripting` | `manifest.json:9` | `chrome.scripting.executeScript` | `popup.js:339`, `popup.js:707` | Grants capability to execute inline DOM validation scripts in active tab to verify existence of user-entered element selectors before saving. |
| `tabs` | `manifest.json:10` | `chrome.tabs.create`, `chrome.tabs.connect`, `chrome.tabs.sendMessage` | `background.js:13`, `popup.js:531`, `import_export.js:152` | Enables cross-component message passing, tab connection instantiation, and opening full-tab import management windows (`?importMode=true`). |
| `notifications` | `manifest.json:11` | Browser Notifications API | Reserved / Content Script Fallback | Declared for native OS notification announcements fallback when ARIA live regions or web DOM toast overlays are unavailable. |

---

## Host Permissions and Match Patterns

```json
"host_permissions": [
    "<all_urls>"
]
```

### Match Pattern Analysis
- Pattern: `<all_urls>` (`manifest.json:14`)
- Target Protocols: `http://*/*`, `https://*/*`, `file:///*`
- Injected Content Scripts: `language.js`, `content.js` (`manifest.json:48-58`)
- Execution Mode: `run_at: "document_idle"`
- Rationale: The core purpose of z.WebKeyBind is to allow accessibility users to create custom hotkeys on **any web page** they visit. Restricting host patterns to specific domains would break utility on arbitrary third-party websites.

---

## Web Accessible Resources

```json
"web_accessible_resources": [
    {
        "resources": [
            "index.html",
            "style.css",
            "popup.js",
            "language.js",
            "import_export.js"
        ],
        "matches": [
            "<all_urls>"
        ]
    }
]
```

### Resource Access Analysis
- Declared Resources: `index.html`, `style.css`, `popup.js`, `language.js`, `import_export.js` (`manifest.json:60-72`).
- Match Boundaries: Accessible from web pages matching `<all_urls>`.
- Purpose: Enables `import_export.js:152` to create full-tab import mode windows (`chrome-extension://[id]/index.html?importMode=true`) directly accessible in standard tab context.

---

## Command Keybinding Permissions

```json
"commands": {
    "_execute_action": {
        "suggested_key": {
            "default": "Alt+Shift+Z",
            "mac": "Alt+Shift+Z"
        },
        "description": "Open WebKeyBind Settings"
    }
}
```

- System Shortcut: `Alt+Shift+Z` (`manifest.json:77`).
- Action Target: `_execute_action` opens settings popup or focuses active extension UI window.
- Background Interception: `background.js:4` listens for `chrome.commands.onCommand` triggers.

---

## Security and Privilege Separation Guarantees

1. Network Access Isolation: Extension declares zero network permissions (`fetch`, `XMLHttpRequest`, `webRequest`, `WebSocket`). Data never leaves the browser environment.
2. Minimal Background Surface: Service worker (`background.js`) contains only hotkey routing logic.
3. Content Script Isolation: Injected scripts operate inside WebExtension isolated worlds, shielding internal state from page DOM scripts.
