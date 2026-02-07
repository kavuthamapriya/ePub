const mappedPreviewState = new Map();

//function applyMappings() {
//    const parser = new DOMParser();
//    const serializer = new XMLSerializer();
//    const doc = parser.parseFromString(xhtmlEditor.getValue(), 'application/xml');

//    document.querySelectorAll('tbody tr').forEach(row => {
//        const source = row.cells[0].innerText;
//        const target = row.querySelector('select').value;

//        if (!target) return;

//        doc.querySelectorAll(source).forEach(node => {
//            const newNode = doc.createElement(target);
//            newNode.innerHTML = node.innerHTML;

//            // Preserve attributes where needed
//            [...node.attributes].forEach(attr => {
//                if (attr.name !== 'class') {
//                    newNode.setAttribute(attr.name, attr.value);
//                }
//            });

//            node.replaceWith(newNode);
//        });
//    });

//    xhtmlEditor.setValue(serializer.serializeToString(doc));
//}

function highlightElement(mappedElement) {
    mappedElement.setAttribute('data-mapped', 'true');
}

function applyTagMapping() {

    //const xhtml = document.getElementById('xhtmlPreview').getValue()  //window.xhtmlEditor.getValue();
    const mappings = [];

    var selectedXhtmlFile = null;
    const selectedItem = document.querySelector(
        '#xhtmlFiles .list-group-item.active'
    );

    if (selectedItem) {
        selectedXhtmlFile = selectedItem.textContent.trim();
        console.log(selectedXhtmlFile);
    }

    let target = "";
    let highlightcond = false;
    document.querySelectorAll('.tag-map-row').forEach(row => {
        const source = row.querySelector('.source-tag').innerText;
        const sourceclass = row.querySelector('.source-tag').getAttribute('classname') || '';

        if (document.getElementById('enableHighlightOption').checked) {
            target = row.querySelector('.source-tag').innerText;
            highlightcond = true;
            document.getElementById('enableHighlightOption').checked = false;
        }
        else {
            target = row.querySelector('.mapped-tag').value;
        }

        if (target) {
            mappings.push({ source, sourceclass, target });
        }
        else {
            alert("You are not selected the target Tag.");
        }

    });

    registerMappedFile(selectedXhtmlFile, mappings);

    fetch('/Epub/ApplyTagMapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            JobId: currentJobId,
            File: selectedXhtmlFile,            
            Mappings : mappings
        })
    })
        .then(r => r.text())
        .then(updated => {
            const iframe = document.getElementById('xhtmlPreview');
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            doc.open();
            doc.write(updated);
            doc.close();

            iframe.addEventListener('load', () => {
                const doc = iframe.contentDocument;
                const fileName = selectedXhtmlFile;

                const selectorSet = mappedPreviewState.get(fileName);
                if (!selectorSet) return;

                selectorSet.forEach(selector => {
                    doc.querySelectorAll(selector).forEach(el => {
                        el.setAttribute('data-preview-mapped', el.tagName.toLowerCase());
                    });
                });
            });

            injectPreviewHelpers(iframe);

            //window.xhtmlEditor.setValue(updated);
        });

    document.getElementById('mappingPanel').classList.remove('show');
    document.getElementById('overlaymap').classList.remove('show');
    if (highlightcond == true) {
        showMapToast('Highlighted');
    }
    else {
        showMapToast('Mapping completed successfully');
    }

    //const iframe = document.getElementById('xhtmlPreview');
    //injectPreviewHelpers(iframe);

    //const iframe = document.getElementById('xhtmlPreview');
    //iframe.onload = () => {
    //    attachPreviewClickHandler(iframe);
    //};
}

function attachPreviewClickHandler(iframe) {
    const doc = iframe.contentDocument;

    doc.removeEventListener('click', previewClickHandler);
    doc.addEventListener('click', previewClickHandler, true);
}

function previewClickHandler(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target.closest('*');
    if (!el) return;

    clearPreviousSelection(e.currentTarget);
    markSelected(el);
}

function clearPreviousSelection(doc) {
    doc.querySelectorAll('[data-selected]')
        .forEach(el => el.removeAttribute('data-selected'));
}
function markSelected(el) {
    el.setAttribute('data-selected', 'true');
}

function showMapToast(message, duration = 3000) {
    const toast = document.getElementById('maptoast');
    toast.innerText = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

//function applyGroupMapping() {

//    fetch(`/Epub/GetXhtmlFiles?jobId=${currentJobId}`)
//        .then(r => r.json())
//        .then(files => {
//            const list = document.querySelector('.grpfile-list');
//            list.innerHTML = '';

//            files.forEach(f => {
//                list.innerHTML += `
//                    <label>
//                        <input type="checkbox" value="${f}">
//                        ${f}
//                    </label>
//                `;
//            });

//            document.getElementById('fileSelectPanel').classList.add('show');
//        });
//}

function confirmGroupMapping() {
    const selected = [...document.querySelectorAll('.grpfile-list input:checked')]
        .map(cb => cb.value);

    if (selected.length === 0) {
        alert("Select at least one file");
        return;
    }

    applyMappingToFiles(selected);
}

function applyGroupMapping() {
    const overlay = document.getElementById('confirmOverlay');
    overlay.classList.remove('hidden');

    document.getElementById('confirmOk').onclick = () => {
        overlay.classList.add('hidden');
        applyMappingToFiles(); // your existing apply logic
        document.getElementById('mappingPanel').classList.remove('show');
        document.getElementById('overlaymap').classList.remove('show');
        //document.getElementById('fileSelectPanel').classList.remove('show');
        showMapToast('Group mapping completed successfully');
        //closeFilePanel();
    };

    document.getElementById('confirmCancel').onclick = () => {
        overlay.classList.add('hidden');
    };
}

function applyMappingToFiles() {

    const mappings = [];

    document.querySelectorAll('.tag-map-row').forEach(row => {
        let target = "";
        const source = row.querySelector('.source-tag').innerText;
        const sourceclass = row.querySelector('.source-tag').getAttribute('classname') || '';
        if (document.getElementById('enableHighlightOption').checked) {
            target = row.querySelector('.source-tag').innerText;
            document.getElementById('enableHighlightOption').checked = false;
        }
        else {
            target = row.querySelector('.mapped-tag').value;
        }

        if (target) {
            mappings.push({ source, sourceclass, target });
        }
        else {
            alert("You are not selected the target Tag.");
        }

    });

    //mappingInfo = mappings;

    var selectedXhtmlFile = null;
    const selectedItem = document.querySelector(
        '#xhtmlFiles .list-group-item.active'
    );

    if (selectedItem) {
        selectedXhtmlFile = selectedItem.textContent.trim();
        console.log(selectedXhtmlFile);
    }

    const selectedFiles = document.querySelectorAll(
        '#xhtmlFiles .list-group-item'
    );

    const allFiles = [...selectedFiles].map(item =>
        item.textContent.trim()
    );

    allFiles.forEach(singlefile => {
        registerMappedFile(singlefile, mappings);
    });

    allFiles.forEach(file => {
        unMarkFileAsUpdated(file);
    });

        fetch('/Epub/ApplyGroupMapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            JobId: currentJobId,
            Files: allFiles,
            File: selectedXhtmlFile,
            Mappings: mappings
        })
    })
        .then(response  => response.json())
        .then(res => {

            const iframe = document.getElementById('xhtmlPreview');
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            doc.open();
            doc.write(res.xhtmlText);
            //highlightMappedElements(doc, mappings);
            doc.close();

            iframe.addEventListener('load', () => {
                const doc = iframe.contentDocument;
                const fileName = selectedXhtmlFile;

                const selectorSet = mappedPreviewState.get(fileName);
                if (!selectorSet) return;

                selectorSet.forEach(selector => {
                    doc.querySelectorAll(selector).forEach(el => {
                        el.setAttribute('data-preview-mapped', el.tagName.toLowerCase());
                    });
                });
            });

            res.updatedFiles.forEach(file => {
                markFileAsUpdated(file);
            });

            injectPreviewHelpers(iframe);
        })
        .catch(err => alert(err.message));
}

function markFileAsUpdated(fileName) {
    document
        .querySelectorAll('#xhtmlFiles .list-group-item')
        .forEach(li => {
            if (li.textContent.trim() === fileName) {
                li.classList.add('file-updated');
            }
        });
}

function unMarkFileAsUpdated(fileName) {
    document
        .querySelectorAll('#xhtmlFiles .list-group-item')
        .forEach(li => {
            if (li.textContent.trim() === fileName) {
                li.classList.remove('file-updated');
            }
        });
}

function highlightMappedElements(doc, mappings) {
    mappings.forEach(m => {
        const selector = mappingToPreviewSelector(m);

        doc.querySelectorAll(selector).forEach(el => {
            el.setAttribute('data-preview-mapped', 'true');
        });
    });
}

function mappingToPreviewSelector(mapping) {
    const tag = mapping.target.toLowerCase();
    const cls = mapping.sourceClass?.trim();

    return cls
        ? `${tag}.${CSS.escape(cls)}`
        : tag;
}
function registerMappedFile(fileName, mappings) {
    if (!mappedPreviewState.has(fileName)) {
        mappedPreviewState.set(fileName, new Set());
        //mappedPreviewState.set(fileName);
    }

    const selectorSet = mappedPreviewState.get(fileName);

    mappings.forEach(m => {
        const tag = m.target.toLowerCase();
        const cls = m.sourceClass?.trim();
        const selector = cls
            ? `${tag}.${CSS.escape(cls)}`
            : tag;

        selectorSet.add(selector);
    });
    //if (selectorSet) {
    //    document.getElementById('clearhighlights').classList.add('show');
    //}
}
function closeFilePanel() {
    document.getElementById('fileSelectPanel').classList.remove('show');
}