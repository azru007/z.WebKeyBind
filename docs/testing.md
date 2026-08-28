# Automated Testing Specification and CI Strategy

This document outlines the testing strategy, mock framework design, CI pipeline specifications, and automated test checklists for validating z.WebKeyBind.

## Testing Architecture Overview

```
[ Automated Test Suite (Jest / Playwright) ]
       │
       ├── Unit Tests (Jest + jsdom + Chrome Mocks)
       │     ├── Selector Generation Tests (generateCssPath)
       │     ├── URL Normalization Tests (normalizeUrl)
       │     ├── Storage Schema Validation
       │     └── Translation UI String Tests
       │
       ├── Integration Tests (Jest + Chrome Storage Mock)
       │     ├── Shortcut Cache Sync (chrome.storage.onChanged)
       │     ├── Conflict Detection Logic
       │     └── JSON Import/Export Batch Operations
       │
       └── End-to-End Tests (Playwright + Extension Loading)
             ├── In-Page Creation Mode (Alt+Shift+C)
             ├── Shortcut Execution & Healing (Alt+[Key])
             ├── Popup UI Rendering & Modal Focus Traps
             └── Multi-Language UI Updates
```

---

## Mock Infrastructure Specification

To enable headless unit and integration testing outside the extension container, tests require mocks for `chrome.*` APIs.

### Chrome API Mock Definition (`jest.setup.js`)

```javascript
global.chrome = {
  runtime: {
    id: "mock-extension-id",
    lastError: null
  },
  storage: {
    local: {
      _data: {},
      get: jest.fn((keys, callback) => callback(global.chrome.storage.local._data)),
      set: jest.fn((items, callback) => {
        Object.assign(global.chrome.storage.local._data, items);
        if (callback) callback();
      }),
      remove: jest.fn((keys, callback) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        arr.forEach(k => delete global.chrome.storage.local._data[k]);
        if (callback) callback();
      })
    },
    onChanged: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => callback([{ id: 1, url: "https://example.com" }])),
    sendMessage: jest.fn(() => Promise.resolve()),
    connect: jest.fn(() => ({ onMessage: { addListener: jest.fn() } }))
  },
  scripting: {
    executeScript: jest.fn((opts, callback) => callback([{ result: true }]))
  }
};
```

---

## Test Execution Commands

### Unit and Integration Tests (Jest)
```bash
# Run unit tests
npm test

# Run tests with code coverage report
npm test -- --coverage
```

### End-to-End Extension Tests (Playwright)
```bash
# Run Playwright end-to-end suite in headless Chromium
npx playwright test
```

---

## Continuous Integration (CI) Pipeline Matrix

### Required Workflow Jobs (.github/workflows/ci.yml)

1. Linting & Formatting Check:
   - Tool: ESLint / Prettier
   - Check: Code formatting, unused variables, valid JSON schemas.
2. Unit & Integration Test Matrix:
   - Node.js versions: `18.x`, `20.x`
   - Test Command: `npm test -- --coverage`
   - Coverage Gate: Minimum 85% statement coverage.
3. E2E Browser Compatibility Matrix:
   - Google Chrome (Headless Channel)
   - Microsoft Edge (Headless Channel)
   - Mozilla Firefox (Firefox Add-on Loader)

---

## Comprehensive Testable Behavior Checklist

### Content Script Engine (`content.js`)
- [ ] `normalizeUrl()` returns lowercase root hostname stripping `https://`, `http://`, `www.`, and trailing paths (`popup.js:19`).
- [ ] `isValidURL()` correctly validates URL string formats (`popup.js:4`).
- [ ] `isInputActive()` returns `true` when focused element is `input`, `textarea`, `select`, or `contenteditable="true"` (`content.js:117`).
- [ ] `switchMode('creation')` sets `currentMode = 'creation'` and updates `document.body.style.cursor` to `'crosshair'` (`content.js:270`).
- [ ] `switchMode(null)` resets `currentMode = null` and restores `document.body.style.cursor` to `'default'` (`content.js:273`).
- [ ] `addHighlight()` applies `4px solid #2196F3` outline and sets `data-webkeybind-highlight="true"` (`content.js:228`).
- [ ] `removeHighlight()` restores original CSS outline and original ARIA role (`content.js:246`).
- [ ] `generateCssPath()` creates valid CSS selector paths containing tag names and `:nth-of-type()` indexes (`content.js:476`).
- [ ] `generateRobustProfile()` extracts element `id`, `tag`, `text`, `aria`, `testId`, `href`, and `path` into a profile object (`content.js:446`).
- [ ] `findElementWithHealing()` successfully resolves elements using fallback hierarchy (ID -> href -> testId -> path -> aria) when primary path fails (`content.js:416`).
- [ ] `saveShortcut()` blocks duplicate key assignment on same domain and displays red warning outline (`content.js:342`).
- [ ] `saveShortcut()` commits `shortcut_[timestamp]` object to `chrome.storage.local` upon valid keypress (`content.js:356`).
- [ ] `announceToScreenReader()` alternates DOM updates between `#wkb-announcer-1` and `#wkb-announcer-2` (`content.js:43`).

### Settings Popup UI (`popup.js` / `language.js`)
- [ ] `loadShortcuts()` correctly filters displayed rows matching `window.currentSiteHostname` (`popup.js:568`).
- [ ] `showAddShortcutModal()` traps keyboard focus between modal input fields and buttons (`popup.js:379`).
- [ ] Manual shortcut addition validates selector presence via `chrome.scripting.executeScript()` before saving (`popup.js:339`).
- [ ] Save Changes button (`#btn-save-all`) updates existing storage records when row inputs are edited (`popup.js:523`).
- [ ] Delete Shortcuts button (`.btn-delete-all`) triggers `showAccessibleConfirm()` dialog prior to deleting storage keys (`popup.js:748`).
- [ ] `updateLanguageUI()` re-renders all static text nodes in popup matching selected language (`language.js:789`).

### Import / Export Subsystem (`import_export.js`)
- [ ] `exportShortcuts(false)` exports JSON payload containing shortcuts for current domain (`import_export.js:97`).
- [ ] `exportShortcuts(true)` exports JSON payload containing all stored shortcuts (`import_export.js:96`).
- [ ] `processFile()` rejects non-JSON file uploads (`import_export.js:300`).
- [ ] `processFile()` triggers `showConflictResolutionModal()` when uploaded key matches existing domain key (`import_export.js:399`).
- [ ] Clicking `Replace All` in conflict modal overwrites existing key bindings without prompting subsequent conflicts (`import_export.js:394`).
- [ ] Clicking `Skip All` bypasses conflicting import records without storage mutation (`import_export.js:396`).
