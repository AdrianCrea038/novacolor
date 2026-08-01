document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('drop-zone');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const dashboard = document.getElementById('dashboard');
    
    const dupCount = document.getElementById('dup-count');
    const parenCount = document.getElementById('paren-count');
    const namesCount = document.getElementById('names-count');
    const missingCount = document.getElementById('missing-nk-count');
    const totalDupsFixedEl = document.getElementById('total-dups-fixed');
    const totalParensFixedEl = document.getElementById('total-parens-fixed');
    
    const tabDupCount = document.getElementById('tab-dup-count');
    const tabParenCount = document.getElementById('tab-paren-count');
    const tabNamesCount = document.getElementById('tab-names-count');
    const tabMissingCount = document.getElementById('tab-missing-count');
    
    const btnUnificar = document.getElementById('btn-unificar');
    const btnCorregir = document.getElementById('btn-corregir');
    const btnExportar = document.getElementById('btn-exportar');
    const btnExtraer = document.getElementById('btn-extraer');
    const btnSepararNk = document.getElementById('btn-separar-nk');
    const btnExportarSinNk = document.getElementById('btn-exportar-sin-nk');
    const btnCargarNkMaster = document.getElementById('btn-cargar-nk-master');
    
    const chkSplitSeparator = document.getElementById('chk-split-separator');
    const splitPartGroup = document.getElementById('split-part-group');
    const chkKeepQuotes = document.getElementById('chk-keep-quotes');
    const txtNkList = document.getElementById('txt-nk-list');
    
    const tabs = document.querySelectorAll('.tab');
    const lists = {
        dups: document.getElementById('dups-list'),
        parens: document.getElementById('parens-list'),
        names: document.getElementById('names-list'),
        missing: document.getElementById('missing-list')
    };

    // --- Nav Logic ---
    const navLimpieza = document.getElementById('nav-limpieza');
    const navPerfil = document.getElementById('nav-perfil');
    const viewLimpieza = document.getElementById('view-limpieza');
    const viewPerfil = document.getElementById('view-perfil');

    navLimpieza.addEventListener('click', () => {
        navLimpieza.classList.add('active');
        navPerfil.classList.remove('active');
        viewLimpieza.classList.remove('hidden');
        viewPerfil.classList.add('hidden');
    });

    navPerfil.addEventListener('click', () => {
        navPerfil.classList.add('active');
        navLimpieza.classList.remove('active');
        viewPerfil.classList.remove('hidden');
        viewLimpieza.classList.add('hidden');
    });

    // --- Perfil Logic ---
    const filePrincipal = document.getElementById('file-principal');
    const fileSecundario = document.getElementById('file-secundario');
    const infoPrincipal = document.getElementById('info-principal');
    const infoSecundario = document.getElementById('info-secundario');
    const btnProcesarPerfil = document.getElementById('btn-procesar-perfil');
    const btnExportarPerfil = document.getElementById('btn-exportar-perfil');
    const perfilStats = document.getElementById('perfil-stats');
    const perfilUpdateCount = document.getElementById('perfil-update-count');

    let textPrincipal = "";
    let textSecundario = "";
    let namePrincipal = "";
    let nameSecundario = "";
    let textPrincipalActualizado = "";
    let perfilChanges = [];

    function checkPerfilReady() {
        if (textPrincipal && textSecundario) {
            analyzePerfil();
        }
    }

    function analyzePerfil() {
        let secondaryLines = textSecundario.split('\n');
        let valuesMap = new Map();
        
        for (let line of secondaryLines) {
            // Updated regex to capture decimal numbers
            let match = line.match(/"([^"]+)"(?:[^\d]*)(\d+(?:\.\d+)?)/);
            if (match) {
                let numVal = parseFloat(match[2]).toFixed(6);
                valuesMap.set(match[1], { value: numVal, originalValue: match[2], sourceLine: line });
            }
        }

        let principalLines = textPrincipal.split('\n');
        perfilChanges = [];
        
        for (let i = 0; i < principalLines.length; i++) {
            let line = principalLines[i];
            let match = line.match(/"([^"]+)"/);
            if (match && valuesMap.has(match[1])) {
                let name = match[1];
                let secondaryData = valuesMap.get(name);
                let newValue = secondaryData.value;
                let secondaryLine = secondaryData.sourceLine;
                
                let oldValue = "";
                // Updated regex to capture decimal numbers
                let oldMatch = line.match(/"[^"]+"[^\d]*(\d+(?:\.\d+)?)/);
                if (oldMatch) {
                    oldValue = oldMatch[1];
                }
                
                // Only register the change if the old value is strictly different from the new 6-decimal formatted value
                if (oldValue !== newValue) {
                    // Create highlighted versions for preview
                    let highlightedPrincipal = line;
                    if (oldMatch) {
                        highlightedPrincipal = line.replace(/("[^"]+")([^\d]*)(\d+(?:\.\d+)?)/, (m, p1, p2, p3) => {
                            return p1 + p2 + `<mark style="background: rgba(239, 68, 68, 0.4); color: white; padding: 0 4px; border-radius: 4px;">${p3}</mark>`;
                        });
                    }
                    
                    let highlightedSecondary = secondaryLine.replace(/("[^"]+")([^\d]*)(\d+(?:\.\d+)?)/, (m, p1, p2, p3) => {
                        return p1 + p2 + `<mark style="background: rgba(16, 185, 129, 0.4); color: white; padding: 0 4px; border-radius: 4px;">${p3}</mark>`;
                    });

                    perfilChanges.push({
                        lineIndex: i,
                        name: name,
                        oldValue: oldValue || "(ninguno)",
                        newValue: newValue,
                        principalLine: highlightedPrincipal,
                        secondaryLine: highlightedSecondary
                    });
                }
            }
        }
        
        renderPerfilPreview();
        
        if (perfilChanges.length > 0) {
            perfilStats.classList.remove('hidden');
            btnProcesarPerfil.disabled = false;
        } else {
            perfilStats.classList.add('hidden');
            btnProcesarPerfil.disabled = true;
            showToast('No se encontraron coincidencias para actualizar.', 'warning');
        }
    }

    function renderPerfilPreview() {
        const container = document.getElementById('perfil-preview-list');
        const previewSection = document.getElementById('perfil-preview-container');
        
        if (perfilChanges.length === 0) {
            previewSection.classList.add('hidden');
            return;
        }
        
        previewSection.classList.remove('hidden');
        
        container.innerHTML = perfilChanges.map(change => `
            <div class="error-item" style="border-left-color: var(--primary); display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; padding: 1rem;">
                <div style="width: 100%; display: flex; justify-content: space-between;">
                    <code style="font-weight: bold; background: rgba(255,255,255,0.08); padding: 0.2rem 0.4rem; border-radius: 4px;">"${change.name}"</code>
                    <span class="line-num" style="color: var(--text-muted); font-size: 0.85rem;">Línea Principal ${change.lineIndex + 1}</span>
                </div>
                
                <div style="width: 100%; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 0.5rem; border-radius: 6px; border-left: 3px solid var(--danger);">
                        <strong style="color: var(--danger); font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Línea Principal (Original):</strong>
                        <code style="color: #e2e8f0; word-break: break-all;">${change.principalLine}</code>
                    </div>
                    
                    <div style="background: rgba(16, 185, 129, 0.1); padding: 0.5rem; border-radius: 6px; border-left: 3px solid var(--success);">
                        <strong style="color: var(--success); font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Línea Secundaria (Se aplicará valor: ${change.newValue}):</strong>
                        <code style="color: #e2e8f0; word-break: break-all;">${change.secondaryLine}</code>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filePrincipal.addEventListener('change', (e) => {
        if (e.target.files.length) {
            let f = e.target.files[0];
            namePrincipal = f.name;
            infoPrincipal.textContent = `Principal: ${f.name}`;
            infoPrincipal.classList.remove('hidden');
            let reader = new FileReader();
            reader.onload = (ev) => {
                textPrincipal = ev.target.result;
                checkPerfilReady();
            };
            reader.readAsText(f);
        }
    });

    fileSecundario.addEventListener('change', (e) => {
        if (e.target.files.length) {
            let f = e.target.files[0];
            nameSecundario = f.name;
            infoSecundario.textContent = `Secundario: ${f.name}`;
            infoSecundario.classList.remove('hidden');
            let reader = new FileReader();
            reader.onload = (ev) => {
                textSecundario = ev.target.result;
                checkPerfilReady();
            };
            reader.readAsText(f);
        }
    });

    btnProcesarPerfil.addEventListener('click', () => {
        showToast('Procesando actualizaciones...', 'info');
        btnProcesarPerfil.disabled = true;

        setTimeout(() => {
            let principalLines = textPrincipal.split('\n');
            let count = 0;
            
            for (let change of perfilChanges) {
                let line = principalLines[change.lineIndex];
                let updatedLine = line.replace(/("[^"]+")([^\d]*)(\d+(?:\.\d+)?)/, (m, p1, p2, p3) => {
                    return p1 + p2 + change.newValue;
                });
                
                if (updatedLine !== line) {
                    principalLines[change.lineIndex] = updatedLine;
                    count++;
                }
            }

            textPrincipalActualizado = principalLines.join('\n');
            perfilUpdateCount.textContent = count;
            btnExportarPerfil.classList.remove('hidden');
            btnProcesarPerfil.disabled = false;
            
            showToast(`¡Listo! Se actualizaron ${count} valores.`, 'success');
        }, 500);
    });

    btnExportarPerfil.addEventListener('click', () => {
        const blob = new Blob([textPrincipalActualizado], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        let baseName = namePrincipal ? namePrincipal.replace(/\.[^/.]+$/, "") : "principal";
        a.download = `${baseName}_actualizado.txt`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('¡Archivo principal actualizado exportado!', 'success');
    });


    const NK_MASTER_LIST = [
        "W887WK", "W885WK", "W507WK", "RW07WK", "T46843", "NK595353 B", "NK595353",
        "T42043", "T36943", "RW20WK", "NK729718", "NK728788", "NK1022685 15NA",
        "NK726466 15NA", "NK726466 15N", "NK726466 89L", "NK726466 Pinstripes",
        "NK726466 WGREY", "NK726466 WGRY", "NK726466WGREY", "10A WHITE STANDARD",
        "NK723141M", "NK-719001", "NK717270", "NK711077", "NK711075", "NK710145",
        "NK710142", "NK700749", "NK700747", "NK700742", "NK675426", "NK658847",
        "NK675426B", "NK652165 4EY", "NK652165 EY", "NK652165 65N", "NK652165 89L",
        "NK652165 15NA", "NK652165 15N", "NK652165 4EV", "NK652165 69W", "NK612559",
        "NK584374", "579M", "NK579M", "NK50615M", "NK50276M", "NK50254", "NK1043135M",
        "NK1042527", "NK1035122", "NK1033023M", "NK1033023", "NK1028203",
        "NK1022685 69W", "NK1022685 WG", "NK1022685 65N", "NK1022685 89L",
        "NK1022685 4EV", "NK1022685 VALOR", "NK1022684", "NK1022170M",
        "NK1013759 WGRY", "NK1013759 WGY", "NK1013759 4EY", "NK1013759 65N",
        "NK1013759 89L", "NK1022685  15NA", "NK1022685 15N", "NK1022685  15N",
        "NK1013759 4EV", "NK1013759 69W", "NK1006640", "NK1006639", "NK1006638 L",
        "NK1006638", "NK1006637", "NK-3537WK", "H3536M", "H3353", "H3319", "NK578M",
        "574WK", "574WB", "574WK P", "574WKP", "565WB S", "565WB", "4844-18",
        "3442-64", "NK700750", "RW47WK", "1997-18", "W160WK", "W561WK", "W536WK",
        "W213WK", "NK1023287", "NK-1012066M"
    ];

    let currentText = "";
    let originalFilename = "";
    let duplicateErrors = [];
    let parenthesisErrors = [];
    let extractedNames = [];
    let missingNkErrors = [];

    // Counters for corrected items
    let totalDupsRemoved = 0;
    let totalParensFixed = 0;

    // File Drag & Drop logic
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.name.endsWith('.txt')) {
            showToast('Por favor sube un archivo .txt válido', 'error');
            return;
        }

        originalFilename = file.name;
        fileName.textContent = `Archivo cargado: ${file.name}`;
        fileInfo.classList.remove('hidden');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            currentText = e.target.result;
            showToast('Archivo leído correctamente. Analizando...', 'info');
            // Reset counters on new file
            totalDupsRemoved = 0;
            totalParensFixed = 0;
            analyzeText();
            dashboard.classList.remove('hidden');
        };
        reader.readAsText(file);
    }

    function getPotentialNk(name) {
        if (!name) return null;
        let cleaned = name.replace(/"/g, '').trim();
        let parts = cleaned.split(/\s+/);
        if (parts.length === 0) return null;
        let first = parts[0];
        
        // A potential NK code starts with NK, W, RW, H, T or digits (length >= 2) followed by numbers
        let isNkPattern = /^(NK|W|RW|H|T|\d{2,})/i.test(first) && /[0-9]/.test(first);
        if (!isNkPattern) return null;
        
        if (parts.length > 1) {
            let second = parts[1];
            let commonWords = /^(TELA|RED|BLUE|WHITE|GREY|GRAY|BLACK|PINK|GREEN|YELLOW|GOLD|ORANGE|PURPLE|BROWN|NAVY|ROYAL|ROJO|AZUL|NEGRO|BLANCO|VERDE|GRIS|AMARILLO|NARANJA|MORADO|CAFE|MARRON)$/i;
            if (second.length <= 6 && /^[A-Z0-9]+$/i.test(second) && !commonWords.test(second)) {
                return `${first} ${second}`;
            }
        }
        return first;
    }

    function addNkToMasterList(nk) {
        let currentValue = txtNkList.value;
        let lines = currentValue.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (!lines.some(l => l.toLowerCase() === nk.toLowerCase())) {
            lines.push(nk);
            txtNkList.value = lines.join('\n');
            showToast(`Código "${nk}" agregado a la lista Master.`, 'success');
            analyzeText();
        } else {
            showToast(`El código "${nk}" ya está en la lista.`, 'info');
        }
    }

    function analyzeText() {
        let lines = currentText.split('\n');
        
        duplicateErrors = [];
        parenthesisErrors = [];
        extractedNames = [];
        missingNkErrors = [];
        
        let seenNames = new Set();
        let seenMissing = new Set();
        let hasQuotes = currentText.includes('"');
        
        // Get the list of NK codes currently in the textarea
        let nkLines = txtNkList.value.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let name = "";
            let found = false;
            
            if (hasQuotes) {
                let nameMatch = line.match(/"([^"]*)"/);
                if (nameMatch) {
                    name = nameMatch[1];
                    found = true;
                }
            } else {
                let trimmed = line.trim();
                if (trimmed.length > 0) {
                    name = trimmed;
                    found = true;
                }
            }
            
            if (found) {
                extractedNames.push({ lineIndex: i, name: name });
                
                // Check parenthesis
                if (/\(\d+\)/.test(name)) {
                    parenthesisErrors.push({ lineIndex: i, name: name });
                }
                
                // Check duplicate
                if (seenNames.has(name)) {
                    duplicateErrors.push({ lineIndex: i, name: name });
                } else {
                    seenNames.add(name);
                }
                
                // Check for missing NK code
                let pot = getPotentialNk(name);
                if (pot) {
                    let lowerPot = pot.toLowerCase();
                    let alreadyInList = nkLines.some(nk => nk.toLowerCase() === lowerPot);
                    if (!alreadyInList) {
                        if (!seenMissing.has(lowerPot)) {
                            seenMissing.add(lowerPot);
                            missingNkErrors.push({
                                lineIndex: i,
                                name: name,
                                missingNk: pot
                            });
                        }
                    }
                }
            }
        }
        
        updateUI();
    }

    function updateUI() {
        // Update stats
        dupCount.textContent = duplicateErrors.length;
        parenCount.textContent = parenthesisErrors.length;
        namesCount.textContent = extractedNames.length;
        missingCount.textContent = missingNkErrors.length;
        
        tabDupCount.textContent = duplicateErrors.length;
        tabParenCount.textContent = parenthesisErrors.length;
        tabNamesCount.textContent = extractedNames.length;
        tabMissingCount.textContent = missingNkErrors.length;
        
        totalDupsFixedEl.textContent = totalDupsRemoved;
        totalParensFixedEl.textContent = totalParensFixed;

        // Render preview lists
        renderList(lists.dups, duplicateErrors, 'dup');
        renderList(lists.parens, parenthesisErrors, 'paren');
        renderList(lists.names, extractedNames, 'names');
        renderList(lists.missing, missingNkErrors, 'missing');

        // Button states
        btnUnificar.disabled = duplicateErrors.length === 0;
        btnCorregir.disabled = parenthesisErrors.length === 0;
        btnExtraer.disabled = extractedNames.length === 0;
        btnExportarSinNk.disabled = extractedNames.length === 0;
        
        // Export only enabled if there are NO errors and we have a file
        btnExportar.disabled = (duplicateErrors.length > 0 || parenthesisErrors.length > 0);
        
        if (duplicateErrors.length === 0 && parenthesisErrors.length === 0 && currentText.trim().length > 0) {
            btnExportar.classList.add('pulse');
        } else {
            btnExportar.classList.remove('pulse');
        }
    }

    function renderList(container, errors, type) {
        if (errors.length === 0) {
            let emptyMsg = type === 'names' ? 'No se encontraron nombres en el archivo.' : 
                           (type === 'missing' ? 'No hay NKs faltantes. ¡Todo al día! 🎉' : 'No se encontraron anomalías. 🎉');
            container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted)">${emptyMsg}</div>`;
            return;
        }

        if (type === 'missing') {
            container.innerHTML = errors.map(err => `
                <div class="error-item missing" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.75rem 1rem;">
                    <div style="display: flex; flex-direction: column; gap: 0.25rem; text-align: left; width: 100%;">
                        <div>
                            <code style="color: #f97316; font-weight: bold; font-size: 0.95rem; background: rgba(249, 115, 22, 0.1); padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid rgba(249, 115, 22, 0.2);">${err.missingNk}</code>
                            <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">detectado en:</span>
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-main); line-height: 1.4; margin-top: 0.25rem;">
                            <code>"${err.name}"</code>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0;">
                        <button class="btn success btn-add-nk" data-nk="${err.missingNk}" style="padding: 0.4rem 0.75rem; font-size: 0.85rem; height: auto; border-radius: 6px; white-space: nowrap;">
                            ➕ Agregar
                        </button>
                        <span class="line-num" style="margin-top: 0.25rem; font-size: 0.75rem;">Línea ${err.lineIndex + 1}</span>
                    </div>
                </div>
            `).join('');

            // Add event listeners to the buttons
            container.querySelectorAll('.btn-add-nk').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    let nkToAdd = e.currentTarget.dataset.nk;
                    addNkToMasterList(nkToAdd);
                });
            });
            return;
        }

        container.innerHTML = errors.map(err => `
            <div class="error-item ${type}">
                <div>
                    <code>${type === 'names' ? err.name : `"${err.name}"`}</code>
                </div>
                <div class="line-num">Línea ${err.lineIndex + 1}</div>
            </div>
        `).join('');
    }

    // Tabs logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            Object.values(lists).forEach(l => l.classList.remove('active'));
            lists[tab.dataset.tab].classList.add('active');
        });
    });

    // Actions
    btnUnificar.addEventListener('click', () => {
        if (duplicateErrors.length === 0) return;
        showToast('Procesando: Unificando duplicados...', 'info');
        btnUnificar.disabled = true; // prevent double clicks
        
        setTimeout(() => {
            let lines = currentText.split('\n');
            let seenNames = new Set();
            let newLines = [];
            let count = 0;
            let hasQuotes = currentText.includes('"');
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let name = "";
                let found = false;
                
                if (hasQuotes) {
                    let nameMatch = line.match(/"([^"]*)"/);
                    if (nameMatch) {
                        name = nameMatch[1];
                        found = true;
                    }
                } else {
                    let trimmed = line.trim();
                    if (trimmed.length > 0) {
                        name = trimmed;
                        found = true;
                    }
                }
                
                if (found) {
                    if (seenNames.has(name)) {
                        count++;
                        // skip adding to newLines
                    } else {
                        seenNames.add(name);
                        newLines.push(line);
                    }
                } else {
                    newLines.push(line);
                }
            }
            
            currentText = newLines.join('\n');
            totalDupsRemoved += count;
            analyzeText();
            showToast(`¡Listo! ${count} duplicados eliminados.`, 'success');
        }, 600);
    });

    btnCorregir.addEventListener('click', () => {
        if (parenthesisErrors.length === 0) return;
        showToast('Procesando: Corrigiendo paréntesis...', 'info');
        btnCorregir.disabled = true;
        
        setTimeout(() => {
            let lines = currentText.split('\n');
            let count = 0;
            let hasQuotes = currentText.includes('"');
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let name = "";
                let found = false;
                
                if (hasQuotes) {
                    let nameMatch = line.match(/"([^"]*)"/);
                    if (nameMatch) {
                        name = nameMatch[1];
                        found = true;
                    }
                } else {
                    let trimmed = line.trim();
                    if (trimmed.length > 0) {
                        name = trimmed;
                        found = true;
                    }
                }
                
                if (found && /\(\d+\)/.test(name)) {
                    let newName = name.replace(/\s*\(\d+\)\s*/g, ' ').trim();
                    if (hasQuotes) {
                        lines[i] = line.replace(`"${name}"`, `"${newName}"`);
                    } else {
                        lines[i] = newName;
                    }
                    count++;
                }
            }
            
            currentText = lines.join('\n');
            totalParensFixed += count;
            analyzeText();
            showToast(`¡Listo! ${count} nombres corregidos.`, 'success');
        }, 600);
    });

    btnExportar.addEventListener('click', () => {
        if (btnExportar.disabled) return;
        showToast('Preparando exportación...', 'info');
        
        setTimeout(() => {
            const blob = new Blob([currentText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Limpio_${originalFilename}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('¡Archivo exportado con éxito!', 'success');
        }, 300);
    });

    // Toggle split part settings when separator checkbox changes
    chkSplitSeparator.addEventListener('change', (e) => {
        if (e.target.checked) {
            splitPartGroup.style.display = 'flex';
        } else {
            splitPartGroup.style.display = 'none';
        }
    });

    btnExtraer.addEventListener('click', () => {
        if (extractedNames.length === 0) return;
        showToast('Procesando: Separando y extrayendo nombres...', 'info');
        btnExtraer.disabled = true;

        setTimeout(() => {
            let splitSep = chkSplitSeparator.checked;
            let keepQuotes = chkKeepQuotes.checked;
            let splitPart = document.querySelector('input[name="split-part"]:checked').value;
            
            let newLines = [];
            let seen = new Set();
            
            for (let item of extractedNames) {
                let name = item.name;
                
                if (splitSep) {
                    // Split by hyphen - or diagonal /
                    let parts = name.split(/\s*-\s*|\s*\/\s*/);
                    if (parts.length > 1) {
                        if (splitPart === 'left') {
                            name = parts[0].trim();
                        } else {
                            name = parts.slice(1).join(' - ').trim();
                        }
                    }
                }
                
                if (keepQuotes) {
                    name = `"${name}"`;
                }
                
                // Automatically de-duplicate to ensure a clean list and enable immediate export
                if (!seen.has(name)) {
                    seen.add(name);
                    newLines.push(name);
                }
            }
            
            currentText = newLines.join('\n');
            
            // Switch view to the names preview tab to show the result
            tabs.forEach(t => t.classList.remove('active'));
            const namesTab = Array.from(tabs).find(t => t.dataset.tab === 'names');
            if (namesTab) namesTab.classList.add('active');
            
            Object.values(lists).forEach(l => l.classList.remove('active'));
            lists.names.classList.add('active');
            
            analyzeText();
            btnExtraer.disabled = false;
            showToast('¡Listo! Nombres extraídos, separados y unificados.', 'success');
        }, 600);
    });

    btnSepararNk.addEventListener('click', () => {
        if (extractedNames.length === 0) return;
        
        let nkInput = txtNkList.value.trim();
        if (!nkInput) {
            showToast('Por favor, ingresa al menos un código NK en la lista.', 'error');
            return;
        }

        // Split by lines or commas, trim and remove empty elements
        let nkList = nkInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
        if (nkList.length === 0) {
            showToast('Por favor, ingresa al menos un código NK válido.', 'error');
            return;
        }

        showToast('Procesando: Separando códigos NK...', 'info');
        btnSepararNk.disabled = true;

        setTimeout(() => {
            let newLines = [];
            let seen = new Set();
            let hasQuotes = currentText.includes('"');
            
            // Get the selected part of the NK to keep
            let nkPart = document.querySelector('input[name="nk-part"]:checked').value;

            for (let item of extractedNames) {
                let name = item.name;
                let earliestIndex = -1;
                let matchedNk = "";
                let lowerName = name.toLowerCase();
                
                // Find the first occurrence among all NKs from the list
                for (let nk of nkList) {
                    let lowerNk = nk.toLowerCase();
                    let idx = lowerName.indexOf(lowerNk);
                    if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
                        earliestIndex = idx;
                        matchedNk = nk;
                    }
                }
                
                // If found, slice according to selected option
                if (earliestIndex !== -1) {
                    if (nkPart === 'complete') {
                        name = name.substring(earliestIndex).trim();
                    } else if (nkPart === 'code') {
                        // Keep exactly the matched NK code from the string (preserving casing)
                        name = name.substring(earliestIndex, earliestIndex + matchedNk.length).trim();
                    } else if (nkPart === 'rest') {
                        // Keep only what's to the right of the matched NK code
                        let rest = name.substring(earliestIndex + matchedNk.length).trim();
                        // Clean up leading spaces, hyphens, and diagonals
                        name = rest.replace(/^[\s\-\/]+/, '').trim();
                    } else if (nkPart === 'remove') {
                        name = cleanNkFromName(name, matchedNk);
                    }
                }
                
                // Only keep non-empty names
                if (name.length > 0) {
                    if (hasQuotes) {
                        name = `"${name}"`;
                    }
                    
                    // De-duplicate
                    if (!seen.has(name)) {
                        seen.add(name);
                        newLines.push(name);
                    }
                }
            }
            
            currentText = newLines.join('\n');
            
            // Switch view to the names preview tab
            tabs.forEach(t => t.classList.remove('active'));
            const namesTab = Array.from(tabs).find(t => t.dataset.tab === 'names');
            if (namesTab) namesTab.classList.add('active');
            
            Object.values(lists).forEach(l => l.classList.remove('active'));
            lists.names.classList.add('active');
            
            analyzeText();
            btnSepararNk.disabled = false;
            showToast('¡Listo! Separación de NK completada y unificada.', 'success');
        }, 600);
    });

    btnExportarSinNk.addEventListener('click', () => {
        if (extractedNames.length === 0) return;
        
        let nkInput = txtNkList.value.trim();
        if (!nkInput) {
            showToast('Por favor, ingresa al menos un código NK en la lista.', 'error');
            return;
        }

        // Split by lines or commas, trim and remove empty elements
        let nkList = nkInput.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0);
        if (nkList.length === 0) {
            showToast('Por favor, ingresa al menos un código NK válido.', 'error');
            return;
        }

        showToast('Generando archivo sin códigos NK...', 'info');

        setTimeout(() => {
            let newLines = [];
            let seen = new Set();
            let hasQuotes = currentText.includes('"');
            
            for (let item of extractedNames) {
                let name = item.name;
                let earliestIndex = -1;
                let matchedNk = "";
                let lowerName = name.toLowerCase();
                
                // Find matching NK
                for (let nk of nkList) {
                    let lowerNk = nk.toLowerCase();
                    let idx = lowerName.indexOf(lowerNk);
                    if (idx !== -1 && (earliestIndex === -1 || idx < earliestIndex)) {
                        earliestIndex = idx;
                        matchedNk = nk;
                    }
                }
                
                // Remove matching NK
                if (earliestIndex !== -1) {
                    name = cleanNkFromName(name, matchedNk);
                }
                
                // Only keep non-empty names
                if (name.length > 0) {
                    if (hasQuotes) {
                        name = `"${name}"`;
                    }
                    
                    // De-duplicate
                    if (!seen.has(name)) {
                        seen.add(name);
                        newLines.push(name);
                    }
                }
            }
            
            if (newLines.length === 0) {
                showToast('El resultado está vacío.', 'error');
                return;
            }
            
            // Trigger direct download
            let textToExport = newLines.join('\n');
            let blob = new Blob([textToExport], { type: "text/plain;charset=utf-8" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            
            // Build filename based on original
            let baseName = originalFilename ? originalFilename.replace(/\.[^/.]+$/, "") : "archivo";
            a.download = `${baseName}_sin_nk.txt`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('¡Archivo sin NK descargado con éxito!', 'success');
        }, 500);
    });

    btnCargarNkMaster.addEventListener('click', () => {
        txtNkList.value = NK_MASTER_LIST.join('\n');
        showToast("Lista NK's Master cargada con éxito.", "success");
    });

    function cleanNkFromName(name, nk) {
        if (!nk) return name;
        // Escape regex special characters
        let escapedNk = nk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Matches the NK code and any immediately surrounding spaces, hyphens, or diagonals
        let regex = new RegExp('\\s*[-/]?\\s*' + escapedNk + '\\s*[-/]?\\s*', 'gi');
        return name.replace(regex, ' ').replace(/\s+/g, ' ').trim();
    }

    // Toast functionality
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = type === 'success' ? '✅' : 'ℹ️';
        if(type === 'error') icon = '❌';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
});
