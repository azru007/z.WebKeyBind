# Manual-Only Verification Specifications

This document outlines the testing boundaries that cannot be covered by the automated CI pipeline and requires manual verification.

---

## 1. Safari WebExtension Compatibility

*   **Boundary:** Playwright does not support the automation of Safari Extension pages. Testing in webkit runs basic mock layouts but cannot test native WebExtension APIs in macOS/Safari.
*   **Requirement Target:** `z.WebKeyBind_01` (Safari Compatibility)
*   **Manual Verification Procedure:**
    1.  Compile the extension into a Safari Web App extension bundle using the Apple `xcrun safari-web-ext converter` utility.
    2.  Open Safari Preferences and enable "Allow Unsigned Extensions" in the Develop menu.
    3.  Launch the WebKeyBind extension wrapper in macOS.
    4.  Verify that the extension action button renders and the configuration popup displays and responds correctly.

---

## 2. Screen Reader Audio Feedback

*   **Boundary:** CI systems can verify that the ARIA announcer DOM nodes update with correct text, `aria-live="assertive"`, and `lang` properties. However, verifying that the text is correctly processed and announced as speech depends on local screen reader engines (NVDA, JAWS, VoiceOver, Narrator, or Orca).
*   **Requirement Target:** `z.WebKeyBind_08` (Dual-Toggle Audio Engine)
*   **Manual Verification Procedure:**
    1.  Start NVDA (Windows) or VoiceOver (macOS).
    2.  Enable Creation Mode by pressing `Alt + Shift + C`.
    3.  Verify the speech engine announces: *"Creation Mode enabled. Use Tab or mouse hover to select an element."*
    4.  Hover/Tab to an element and press a key (e.g., `K`).
    5.  Verify the speech engine announces: *"Shortcut K saved successfully."*
    6.  Turn off Creation Mode and verify the correct disable announcement is read.

---

## 3. Physical Keyboard Creation Modals

*   **Boundary:** Synthetic keydown event generation in headless CI test runs may bypass native browser security sandbox validations for OS-reserved combinations (such as native browser shortcuts).
*   **Requirement Target:** `z.WebKeyBind_02` & `z.WebKeyBind_03`
*   **Manual Verification Procedure:**
    1.  Open target test websites with browser developer tools console active.
    2.  Confirm that pressing `Alt + Shift + Z` toggles the popup window without interfering with browser native menus.
    3.  Ensure that focus shifts back to the prior page element when closing the popup.
