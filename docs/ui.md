# User Interface and Accessibility Architecture

This document describes all visual UI components, modal overlays, DOM structures, style specifications, keyboard navigation loops, and accessibility features implemented in z.WebKeyBind.

## UI Surfaces Overview

1. Action Popup Window (`index.html`): Main settings card displaying language controls, hamburger import/export menu, default hotkeys summary table, how-to-use guide, dynamic shortcut list table, and footer actions.
2. Injected Web DOM Highlighting: 4px solid blue (`#2196F3`) focus outline applied to web page elements during interactive creation mode (`Alt+Shift+C`).
3. Injected Floating Toast Banners: Fixed top-center notification overlay banners on web pages created via `showNotification()`.
4. Full-Tab Import Management View: Dedicated full-viewport import workspace rendered when `index.html` is opened with `?importMode=true`.

---

## DOM Structure and Component Architecture (`index.html`)

```
div.settings-card
│
├── header.main-header
│   ├── h1.logo (Icon image + #logoText)
│   └── div.header-right
│       ├── div.language-dropdown (#lang-button + #lang-menu)
│       └── div.menu-container (#burger-label + .import-export-dropdown)
│
├── section.section-group (Default Shortcuts Table)
│   └── table.default-table (Action vs Shortcut key pairs)
│
├── div.how-to-use-box (How to Use instruction list)
│   └── ol.how-to-use-list (Keyboard & mouse usage instructions)
│
├── div.selector-info-box (Selector syntax guide for class/ID notation)
│
├── section.section-group (Saved Shortcuts Section)
│   ├── button.btn-add (+ Add Shortcut button)
│   └── div.shortcut-list (Container populated dynamically by popup.js)
│
└── footer.footer
    ├── button.btn-delete-all (Delete Shortcuts button)
    ├── button#btn-save-all (Save Changes button)
    └── div.btn-show-all (Show All Shortcuts toggle)
```

---

## Interactive Event Handlers

| Element / Selector | Event Type | Handler Function | Purpose |
| :--- | :--- | :--- | :--- |
| `#lang-button` | `click` | `language.js:923` | Toggles display of language menu dropdown (`#lang-menu`). |
| `.dropdown-item` | `click`, `keydown` | `language.js:942` | Saves selected `ui_language` to local storage and updates UI text nodes. |
| `#burger-label` | `click` | `import_export.js:45` | Toggles import/export dropdown menu. |
| `#btn-export-site` | `click` | `import_export.js:115` | Triggers JSON file download for current domain shortcuts. |
| `#btn-export-all` | `click` | `import_export.js:119` | Triggers JSON file download for all shortcuts across domains. |
| `#btn-import` | `click` | `import_export.js:145` | Opens import modal or creates full-tab import window (`?importMode=true`). |
| `.btn-add` | `click`, `keydown` | `popup.js:409` | Displays `showAddShortcutModal()` overlay dialog. |
| `.btn-show-all` | `click`, `keydown` | `popup.js:422` | Toggles list filter between site shortcuts and all shortcuts. |
| `#btn-save-all` | `click` | `popup.js:473` | Validates input fields across rows and commits batch edits to local storage. |
| `.btn-delete-all` | `click` | `popup.js:744` | Opens accessible confirmation dialog to clear shortcuts. |
| `.btn-remove` | `click` | `popup.js:731` | Deletes single shortcut row item. |

---

## Accessibility Engine Implementation

### 1. Dual-Toggle ARIA Live Region Announcer
- Content Script Announcers: `#wkb-announcer-1` and `#wkb-announcer-2` (`content.js:13-25`).
- Popup Announcers: `#wkb-popup-announcer-1` and `#wkb-popup-announcer-2` (`popup.js:48-60`).
- Attributes: `aria-live="assertive"`, `aria-atomic="true"`, styled off-screen using clip rectangle CSS (`commonStyles`).
- Mechanism: Alternating text injection between container 1 and container 2 ensures screen reader screen readers announce every message without missing duplicate consecutive alerts.

### 2. Focus Trap Management
- Implemented in:
  - Add Shortcut Modal (`popup.js:379`)
  - Confirmation Modal (`popup.js:179`)
  - Import Modal (`import_export.js:26`, `import_export.js:280`)
  - Global Popup Tab Loop (`popup.js:767`)
- Behavior: Intercepts `Tab` and `Shift+Tab` keypresses, looping focus between the first and last focusable controls inside active modals.

### 3. Screen Reader Role Overrides
- Table Row Transformation: `popup.js:37` sets `role="listitem"` on default shortcuts table rows to force screen readers to read row descriptions without verbose table grid announcements.
- Temporary Creation Mode Role: `content.js:241` sets `role="application"` on highlighted hover targets during creation mode to force screen reader key pass-through.

---

## Theming and Styling Specification (`style.css`)

- Base Layout Width: `800px` fixed popup card width (`style.css:10`).
- Color Tokens:
  - Background: `#f0f2f5` (Page body), `#ffffff` (Card container).
  - Primary Buttons: `#5ce09c` (Add Shortcut button), `#007BFF` (Save button).
  - Danger / Delete Actions: `#ff4d4f` text, `#fff1f0` background, `#DC3545` solid buttons.
  - Creation Mode Highlight Outline: `4px solid #2196F3` (`content.js:233`).
  - Creation Mode Success Outline: `4px solid #00E676` (`content.js:359`).
  - Creation Mode Conflict Outline: `4px solid #DC3545` (`content.js:343`).
