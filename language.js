// =======================================================
// VALIDATION & HELPER UTILITIES
// =======================================================
function isValidURL(string) {
    if (!string) return false;
    try {
        new URL(string);
        return true;
    } catch (_) {
        try {
            new URL('https://' + string);
            return true;
        } catch (__) {
            return false;
        }
    }
}

function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].toLowerCase();
}

// =======================================================
// INITIALIZATION & MAIN LOGIC
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    window.currentLang = "English";

    // --- 1. ACCESSIBILITY ANNOUNCER FOR POPUP ---
    const popupAnnouncer = document.createElement('div');
    popupAnnouncer.setAttribute('aria-live', 'assertive');
    popupAnnouncer.setAttribute('aria-atomic', 'true');
    popupAnnouncer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    document.body.appendChild(popupAnnouncer);

    function showAccessibleAlert(msg, type = "error") {
        popupAnnouncer.textContent = '';
        setTimeout(() => { popupAnnouncer.textContent = msg; }, 50);

        const existing = document.getElementById('webkeybind-popup-alert');
        if (existing) existing.remove();

        const alertDiv = document.createElement('div');
        alertDiv.id = 'webkeybind-popup-alert';
        alertDiv.setAttribute('aria-hidden', 'true');
        alertDiv.textContent = msg; // FIX: innerText -> textContent

        let bgColor = "#007BFF";
        if (type === "error") bgColor = "#DC3545";
        if (type === "success") bgColor = "#28A745";
        if (type === "info") bgColor = "#17a2b8"; 

        alertDiv.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background-color: ${bgColor}; color: white; padding: 12px 20px;
            border-radius: 8px; font-family: sans-serif; font-size: 14px; font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483647;
            text-align: center; max-width: 90%; word-wrap: break-word;
            animation: popup-fadein 0.3s ease-out;
        `;
        document.body.appendChild(alertDiv);

        if (!document.getElementById('popup-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'popup-alert-styles';
            // FIX: innerHTML -> textContent
            style.textContent = `
                @keyframes popup-fadein { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
                @keyframes modal-fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (document.body.contains(alertDiv)) {
                alertDiv.style.opacity = "0";
                alertDiv.style.transition = "opacity 0.3s";
                setTimeout(() => { if (document.body.contains(alertDiv)) alertDiv.remove(); }, 300);
            }
        }, 3000);
    }
    window.showAccessibleAlert = showAccessibleAlert; 

    function showAccessibleConfirm(msg, onConfirmCallback, onCancelCallback = null, customYesTxt = null, customNoTxt = null) {
        const t = window.translations?.[window.currentLang] || window.translations?.['English'] || {};
        popupAnnouncer.textContent = '';
        setTimeout(() => { popupAnnouncer.textContent = msg + " Press Tab to select options."; }, 50);

        const existing = document.getElementById('wkb-confirm-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'wkb-confirm-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2147483647;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(2px);
        `;

        const modal = document.createElement('div');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = `
            background: white; padding: 24px; border-radius: 8px; width: 300px; max-width: 90%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; font-family: sans-serif;
            animation: modal-fadein 0.2s ease-out;
        `;

        const text = document.createElement('p');
        text.textContent = msg; // FIX: innerText -> textContent
        text.style.cssText = "margin: 0 0 20px 0; color: #333; font-size: 15px; line-height: 1.5; font-weight: 500; word-break: break-word;";

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display: flex; justify-content: center; gap: 12px;";

        const btnCancel = document.createElement('button');
        btnCancel.textContent = customNoTxt || t.cancel || "Cancel"; // FIX: innerText -> textContent
        btnCancel.style.cssText = "padding: 8px 16px; border: 1px solid #ccc; background: #f8f9fa; border-radius: 4px; cursor: pointer; color: #333; font-weight: bold; flex: 1;";

        const btnYes = document.createElement('button');
        btnYes.textContent = customYesTxt || t.yes_delete || "Yes, Delete"; // FIX: innerText -> textContent
        btnYes.style.cssText = "padding: 8px 16px; border: none; background: #DC3545; color: white; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1;";
        
        if (customYesTxt === "Replace") btnYes.style.background = "#FF9800"; 

        btnCancel.onclick = () => { overlay.remove(); showAccessibleAlert("Action cancelled.", "info"); if(onCancelCallback) onCancelCallback(); };
        btnYes.onclick = () => { overlay.remove(); onConfirmCallback(); };

        btnContainer.appendChild(btnCancel);
        btnContainer.appendChild(btnYes);
        modal.appendChild(text);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === btnCancel) { e.preventDefault(); btnYes.focus(); }
                } else {
                    if (document.activeElement === btnYes) { e.preventDefault(); btnCancel.focus(); }
                }
            } else if (e.key === 'Escape') {
                e.preventDefault(); 
                overlay.remove();
                showAccessibleAlert("Action cancelled.", "info");
                if(onCancelCallback) onCancelCallback();
            }
        });
        btnCancel.focus();
    }
    window.showAccessibleConfirm = showAccessibleConfirm; 

    // --- 2. ADD SHORTCUT MODAL ---
    function showAddShortcutModal() {
        const t = window.translations?.[window.currentLang] || window.translations?.['English'] || {};
        
        const existing = document.getElementById('wkb-add-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'wkb-add-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 2147483647;
            display: flex; justify-content: center; align-items: center;
            backdrop-filter: blur(3px);
        `;

        const modal = document.createElement('div');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'add-modal-title');
        modal.style.cssText = `
            background: white; padding: 24px; border-radius: 8px; width: 340px; max-width: 90%;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-family: sans-serif;
            animation: modal-fadein 0.2s ease-out; display: flex; flex-direction: column; gap: 12px;
        `;

        const title = document.createElement('h3');
        title.id = 'add-modal-title';
        title.textContent = t.addBtn || "Add Shortcut Manually"; // FIX: innerText -> textContent
        title.style.cssText = "margin: 0 0 10px 0; color: #333; font-size: 18px; text-align: center;";

        function createInput(placeholder, val, isReadonly, labelTxt) {
            const wrapper = document.createElement('div');
            wrapper.style.display = "flex"; wrapper.style.flexDirection = "column"; wrapper.style.gap = "4px";
            
            const lbl = document.createElement('label');
            lbl.textContent = labelTxt; // FIX: innerText -> textContent
            lbl.style.cssText = "font-size: 12px; color: #555; font-weight: bold;";
            
            const inp = document.createElement('input');
            inp.type = "text"; inp.value = val; inp.placeholder = placeholder; inp.readOnly = isReadonly;
            inp.style.cssText = `
                width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;
                font-size: 14px; box-sizing: border-box; outline: none; transition: border 0.2s;
                ${isReadonly ? 'background-color: #f1f3f4; color: #5f6368;' : ''}
            `;
            inp.addEventListener('focus', () => { if(!isReadonly) inp.style.borderColor = "#007BFF"; });
            inp.addEventListener('blur', () => { if(!isReadonly) inp.style.borderColor = "#ccc"; });
            
            wrapper.appendChild(lbl);
            wrapper.appendChild(inp);
            return { wrapper, input: inp };
        }

        const urlField = createInput(t.p_url || "URL", window.currentSiteHostname || "", true, "Site URL");
        const nameField = createInput(t.p_name || "Name", "", false, "Action Name");
        const idField = createInput(t.p_id || "ID/Class", "", false, "Element ID or Class");
        const keyField = createInput(t.p_key || "Key", "", false, "Trigger Key (e.g. K)");
        
        keyField.input.maxLength = 1;
        keyField.input.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display: flex; justify-content: space-between; gap: 10px; margin-top: 10px;";

        const btnCancel = document.createElement('button');
        btnCancel.textContent = t.cancelBtn || "Cancel"; // FIX: innerText -> textContent
        btnCancel.style.cssText = "padding: 10px; border: 1px solid #ccc; background: #f8f9fa; border-radius: 4px; cursor: pointer; flex: 1; font-weight: bold; color: #333;";

        const btnSave = document.createElement('button');
        btnSave.textContent = "Save Shortcut"; // FIX: innerText -> textContent
        btnSave.style.cssText = "padding: 10px; border: none; background: #007BFF; color: white; border-radius: 4px; cursor: pointer; flex: 1; font-weight: bold;";

        const closeModal = (isCancel = false) => { 
            overlay.remove(); 
            if(addBtn) addBtn.focus(); 
            if(isCancel) showAccessibleAlert("Add shortcut cancelled.", "info");
        };
        btnCancel.onclick = () => closeModal(true);

        btnSave.onclick = () => {
            const n = nameField.input.value.trim();
            const i = idField.input.value.trim();
            const k = keyField.input.value.trim();

            if (!n || !i || !k) {
                showAccessibleAlert("All fields are required.", "error");
                if(!n) nameField.input.style.borderColor = "#DC3545";
                if(!i) idField.input.style.borderColor = "#DC3545";
                if(!k) keyField.input.style.borderColor = "#DC3545";
                return;
            }

            chrome.storage.local.get(null, (items) => {
                const currentHost = window.currentSiteHostname;
                const duplicate = Object.values(items).find(item => item.key === k && (normalizeUrl(item.url) === normalizeUrl(currentHost)));
                if (duplicate) {
                    const btnName = duplicate.name || duplicate.elementId || "Unknown";
                    const errTemp = t.duplicate_error || "Key '{key}' is already saved for: {name}";
                    showAccessibleAlert(errTemp.replace("{key}", k).replace("{name}", btnName), "error");
                    keyField.input.style.borderColor = "#DC3545";
                    return;
                }

                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (!tabs[0] || !tabs[0].id) {
                        saveData(n, i, k); 
                        return;
                    }
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: (selector) => {
                            try { if (document.querySelector(selector)) return true; } catch(e){}
                            if (document.getElementById(selector)) return true;
                            try { if (document.querySelector(`[aria-label="${selector.replace(/"/g, '\\"')}"]`)) return true; } catch(e){}
                            try { if (document.querySelector(`[data-testid="${selector.replace(/"/g, '\\"')}"]`)) return true; } catch(e){}
                            return false;
                        },
                        args: [i]
                    }, (results) => {
                        if (chrome.runtime.lastError || !results || !results[0] || !results[0].result) {
                            showAccessibleAlert(t.invalid_id || `Element "${i}" not found on page.`, "error");
                            idField.input.style.borderColor = "#DC3545";
                        } else {
                            saveData(n, i, k);
                        }
                    });
                });
            });
        };

        function saveData(name, elementId, key) {
            const uniqueId = Date.now().toString();
            const data = { id: uniqueId, url: window.currentSiteHostname, name: name, elementId: elementId, key: key, profile: { path: elementId } };
            chrome.storage.local.set({ [`shortcut_${uniqueId}`]: data }, () => {
                closeModal();
                window.loadShortcuts();
                showAccessibleAlert("Shortcut saved successfully.", "success");
            });
        }

        btnContainer.append(btnCancel, btnSave);
        modal.append(title, urlField.wrapper, nameField.wrapper, idField.wrapper, keyField.wrapper, btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const focusables = [nameField.input, idField.input, keyField.input, btnCancel, btnSave];
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault(); last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault(); first.focus();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault(); closeModal(true);
            } else if (e.key === 'Enter' && document.activeElement !== btnCancel && document.activeElement !== btnSave) {
                e.preventDefault(); btnSave.click();
            }
        });

        setTimeout(() => { popupAnnouncer.textContent = "Add Shortcut dialog opened. Enter Name, ID, and Key."; }, 50);
        nameField.input.focus();
    }

    // --- 3. UI REFERENCES & CORE LOGIC ---
    const shortcutList = document.querySelector('.shortcut-list');
    const addBtn = document.querySelector('.btn-add');
    const showAllBtn = document.querySelector('.btn-show-all');
    const deleteAllBtn = document.querySelector('.btn-delete-all') || document.getElementById('btn-delete-all');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) chrome.tabs.connect(tabs[0].id, { name: "z-webkeybind-popup" });
    });

    window.currentSiteHostname = "";
    let isShowingAll = false;

    chrome.storage.local.get(['ui_language'], (result) => {
        if (result.ui_language) window.currentLang = result.ui_language;
        if (result.ui_language && window.updateLanguageUI) window.updateLanguageUI(result.ui_language);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url) {
                try { window.currentSiteHostname = new URL(tabs[0].url).hostname; }
                catch (e) { window.currentSiteHostname = "local"; }
            }
            loadShortcuts();
        });
    });

    window.loadShortcuts = function () {
        shortcutList.textContent = ''; // FIX: innerHTML -> textContent
        const t = window.translations?.[window.currentLang] || window.translations?.['English'] || {};

        if (showAllBtn) {
            // FIX: Removed innerHTML, used textContent and nodes
            showAllBtn.textContent = '';
            const textNode = document.createTextNode((isShowingAll ? (t.showCurrent || "Show Current") : (t.showAll || "Show All")) + " ");
            const arrowSpan = document.createElement('span');
            arrowSpan.className = 'arrow-circle';
            arrowSpan.textContent = isShowingAll ? '⌃' : '⌄';
            showAllBtn.appendChild(textNode);
            showAllBtn.appendChild(arrowSpan);
        }

        chrome.storage.local.get(null, (items) => {
            const allShortcuts = Object.values(items).filter(item => item.id);
            const currentNorm = normalizeUrl(window.currentSiteHostname);
            const displayList = isShowingAll ? allShortcuts : allShortcuts.filter(s => {
                const shortcutNorm = normalizeUrl(s.url);
                return shortcutNorm.includes(currentNorm) || currentNorm.includes(shortcutNorm) || s.url === "<URL>";
            });

            displayList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

            if (displayList.length === 0) {
                const msg = document.createElement('div');
                msg.style.cssText = "text-align:center; padding:20px; color:#999; font-size:13px; font-style:italic;";
                msg.textContent = `${t.no_shortcuts || "No shortcuts"} ${isShowingAll ? '' : window.currentSiteHostname}`; // FIX: innerText -> textContent
                shortcutList.appendChild(msg);
            } else {
                displayList.forEach((data, index) => createRow(data, index + 1));
            }
        });
    };

    function createRow(data, index) {
        const t = window.translations?.[window.currentLang] || window.translations?.['English'] || {};
        const row = document.createElement('div');
        row.className = 'shortcut-row';
        row.setAttribute('data-id', data.id);

        const currentNorm = normalizeUrl(window.currentSiteHostname);
        const shortcutNorm = normalizeUrl(data.url);
        if (shortcutNorm.includes(currentNorm) || currentNorm.includes(shortcutNorm) || data.url === "<URL>") {
            row.style.backgroundColor = "#e8f0fe";
            row.style.borderLeft = "4px solid #1a73e8";
            row.title = "Active on this website";
        }

        // FIX: Replaced innerHTML with safe document.createElement
        const indexSpan = document.createElement('span');
        indexSpan.className = 'index';
        indexSpan.textContent = index;

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.value = data.url;
        urlInput.className = 'input-field url-input';
        urlInput.readOnly = true;
        urlInput.title = `Site: ${data.url}`;
        urlInput.style.cssText = "background-color: #f1f3f4; color: #5f6368; cursor: default; border: 1px solid transparent; font-weight: 600;";

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = data.name;
        nameInput.className = 'input-field';
        nameInput.setAttribute('data-field', 'name');
        nameInput.placeholder = t.p_name || 'Name';

        const idInput = document.createElement('input');
        idInput.type = 'text';
        idInput.value = data.elementId;
        idInput.className = 'input-field';
        idInput.setAttribute('data-field', 'elementId');
        idInput.placeholder = t.p_id || 'ID/Class';

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.value = data.key;
        keyInput.className = 'input-field key-input';
        keyInput.setAttribute('data-field', 'key');
        keyInput.placeholder = t.p_key || 'Key';
        keyInput.style.cssText = "text-align:center;";
        keyInput.maxLength = 1;

        const btnRemove = document.createElement('button');
        btnRemove.className = 'btn-remove';
        btnRemove.title = 'Delete';
        btnRemove.textContent = '×';

        row.append(indexSpan, urlInput, nameInput, idInput, keyInput, btnRemove);

        row.querySelectorAll('input').forEach(input => {
            if (input.value.trim() === "" && !input.readOnly) input.classList.add('input-error');

            input.addEventListener('input', (e) => {
                const field = e.target.dataset.field;
                let value = e.target.value;

                if (field === 'key') {
                    value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    e.target.value = value;
                }

                if (value.trim() === "") {
                    e.target.classList.add('input-error');
                    if (field === 'key') showAccessibleAlert("Key field cleared.", "info");
                }
                else e.target.classList.remove('input-error');

                if (field === 'key' && value.trim() !== "") {
                    chrome.storage.local.get(null, (items) => {
                        const currentHost = data.url || window.currentSiteHostname;
                        const duplicate = Object.values(items).find(item => item.id !== data.id && item.key === value && (normalizeUrl(item.url) === normalizeUrl(currentHost)));
                        if (duplicate) {
                            const btnName = duplicate.name || duplicate.elementId || "Unknown";
                            const errTemp = t.duplicate_error || "The key '{key}' is already saved for: {name}";
                            showAccessibleAlert(errTemp.replace("{key}", value).replace("{name}", btnName), "error");
                            e.target.classList.add('input-error');
                            e.target.value = "";
                        }
                    });
                }
            });
        });

        const idInputEl = row.querySelector('input[data-field="elementId"]');
        if (idInputEl) {
            idInputEl.addEventListener('change', (e) => {
                const val = e.target.value.trim();
                if (val === "") {
                    e.target.classList.add('input-error');
                    return;
                }
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (!tabs[0] || !tabs[0].id) {
                        return;
                    }
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: (selector) => {
                            try { if (document.querySelector(selector)) return true; } catch (e) { }
                            if (document.getElementById(selector)) return true;
                            try { if (document.querySelector(`[aria-label="${selector.replace(/"/g, '\\"')}"]`)) return true; } catch (e) { }
                            try { if (document.querySelector(`[data-testid="${selector.replace(/"/g, '\\"')}"]`)) return true; } catch (e) { }
                            return false;
                        },
                        args: [val]
                    }, (results) => {
                        if (chrome.runtime.lastError || !results || !results[0] || !results[0].result) {
                            showAccessibleAlert(t.invalid_id || `The Button ID / Selector "${val}" was not found on this webpage.`, "error");
                            e.target.classList.add('input-error');
                        } else {
                            e.target.classList.remove('input-error');
                        }
                    });
                });
            });
        }

        row.querySelector('.btn-remove').addEventListener('click', () => {
            showAccessibleConfirm(t.delete_confirm || "Delete this shortcut?", () => {
                chrome.storage.local.remove(`shortcut_${data.id}`, () => {
                    row.remove();
                    window.loadShortcuts();
                    showAccessibleAlert(t.deleted_success || "Shortcut deleted successfully.", "success");
                });
            });
        });

        shortcutList.appendChild(row);
    }

    if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
            isShowingAll = !isShowingAll;
            window.loadShortcuts();
            showAccessibleAlert(isShowingAll ? "Showing all shortcuts" : "Showing current site shortcuts", "info");
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showAddShortcutModal();
        });
    }

    document.querySelectorAll('.language-dropdown, .menu-container').forEach(el => el.removeAttribute('tabindex'));

    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            const t = window.translations?.[window.currentLang] || window.translations?.['English'] || {};
            const host = window.currentSiteHostname || "";
            showAccessibleConfirm(t.delete_all_confirm || "Delete these shortcuts?", () => {
                chrome.storage.local.get(null, (items) => {
                    const keysToRemove = isShowingAll ? Object.keys(items).filter(key => key.startsWith('shortcut_')) : Object.keys(items).filter(key => key.startsWith('shortcut_') && (normalizeUrl(items[key].url) === normalizeUrl(host)));
                    if (keysToRemove.length > 0) {
                        chrome.storage.local.remove(keysToRemove, () => {
                            window.loadShortcuts();
                            showAccessibleAlert(isShowingAll ? (t.deleted_all_success || "All shortcuts deleted successfully.") : (t.deleted_site_success || `Shortcuts for ${host} deleted.`), "success");
                        });
                    } else {
                        showAccessibleAlert((t.no_shortcuts || "No shortcuts") + " " + host, "info");
                    }
                });
            });
        });
    }
});

// =======================================================
// GLOBAL TRANSLATIONS
// =======================================================
window.translations = {
    English: {
        settingsTitle: "z.WebKeyBind Settings",
        defaultTitle: "Default Shortcuts",
        savedTitle: "Saved Shortcuts",
        addBtn: "Add Shortcut",
        showAll: "Show all Shortcuts",
        showCurrent: "Show Current Site Only",
        deleteAll: "Delete Shortcuts",
        def_row1: "Open or Close Settings Window",
        def_row2: "Use Keyboard and Mouse to Hover & Record",
        def_row3: "Read all Shortcuts",
        p_url: "Website URL",
        p_name: "Action Name",
        p_id: "Element ID / Class",
        p_key: "Key",
        no_shortcuts: "No shortcuts found for",
        deleted_success: "Shortcut deleted successfully.",
        deleted_all_success: "All shortcuts deleted successfully.",
        deleted_site_success: "Shortcuts for this site deleted.",
        delete_confirm: "Delete this shortcut?",
        delete_all_confirm: "Delete all visible shortcuts?",
        importBtn: "Import Shortcuts",
        exportBtn: "Export Site Shortcuts",
        exportAllBtn: "Export All Shortcuts",
        importSuccess: "Imported {count} shortcuts successfully.",
        importInvalid: "Invalid JSON file.",
        importTypeErr: "Please use a .json file.",
        importTitle: "Import Shortcuts",
        dragDropText: "Drag & Drop .json file here",
        browseText: "or click to browse",
        cancelBtn: "Close",
        menuLabel: "Menu",
        duplicate_error: "The key '{key}' is already saved for this button: {name}",
        button_already_has_shortcut: "This button already has a shortcut: Alt + {key}",
        key_already_used: "Key '{key}' is already used for '{name}'.",
        invalid_id: "The Button ID / Selector was not found on this webpage. Please check the ID.",
        cancel: "Cancel",
        yes_delete: "Yes, Delete",
        guideTitle: "Important Note:",
        guideP1: "You must add a dot ( . ) before a Class name or a hash ( # ) before an ID name.",
        guideP2: "If a class name contains spaces, replace every space with a dot.",
        guideEx: "Example:",
        headerAction: "Action",
        headerShortcut: "Shortcut",
        saveChanges: "Save Changes",
        howToUseTitle: "How to Use:",
        howToUse1_title: "Open Settings:",
        howToUse1_desc: "Press Alt + Shift + Z to open or close the settings window.",
        howToUse2_title: "Create a Shortcut:",
        howToUse2_desc: "Press Alt + Shift + C to enable Creation Mode. Use Tab or mouse hover to select an element, then press any key (A–Z, 0–9) to save. Press Escape or Alt + Shift + C to exit.",
        howToUse3_title: "Trigger Shortcut:",
        howToUse3_desc: "Press Alt + [Your Key] on the webpage to execute the action.",
        howToUse4_title: "Audio Guide:",
        howToUse4_desc: "Press Alt + Shift + A to read aloud all saved shortcuts on the website.",
    },
    हिंदी: {
        settingsTitle: "z.WebKeyBind सेटिंग्स",
        defaultTitle: "डिफ़ॉल्ट शॉर्टकट",
        savedTitle: "सहेजे गए शॉर्टकट",
        addBtn: "शॉर्टकट जोड़ें",
        showAll: "सभी शॉर्टकट देखें",
        showCurrent: "केवल वर्तमान साइट",
        deleteAll: "शॉर्टकट हटाएं",
        def_row1: "सेटिंग्स विंडो खोलें या बंद करें",
        def_row2: "होवर और रिकॉर्ड करने के लिए कीबोर्ड और माउस का उपयोग करें",
        def_row3: "सभी शॉर्टकट पढ़ें",
        p_url: "वेबसाइट URL",
        p_name: "क्रिया का नाम",
        p_id: "तत्व ID / क्लास",
        p_key: "कुंजी",
        no_shortcuts: "इसके लिए कोई शॉर्टकट नहीं मिला:",
        deleted_success: "शॉर्टकट सफलतापूर्वक हटा दिया गया।",
        deleted_all_success: "सभी शॉर्टकट सफलतापूर्वक हटा दिए गए।",
        deleted_site_success: "इस साइट के शॉर्टकट हटा दिए गए।",
        delete_confirm: "क्या आप इस शॉर्टकट को हटाना चाहते हैं?",
        delete_all_confirm: "क्या आप सभी दिखाई देने वाले शॉर्टकट हटाना चाहते हैं?",
        importBtn: "आयात करें",
        exportBtn: "साइट निर्यात करें",
        exportAllBtn: "सभी निर्यात करें",
        importSuccess: "{count} शॉर्टकट सफलतापूर्वक आयात किए गए।",
        importInvalid: "अमान्य JSON फ़ाइल।",
        importTypeErr: "कृपया .json फ़ाइल का उपयोग करें।",
        importTitle: "शॉर्टकट आयात करें",
        dragDropText: ".json फ़ाइल को यहाँ ड्रैग और ड्रॉप करें",
        browseText: "या ब्राउज़ करने के लिए क्लिक करें",
        cancelBtn: "बंद करें",
        menuLabel: "मेन्यू",
        duplicate_error: "कुंजी '{key}' पहले से ही इस बटन के लिए सहेजी गई है: {name}",
        button_already_has_shortcut: "इस बटन का शॉर्टकट पहले से ही मौजूद है: Alt + {key}",
        key_already_used: "कुंजी '{key}' का उपयोग पहले से ही '{name}' के लिए किया जा रहा है।",
        invalid_id: "इस वेबपेज पर बटन ID या सिलेक्टर नहीं मिला। कृपया ID की जाँच करें।",
        cancel: "रद्द करें",
        yes_delete: "हाँ, हटाएँ",
        guideTitle: "महत्वपूर्ण नोट:",
        guideP1: "आपको किसी क्लास नाम से पहले डॉट ( . ) या आईडी नाम से पहले हैश ( # ) जोड़ना होगा।",
        guideP2: "यदि क्लास नाम में स्पेस है, तो प्रत्येक स्पेस को डॉट से बदलें।",
        guideEx: "उदाहरण:",
        headerAction: "क्रिया",
        headerShortcut: "शॉर्टकट",
        saveChanges: "परिवर्तन सहेजें",
        howToUseTitle: "उपयोग कैसे करें:",
        howToUse1_title: "सेटिंग्स खोलें:",
        howToUse1_desc: "सेटिंग्स विंडो खोलने या बंद करने के लिए Alt + Shift + Z दबाएं।",
        howToUse2_title: "शॉर्टकट बनाएं:",
        howToUse2_desc: "क्रिएशन मोड चालू करने के लिए Alt + Shift + C दबाएं। किसी बटन पर जाने के लिए Tab या माउस का उपयोग करें, फिर सहेजने के लिए कोई भी कुंजी (A–Z, 0–9) दबाएं। बाहर निकलने के लिए Escape या Alt + Shift + C दबाएं।",
        howToUse3_title: "शॉर्टकट चलाएं:",
        howToUse3_desc: "संबंधित क्रिया को निष्पादित करने के लिए वेबपेज पर Alt + [आपकी कुंजी] दबाएं।",
        howToUse4_title: "ऑडियो गाइड:",
        howToUse4_desc: "वर्तमान वेबसाइट के सभी सहेजे गए शॉर्टकट सुनने के लिए Alt + Shift + A दबाएं।",
    },
    मराठी: {
        settingsTitle: "z.WebKeyBind सेटिंग्स",
        defaultTitle: "डीफॉल्ट शॉर्टकट",
        savedTitle: "जतन केलेले शॉर्टकट",
        addBtn: "शॉर्टकट जोडा",
        showAll: "सर्व शॉर्टकट पहा",
        showCurrent: "फक्त वर्तमान साइट",
        deleteAll: "शॉर्टकट हटवा",
        def_row1: "सेटिंग्ज विंडो उघडा किंवा बंद करा",
        def_row2: "होव्हर आणि रेकॉर्ड करण्यासाठी कीबोर्ड आणि माउस वापरा",
        def_row3: "सर्व शॉर्टकट वाचा",
        p_url: "संकेतस्थळ URL",
        p_name: "क्रियेचे नाव",
        p_id: "एलिमेंट ID / क्लास",
        p_key: "कळ (Key)",
        no_shortcuts: "यासाठी शॉर्टकट सापडले नाहीत:",
        deleted_success: "शॉर्टकट यशस्वीरित्या हटवला.",
        deleted_all_success: "सर्व शॉर्टकट यशस्वीरित्या हटवले.",
        deleted_site_success: "या साइटचे शॉर्टकट हटवले गेले.",
        delete_confirm: "हा शॉर्टकट हटवायचा का?",
        delete_all_confirm: "तुम्हाला नक्की सर्व शॉर्टकट हटवायचे आहेत का?",
        importBtn: "आयात करा",
        exportBtn: "साइट निर्यात करा",
        exportAllBtn: "सर्व निर्यात करा",
        importSuccess: "{count} शॉर्टकट यशस्वीपणे आयात केले.",
        importInvalid: "अवैध JSON फाइल.",
        importTypeErr: "कृपया .json फाइल वापरा.",
        importTitle: "शॉर्टकट आयात करा",
        dragDropText: ".json फाइल येथे ड्रॅग आणि ड्रॉप करा",
        browseText: "किंवा ब्राउझ करण्यासाठी क्लिक करा",
        cancelBtn: "बंद करा",
        menuLabel: "मेनू",
        duplicate_error: "ही की '{key}' या बटणासाठी आधीच सेव्ह केली आहे: {name}",
        button_already_has_shortcut: "या बटणासाठी शॉर्टकट आधीच अस्तित्वात आहे: Alt + {key}",
        key_already_used: "कळ '{key}' आधीच '{name}' साठी वापरली आहे।",
        invalid_id: "या वेबपेजवर बटण ID किंवा सिलेक्टर सापडला नाही. कृपया ID तपासा.",
        cancel: "रद्द करा",
        yes_delete: "होय, हटवा",
        guideTitle: "महत्त्वाची नोंद:",
        guideP1: "तुम्हाला क्लास नावापूर्वी डॉट ( . ) किंवा आयडी नावापूर्वी हॅश ( # ) जोडणे आवश्यक आहे.",
        guideP2: "जर क्लास नावात स्पेस असेल, तर प्रत्येक स्पेस डॉट ने बदला.",
        guideEx: "उदाहरण:",
        headerAction: "क्रिया",
        headerShortcut: "शॉर्टकट",
        saveChanges: "बदल करा",
        howToUseTitle: "कसे वापरावे:",
        howToUse1_title: "सेटिंग्ज उघडा:",
        howToUse1_desc: "सेटिंग्ज विंडो उघडण्यासाठी किंवा बंद करण्यासाठी Alt + Shift + Z दाबा.",
        howToUse2_title: "शॉर्टकट तयार करा:",
        howToUse2_desc: "क्रिएशन मोड सक्षम करण्यासाठी Alt + Shift + C दाबा. घटक निवडण्यासाठी Tab किंवा माउस वापरा, नंतर जतन करण्यासाठी कोणतीही कळ (A–Z, 0–9) दाबा. बाहेर पडण्यासाठी Escape किंवा Alt + Shift + C दाबा.",
        howToUse3_title: "शॉर्टकट चालवा:",
        howToUse3_desc: "वेबपेजवर क्रिया कार्यान्वित करण्यासाठी Alt + [तुमची की] दाबा.",
        howToUse4_title: "ऑडिओ मार्गदर्शक:",
        howToUse4_desc: "वर्तमान वेबसाइटवरील सर्व सेव्ह केलेले शॉर्टकट ऐकण्यासाठी Alt + Shift + A दाबा.",
    },
    മലയാളം: {
        settingsTitle: "z.WebKeyBind ക്രമീകരണങ്ങൾ",
        defaultTitle: "സ്ഥിരസ്ഥിതി കുറുക്കുവഴികൾ",
        savedTitle: "സൂക്ഷിച്ച കുറുക്കുവഴികൾ",
        addBtn: "കുറുക്കുവഴി ചേർക്കുക",
        showAll: "എല്ലാ കുറുക്കുവഴികളും",
        showCurrent: "ഈ സൈറ്റിൽ മാത്രം",
        deleteAll: "കുറുക്കുവഴികൾ നീക്കം ചെയ്യുക",
        def_row1: "ക്രമീകരണ ജാലകം തുറക്കുക അല്ലെങ്കിൽ അടയ്ക്കുക",
        def_row2: "ഹോവർ ചെയ്യാനും റെക്കോർഡ് ചെയ്യാനും കീബോർഡും മൗസും ഉപയോഗിക്കുക",
        def_row3: "എല്ലാ കുറുക്കുവഴികളും വായിക്കുക",
        p_url: "വെബ്സൈറ്റ് URL",
        p_name: "പ്രവർത്തനത്തിന്റെ പേര്",
        p_id: "എലമെന്റ് ID / ക്ലാസ്സ്",
        p_key: "കീ",
        no_shortcuts: "കുറുക്കുവഴികളൊന്നും കണ്ടെത്തിയില്ല:",
        deleted_success: "കുറുക്കുവഴി വിജയകരമായി നീക്കംചെയ്തു.",
        deleted_all_success: "എല്ലാ കുറുക്കുവഴികളും വിജയകരമായി നീക്കംചെയ്തു.",
        deleted_site_success: "ഈ സൈറ്റിലെ കുറുക്കുവഴികൾ നീക്കംചെയ്തു.",
        delete_confirm: "ഈ കുറുക്കുവഴി നീക്കം ചെയ്യണോ?",
        delete_all_confirm: "എല്ലാ കുറുക്കുവഴികളും നീക്കം ചെയ്യണോ?",
        importBtn: "ഇമ്പോർട്ട്",
        exportBtn: "സൈറ്റ് എക്സ്‌പോർട്ട്",
        exportAllBtn: "എല്ലാം എക്സ്‌പോർട്ട്",
        importSuccess: "{count} കുറുക്കുവഴികൾ വിജയകരമായി ഇമ്പോർട്ട് ചെയ്തു.",
        importInvalid: "അസാധുവായ JSON ഫയൽ.",
        importTypeErr: "ദയവായി ഒരു .json ഫയൽ ഉപയോഗിക്കുക.",
        importTitle: "കുറുക്കുവഴികൾ ഇമ്പോർട്ട് ചെയ്യുക",
        dragDropText: ".json ഫയൽ ഇവിടെ ഡ്രാഗ് ചെയ്ത് ഡ്രോപ്പ് ചെയ്യുക",
        browseText: "അല്ലെങ്കിൽ ബ്രൗസ് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക",
        cancelBtn: "അടയ്ക്കുക",
        menuLabel: "മെനു",
        duplicate_error: "ഈ കീ '{key}' ഈ ബട്ടണിനായി ഇതിനകം സേവ് ചെയ്തിട്ടുണ്ട്: {name}",
        button_already_has_shortcut: "ഈ ബട്ടണിന് ഇതിനകം ഒരു കുറുക്കുവഴി ഉണ്ട്: Alt + {key}",
        key_already_used: "കീ '{key}' ഇതിനകം '{name}' എന്നതിനായി ഉപയോഗിക്കുന്നു.",
        invalid_id: "ഈ വെബ്‌പേജിൽ ബട്ടൺ ID അല്ലെങ്കിൽ സെലക്ടർ കണ്ടെത്തിയില്ല. ദയവായി ID പരിശോധിക്കുക.",
        cancel: "റദ്ദാക്കുക",
        yes_delete: "അതെ, നീക്കം ചെയ്യുക",
        guideTitle: "പ്രധാന കുറിപ്പ്:",
        guideP1: "നിങ്ങൾ ഒരു ക്ലാസ്സ് പേരിന് മുമ്പ് ഒരു കുത്ത് ( . ) അല്ലെങ്കിൽ ഐഡി പേരിന് മുമ്പ് ഒരു ഹാഷ് ( # ) ചേർക്കണം.",
        guideP2: "ക്ലാസ്സ് പേരിൽ സ്പേസുകൾ ഉണ്ടെങ്കിൽ, ഓരോ സ്പേസും ഒരു കുത്ത് ഉപയോഗിച്ച് മാറ്റുക.",
        guideEx: "ഉദാഹരണം:",
        headerAction: "പ്രവർത്തനം",
        headerShortcut: "കുറുക്കുവഴി",
        saveChanges: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
        howToUseTitle: "എങ്ങനെ ഉപയോഗിക്കാം:",
        howToUse1_title: "ക്രമീകരണങ്ങൾ തുറക്കുക:",
        howToUse1_desc: "ക്രമീകരണ ജാലകം തുറക്കാൻ അല്ലെങ്കിൽ അടയ്ക്കാൻ Alt + Shift + Z അമർത്തുക.",
        howToUse2_title: "കുറുക്കുവഴി സൃഷ്ടിക്കുക:",
        howToUse2_desc: "ക്രിയേഷൻ മോഡ് ഓണാക്കാൻ Alt + Shift + C അമർത്തുക. ഒരു എലമെന്റ് തിരഞ്ഞെടുക്കാൻ Tab അല്ലെങ്കിൽ മൗസ് ഉപയോഗിക്കുക, തുടർന്ന് സംരക്ഷിക്കാൻ ഏതെങ്കിലും കീ (A–Z, 0–9) അമർത്തുക. പുറത്തുകടക്കാൻ Escape അല്ലെങ്കിൽ Alt + Shift + C അമർത്തുക.",
        howToUse3_title: "കുറുക്കുവഴി പ്രവർത്തിപ്പിക്കുക:",
        howToUse3_desc: "പ്രവർത്തനം നടപ്പിലാക്കാൻ വെബ്പേജിൽ Alt + [നിങ്ങളുടെ കീ] അമർത്തുക.",
        howToUse4_title: "ഓഡിയോ ഗൈഡ്:",
        howToUse4_desc: "ഈ വെബ്‌സൈറ്റിലെ എല്ലാ കുറുക്കുവഴികളും കേൾക്കാൻ Alt + Shift + A അമർത്തുക.",
    }
};

window.currentLang = "English";

window.updateLanguageUI = function (lang) {
    window.currentLang = lang;
    const t = window.translations[lang] || window.translations['English'];

    const saveAllBtn = document.getElementById('btn-save-all');
    if (saveAllBtn) {
        saveAllBtn.textContent = t.saveChanges; // FIX: innerText -> textContent
    }
    
    document.getElementById('current-lang').textContent = lang; // FIX: innerText -> textContent
    document.querySelector('.logo').textContent = t.settingsTitle; // FIX: innerText -> textContent
    const titles = document.querySelectorAll('.section-title');
    if (titles.length >= 2) {
        titles[0].textContent = t.defaultTitle; // FIX: innerText -> textContent
        titles[1].textContent = t.savedTitle; // FIX: innerText -> textContent
    }

    const btnImport = document.getElementById('btn-import');
    const btnExportSite = document.getElementById('btn-export-site');
    const btnExportAll = document.getElementById('btn-export-all');
    if (btnImport) btnImport.textContent = t.importBtn; // FIX: innerText -> textContent
    if (btnExportSite) btnExportSite.textContent = t.exportBtn; // FIX: innerText -> textContent
    if (btnExportAll) btnExportAll.textContent = t.exportAllBtn; // FIX: innerText -> textContent

    const modalTitle = document.querySelector('.modal-content h3');
    const dropMainText = document.querySelector('#drop-zone p:not(.sub-text)');
    const dropSubText = document.querySelector('.sub-text');
    const closeBtn = document.getElementById('btn-close-import');

    if (modalTitle) modalTitle.textContent = t.importTitle; // FIX: innerText -> textContent
    
    // FIX: REPLACED innerHTML with safe node generation
    if (dropMainText) {
        dropMainText.textContent = '';
        const parts = t.dragDropText.split('.json');
        if (parts.length > 1) {
            dropMainText.appendChild(document.createTextNode(parts[0]));
            const b = document.createElement('b');
            b.textContent = '.json';
            dropMainText.appendChild(b);
            dropMainText.appendChild(document.createTextNode(parts[1]));
        } else {
            dropMainText.textContent = t.dragDropText;
        }
    }
    
    if (dropSubText) dropSubText.textContent = t.browseText; // FIX: innerText -> textContent
    if (closeBtn) closeBtn.textContent = t.cancelBtn; // FIX: innerText -> textContent

    const btnAdd = document.querySelector('.btn-add');
    const btnDeleteAll = document.querySelector('.btn-delete-all');
    
    // FIX: REPLACED innerHTML with safe node generation
    if (btnAdd) {
        btnAdd.textContent = '';
        const plusSpan = document.createElement('span');
        plusSpan.className = 'plus';
        plusSpan.textContent = '+';
        btnAdd.appendChild(plusSpan);
        btnAdd.appendChild(document.createTextNode(' ' + t.addBtn));
    }
    
    if (btnDeleteAll) btnDeleteAll.textContent = t.deleteAll; // FIX: innerText -> textContent

    const burger = document.getElementById('burger-label');
    if (burger) burger.setAttribute('aria-label', t.menuLabel);

    document.querySelectorAll('.dropdown-item').forEach(item => {
        if (item.getAttribute('data-lang') === lang) {
            item.classList.add('active');
            item.querySelector('.check').style.opacity = '1';
        } else {
            item.classList.remove('active');
            item.querySelector('.check').style.opacity = '0';
        }
    });

    const rows = document.querySelectorAll('.default-table tbody tr');
    if (rows.length > 0) {
        if (rows[0]) rows[0].cells[0].textContent = t.def_row1; // FIX: innerText -> textContent
        if (rows[1]) rows[1].cells[0].textContent = t.def_row2; // FIX: innerText -> textContent
        if (rows[2]) rows[2].cells[0].textContent = t.def_row3; // FIX: innerText -> textContent
    }

    const headerAction = document.getElementById('headerAction');
    const headerShortcut = document.getElementById('headerShortcut');

    if (headerAction) headerAction.textContent = t.headerAction; // FIX: innerText -> textContent
    if (headerShortcut) headerShortcut.textContent = t.headerShortcut; // FIX: innerText -> textContent

    // --- HOW TO USE GUIDE ---
    const howToUseTitle = document.getElementById('howToUseTitle');
    const howToUse1_title = document.getElementById('howToUse1_title');
    const howToUse1_desc = document.getElementById('howToUse1_desc');
    const howToUse2_title = document.getElementById('howToUse2_title');
    const howToUse2_desc = document.getElementById('howToUse2_desc');
    const howToUse3_title = document.getElementById('howToUse3_title');
    const howToUse3_desc = document.getElementById('howToUse3_desc');
    const howToUse4_title = document.getElementById('howToUse4_title');
    const howToUse4_desc = document.getElementById('howToUse4_desc');

    if (howToUseTitle && t.howToUseTitle) howToUseTitle.textContent = t.howToUseTitle;
    if (howToUse1_title && t.howToUse1_title) howToUse1_title.textContent = t.howToUse1_title;
    if (howToUse1_desc && t.howToUse1_desc) howToUse1_desc.textContent = ' ' + t.howToUse1_desc;
    if (howToUse2_title && t.howToUse2_title) howToUse2_title.textContent = t.howToUse2_title;
    if (howToUse2_desc && t.howToUse2_desc) howToUse2_desc.textContent = ' ' + t.howToUse2_desc;
    if (howToUse3_title && t.howToUse3_title) howToUse3_title.textContent = t.howToUse3_title;
    if (howToUse3_desc && t.howToUse3_desc) howToUse3_desc.textContent = ' ' + t.howToUse3_desc;
    if (howToUse4_title && t.howToUse4_title) howToUse4_title.textContent = t.howToUse4_title;
    if (howToUse4_desc && t.howToUse4_desc) howToUse4_desc.textContent = ' ' + t.howToUse4_desc;
    
    // --- UPDATED GUIDE BOX ---
    const guideTitle = document.getElementById('guideTitle');
    const guideP1 = document.getElementById('guideP1');
    const guideP2 = document.getElementById('guideP2');
    const guideEx = document.getElementById('guideEx');

    if (guideTitle) guideTitle.textContent = t.guideTitle; // FIX: innerText -> textContent
    if (guideP1) guideP1.textContent = t.guideP1; // FIX: innerText -> textContent
    if (guideP2) guideP2.textContent = t.guideP2; // FIX: innerText -> textContent
    if (guideEx) guideEx.textContent = t.guideEx; // FIX: innerText -> textContent

    const langMap = { "English": "en", "हिंदी": "hi", "मराठी": "mr", "മലയാളം": "ml" };
    document.documentElement.lang = langMap[lang] || "en";
};

document.addEventListener('DOMContentLoaded', () => {
    const langTrigger = document.querySelector('.dropdown-trigger');
    const langMenu = document.getElementById('lang-menu');
    const langContainer = document.querySelector('.language-dropdown');

    if (langTrigger && langMenu) {
        langTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const otherMenu = document.querySelector('.import-export-dropdown');
            if (otherMenu) otherMenu.style.display = 'none';
            
            const isVisible = langMenu.style.display === 'block';
            if (isVisible) {
                langMenu.style.display = 'none';
                langTrigger.setAttribute('aria-expanded', 'false');
                if(window.showAccessibleAlert) window.showAccessibleAlert("Language menu closed.", "info");
            } else {
                langMenu.style.display = 'block';
                langTrigger.setAttribute('aria-expanded', 'true');
                if(window.showAccessibleAlert) window.showAccessibleAlert("Language menu opened. Use Tab to select.", "info");
            }
        });
        
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.setAttribute('tabindex', '0');
            const handleSelect = (e) => {
                const selectedLang = item.getAttribute('data-lang');
                chrome.storage.local.set({ 'ui_language': selectedLang });
                if (window.updateLanguageUI) window.updateLanguageUI(selectedLang);
                if (window.loadShortcuts) window.loadShortcuts();

                langMenu.style.display = 'none';
                langTrigger.setAttribute('aria-expanded', 'false');
                e.stopPropagation();
                langTrigger.focus();
                
                if(window.showAccessibleAlert) window.showAccessibleAlert(`Language changed to ${selectedLang}`, "success");
            };
            item.addEventListener('click', handleSelect);
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(e);
                }
            });
        });

        if (langContainer) {
            langContainer.addEventListener('focusout', (event) => {
                if (!langContainer.contains(event.relatedTarget) && langMenu.style.display === 'block') {
                    langMenu.style.display = 'none';
                    langTrigger.setAttribute('aria-expanded', 'false');
                    if(window.showAccessibleAlert) window.showAccessibleAlert("Language menu closed.", "info");
                }
            });
        }

        document.addEventListener('click', () => {
            if (langMenu.style.display === 'block') {
                langMenu.style.display = 'none';
                langTrigger.setAttribute('aria-expanded', 'false');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && langMenu.style.display === 'block') {
                langMenu.style.display = 'none';
                langTrigger.setAttribute('aria-expanded', 'false');
                langTrigger.focus();
                if(window.showAccessibleAlert) window.showAccessibleAlert("Language menu closed.", "info");
            }
        });
    }
});