# Build and Release Procedures

This document details packaging workflows, build targets, browser extension store publishing guidelines, versioning practices, and release checklists for z.WebKeyBind.

## Build Requirements and Prerequisites

- Source Files: Pure JavaScript (ES6+), HTML5, CSS3. Zero compilation or transpilation step required.
- External Dependencies: None. The extension is built without external npm runtime dependencies or build bundlers (Webpack, Vite, Rollup).

---

## Store Target Packages and Manifest Customizations

### 1. Chrome Web Store Packaging (Google Chrome / Microsoft Edge)

1. Verify Manifest Target: Ensure `manifest.json` contains Manifest V3 configuration.
2. Verify Background Service Worker: Ensure background script is declared via `"service_worker": "background.js"`.
3. Create Release Zip Archive:
```bash
zip -r z.WebKeyBind-chrome-v1.0.2.zip . -x "*.git*" "docs/*" "node_modules/*" ".DS_Store"
```
4. Upload Artifact: Submit `.zip` bundle to Chrome Web Developer Dashboard and Edge Add-on Developer Dashboard.

### 2. Firefox Add-ons (AMO) Packaging

1. Verify Gecko Settings (`manifest.json:31-41`):
```json
"browser_specific_settings": {
    "gecko": {
        "id": "z-webkeybind@yourdomain.com",
        "strict_min_version": "142.0"
    }
}
```
2. Create Firefox Zip Archive:
```bash
zip -r z.WebKeyBind-firefox-v1.0.2.zip . -x "*.git*" "docs/*" "node_modules/*" ".DS_Store"
```
3. Upload Artifact: Submit `.zip` bundle to Mozilla Add-on Developer Hub (AMO).

---

## Versioning Scheme and Release Verification

The project follows Semantic Versioning (`MAJOR.MINOR.PATCH`):
- `MAJOR`: Breaking changes to storage schemas or permissions.
- `MINOR`: Addition of user-facing features or new localization languages.
- `PATCH`: Bug fixes, selector healing improvements, or accessibility patches.

### Release Pre-Flight Checklist

- [ ] Version number updated in `manifest.json:4` (`"version": "1.0.2"`).
- [ ] Version number updated in documentation (`docs/README.md`, `docs/architecture.md`).
- [ ] Automated tests pass clean: `npm test`.
- [ ] Manual check across target browsers (Chrome, Firefox, Edge).
- [ ] Verify extension loads unpackaged without manifest warnings.
- [ ] Verify JSON import and export backward compatibility.
- [ ] Verify ARIA live screen reader announcements in NVDA / VoiceOver.

---

## Update and Rollback Strategies

1. Automatic Store Updates: Browsers automatically check store manifest endpoints and update installed extensions in background.
2. Storage Safety During Updates: Storage schema changes maintain self-healing fallback handlers (`content.js:416`). Updating extension files does not clear or alter existing user keybindings stored in `chrome.storage.local`.
3. Rollback Procedure: In the event of a severe regression in production, submit a patch release incrementing version (e.g. `1.0.3`) containing restored code. Extension stores do not permit downgrading version strings.
