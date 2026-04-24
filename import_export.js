// =======================================================
// IMPORT & EXPORT LOGIC
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    const btnExportSite = document.getElementById('btn-export-site');
    const btnExportAll = document.getElementById('btn-export-all');
    const btnImport = document.getElementById('btn-import');
    
    const menuContainer = document.querySelector('.menu-container'); 
    const menuBurger = document.querySelector('.menu-burger');
    const menuDropdown = document.querySelector('.import-export-dropdown');
    const closeMenuBtn = document.querySelector('.close-menu');

    const importModal = document.getElementById('import-modal');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const btnCloseImport = document.getElementById('btn-close-import');

    const getNormUrl = (url) => {
        if (!url) return "";
        return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].toLowerCase();
    };

    const isFullTabMode = new URLSearchParams(window.location.search).get('importMode') === 'true';

    function handleFocusTrap(e) {
        if (e.key !== 'Tab') return;
        const focusableElements = importModal.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { 
            if (document.activeElement === firstElement) { e.preventDefault(); lastElement.focus(); }
        } else { 
            if (document.activeElement === lastElement) { e.preventDefault(); firstElement.focus(); }
        }
    }

    // --- 3-BAR MENU FIX ---
    // Because menuBurger is a <button> tag in your HTML, it natively handles Enter/Space.
    // Adding keydown listeners causes it to fire twice. We ONLY use 'click' here.
    if (menuBurger && menuDropdown) {
        const toggleMenu = (e) => {
            e.stopPropagation();
            const langMenu = document.getElementById('lang-menu');
            const langBtn = document.getElementById('lang-button');
            if(langMenu) langMenu.style.display = 'none';
            if(langBtn) langBtn.setAttribute('aria-expanded', 'false');

            const isVisible = menuDropdown.style.display === 'block';
            menuDropdown.style.display = isVisible ? 'none' : 'block';
            menuBurger.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
            
            if(window.showAccessibleAlert) {
                window.showAccessibleAlert(isVisible ? "Import Export menu closed." : "Import Export menu opened.", "info");
            }
        };

        menuBurger.addEventListener('click', toggleMenu);

        if (menuContainer) {
            menuContainer.addEventListener('focusout', (event) => {
                if (!menuContainer.contains(event.relatedTarget) && menuDropdown.style.display === 'block') { 
                    menuDropdown.style.display = 'none'; 
                    menuBurger.setAttribute('aria-expanded', 'false');
                    if(window.showAccessibleAlert) window.showAccessibleAlert("Import Export menu closed.", "info");
                }
            });
        }
    }
    
    if (closeMenuBtn) {
        const closeMenu = (e) => { 
            e.stopPropagation(); 
            menuDropdown.style.display = 'none'; 
            if (menuBurger) menuBurger.setAttribute('aria-expanded', 'false');
            if(window.showAccessibleAlert) window.showAccessibleAlert("Import Export menu closed.", "info");
        };

        closeMenuBtn.addEventListener('click', closeMenu);
    }
    
    document.addEventListener('click', () => { 
        if(menuDropdown && menuDropdown.style.display === 'block') {
            menuDropdown.style.display = 'none'; 
            if (menuBurger) menuBurger.setAttribute('aria-expanded', 'false');
            if(window.showAccessibleAlert) window.showAccessibleAlert("Import Export menu closed.", "info");
        }
    });

    function exportShortcuts(exportAll) {
        const hostname = window.currentSiteHostname || ""; 
        chrome.storage.local.get(null, (items) => {
            let allItems = Object.values(items).filter(item => item.id);
            let data = exportAll ? allItems : allItems.filter(item => item.url === hostname);

            if (data.length === 0) {
                if(window.showAccessibleAlert) window.showAccessibleAlert(`No shortcuts found for ${exportAll ? "ALL" : hostname}`, "info");
                return;
            }

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = exportAll ? `shortcuts_ALL_${timestamp}.json` : `shortcuts_${hostname}_${timestamp}.json`;
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const link = document.createElement('a'); link.href = dataStr; link.download = filename;
            document.body.appendChild(link); link.click(); link.remove();
            
            if(window.showAccessibleAlert) window.showAccessibleAlert(`Exported ${data.length} shortcuts successfully.`, "success");
        });
    }

    if (btnExportSite) {
        btnExportSite.addEventListener('click', (e) => { e.preventDefault(); exportShortcuts(false); });
    }

    if (btnExportAll) {
        btnExportAll.addEventListener('click', (e) => { e.preventDefault(); exportShortcuts(true); });
    }

    function openModal() {
        importModal.style.display = 'flex';
        if (menuDropdown) menuDropdown.style.display = 'none';
        if (menuBurger) menuBurger.setAttribute('aria-expanded', 'false');
        document.addEventListener('keydown', handleFocusTrap);
        setTimeout(() => { document.getElementById('silent-start')?.focus(); }, 50);
        if(window.showAccessibleAlert) window.showAccessibleAlert("Import menu opened. Select a JSON file.", "info");
    }

    function closeModal() {
        if (!importModal || importModal.style.display === 'none') return;
        importModal.style.display = 'none';
        document.removeEventListener('keydown', handleFocusTrap);
        
        if (window.showAccessibleAlert) window.showAccessibleAlert("Import menu closed.", "info");
        
        if (isFullTabMode) {
            window.close();
        } else if (btnImport) {
            btnImport.focus(); 
        }
    }

    if (btnImport) {
        btnImport.addEventListener('click', (e) => {
            e.preventDefault();
            if (isFullTabMode) {
                openModal();
            } else {
                const currentHtmlFile = window.location.pathname; 
                chrome.tabs.create({ url: currentHtmlFile + "?importMode=true" });
                window.close(); 
            }
        });
    }

    if (btnCloseImport) btnCloseImport.addEventListener('click', closeModal);
    
    if (importModal) {
        importModal.addEventListener('click', (e) => { if (e.target === importModal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && importModal.style.display === 'flex') closeModal(); });
    }

    if (isFullTabMode) {
        document.body.appendChild(importModal);
        
        Array.from(document.body.children).forEach(child => {
            if (child !== importModal && child.tagName !== 'SCRIPT') {
                child.style.display = 'none';
            }
        });

        importModal.style.display = 'flex';
        importModal.style.position = 'fixed';
        importModal.style.top = '0';
        importModal.style.left = '0';
        importModal.style.width = '100vw';
        importModal.style.height = '100vh';
        importModal.style.backgroundColor = '#f8f9fa';
        importModal.style.zIndex = '999999';

        if (btnCloseImport) btnCloseImport.style.display = 'none';
        setTimeout(openModal, 100);
    }

    if (dropZone) {
        dropZone.setAttribute('role', 'button');
        dropZone.setAttribute('tabindex', '0');
        dropZone.setAttribute('aria-label', 'Upload JSON file. Press Enter to browse, or drag and drop a file here.');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
        
        dropZone.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            dropZone.style.backgroundColor = '#f0ebff'; 
        });
        dropZone.addEventListener('dragleave', () => { 
            dropZone.style.backgroundColor = ''; 
        });
        dropZone.addEventListener('drop', (e) => { 
            e.preventDefault(); 
            dropZone.style.backgroundColor = ''; 
            if (e.dataTransfer.files.length) {
                processFile(e.dataTransfer.files[0]); 
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => { 
            if (e.target.files.length) processFile(e.target.files[0]); 
            fileInput.value = ''; 
        });
    }

    function showConflictResolutionModal(msg, onReplace, onReplaceAll, onSkip, onSkipAll, onCancel) {
        let popupAnnouncer = document.getElementById('wkb-conflict-announcer');
        if (!popupAnnouncer) {
            popupAnnouncer = document.createElement('div');
            popupAnnouncer.id = 'wkb-conflict-announcer';
            popupAnnouncer.setAttribute('aria-live', 'assertive');
            popupAnnouncer.setAttribute('aria-atomic', 'true');
            popupAnnouncer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
            document.body.appendChild(popupAnnouncer);
        }
        popupAnnouncer.textContent = ''; 
        setTimeout(() => { popupAnnouncer.textContent = msg + " Press Tab to select options: Replace, Replace All, Skip, or Skip All."; }, 50);

        const overlay = document.createElement('div');
        overlay.id = 'wkb-conflict-modal';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 2147483648; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px);`;

        const modal = document.createElement('div'); 
        modal.setAttribute('role', 'dialog'); 
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = `position: relative; background: white; padding: 24px; border-radius: 8px; width: 380px; max-width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-align: center; font-family: sans-serif; animation: modal-fadein 0.2s ease-out; display: flex; flex-direction: column; gap: 16px;`;

        const closeIcon = document.createElement('button');
        closeIcon.innerHTML = '&times;';
        closeIcon.setAttribute('aria-label', 'Cancel entire import process');
        closeIcon.title = "Cancel Import";
        closeIcon.style.cssText = `position: absolute; top: 8px; right: 12px; background: transparent; border: none; font-size: 24px; color: #999; cursor: pointer; line-height: 1; padding: 0; font-weight: bold; outline: none; transition: color 0.2s;`;
        closeIcon.onmouseover = () => { closeIcon.style.color = '#333'; };
        closeIcon.onmouseout = () => { closeIcon.style.color = '#999'; };
        closeIcon.onfocus = () => { closeIcon.style.color = '#007BFF'; };
        closeIcon.onblur = () => { closeIcon.style.color = '#999'; };
        closeIcon.onclick = () => { overlay.remove(); onCancel(); };

        const text = document.createElement('p'); 
        text.innerText = msg;
        text.style.cssText = "margin: 10px 0 0 0; color: #333; font-size: 15px; line-height: 1.5; font-weight: 500; word-break: break-word;";

        const btnGrid = document.createElement('div'); 
        btnGrid.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 10px;";

        const createBtn = (text, bg, color, onClick) => {
            const btn = document.createElement('button');
            btn.innerText = text;
            btn.style.cssText = `padding: 10px; border: none; background: ${bg}; color: ${color}; border-radius: 4px; cursor: pointer; font-weight: bold; transition: opacity 0.2s;`;
            if(bg === 'transparent') { btn.style.border = "1px solid #ccc"; btn.style.background = "#f8f9fa"; }
            btn.onmouseover = () => { btn.style.opacity = '0.85'; };
            btn.onmouseout = () => { btn.style.opacity = '1'; };
            btn.onclick = () => { overlay.remove(); onClick(); };
            return btn;
        };

        const btnReplace = createBtn("Replace", "#FF9800", "white", onReplace);
        const btnReplaceAll = createBtn("Replace All", "#DC3545", "white", onReplaceAll);
        const btnSkip = createBtn("Skip", "transparent", "#333", onSkip);
        const btnSkipAll = createBtn("Skip All", "#6c757d", "white", onSkipAll);

        btnGrid.append(btnReplace, btnReplaceAll, btnSkip, btnSkipAll);
        modal.append(closeIcon, text, btnGrid); 
        overlay.appendChild(modal); 
        document.body.appendChild(overlay);

        const focusables = [closeIcon, btnReplace, btnReplaceAll, btnSkip, btnSkipAll];
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
                e.preventDefault(); 
                overlay.remove(); 
                onCancel(); 
            }
        });
        
        btnReplace.focus();
    }

    function processFile(file) {
        if (!file.name.endsWith('.json')) {
            if(window.showAccessibleAlert) window.showAccessibleAlert("Please use a .json file.", "error"); return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            let importedData;
            try {
                importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) throw new Error("Not array");
            } catch (err) { 
                if(window.showAccessibleAlert) window.showAccessibleAlert("Invalid JSON file format.", "error");
                return;
            }

            chrome.storage.local.get(null, (existingItems) => {
                const existingShortcuts = Object.values(existingItems).filter(item => item.id && item.key);
                let importCount = 0, skipCount = 0, replaceCount = 0;
                let globalConflictAction = null; 
                
                let pendingSaves = {};
                let keysToRemove = [];

                const finalizeBatchSave = () => {
                    
                    const finishUp = () => {
                        // FIX: Announce EXACTLY "Shortcuts imported"
                        if (window.showAccessibleAlert) window.showAccessibleAlert("Shortcuts imported", "success");
                        if (window.loadShortcuts) window.loadShortcuts();
                        
                        if (isFullTabMode) {
                            // FIX: Auto close window after 2 seconds
                            setTimeout(() => { window.close(); }, 2000);
                        } else {
                            importModal.style.display = 'none'; 
                            document.removeEventListener('keydown', handleFocusTrap); 
                            if (btnImport) setTimeout(() => btnImport.focus(), 100);
                        }
                    };

                    if (keysToRemove.length > 0) {
                        chrome.storage.local.remove(keysToRemove, () => {
                            if (Object.keys(pendingSaves).length > 0) chrome.storage.local.set(pendingSaves, finishUp);
                            else finishUp();
                        });
                    } else if (Object.keys(pendingSaves).length > 0) {
                        chrome.storage.local.set(pendingSaves, finishUp);
                    } else {
                        finishUp();
                    }
                };

                const handleCancel = () => {
                    importModal.style.display = 'none'; 
                    document.removeEventListener('keydown', handleFocusTrap); 
                    
                    if (window.showAccessibleAlert) window.showAccessibleAlert(`Import Cancelled.`, "info");
                    if (window.loadShortcuts) window.loadShortcuts();
                    
                    if (!isFullTabMode && btnImport) {
                        btnImport.focus(); 
                    }
                };

                const processItem = (index) => {
                    if (index >= importedData.length) {
                        finalizeBatchSave();
                        return;
                    }

                    const item = importedData[index];
                    if (!item.id || !item.key || !item.url) { processItem(index + 1); return; }

                    const normImpUrl = getNormUrl(item.url);
                    const conflict = existingShortcuts.find(ex => ex.key === item.key && (getNormUrl(ex.url) === normImpUrl || ex.url === "<URL>" || item.url === "<URL>"));

                    const handleReplace = () => {
                        keysToRemove.push(`shortcut_${conflict.id}`);
                        const cIndex = existingShortcuts.findIndex(e => e.id === conflict.id);
                        if (cIndex > -1) existingShortcuts.splice(cIndex, 1);
                        
                        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
                        item.id = newId;
                        
                        existingShortcuts.push(item);
                        pendingSaves[`shortcut_${newId}`] = item;
                        
                        replaceCount++;
                        processItem(index + 1);
                    };

                    const handleSkip = () => { skipCount++; processItem(index + 1); };

                    if (conflict) {
                        if (globalConflictAction === 'replace_all') {
                            handleReplace();
                        } else if (globalConflictAction === 'skip_all') {
                            handleSkip();
                        } else {
                            const msg = `Conflict! Key '${item.key}' is already used for '${conflict.name}'. What would you like to do?`;
                            showConflictResolutionModal(
                                msg,
                                () => { handleReplace(); },                                        
                                () => { globalConflictAction = 'replace_all'; handleReplace(); },  
                                () => { handleSkip(); },                                           
                                () => { globalConflictAction = 'skip_all'; handleSkip(); },
                                () => { handleCancel(); } 
                            );
                        }
                    } else { 
                        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
                        item.id = newId;
                        existingShortcuts.push(item); 
                        pendingSaves[`shortcut_${newId}`] = item;
                        importCount++;
                        processItem(index + 1); 
                    }
                };
                
                processItem(0); 
            });
        };
        
        reader.readAsText(file);
    }
});