let currentJobId = window.appContext.jobId;
let currentFile = null;
let mappedTagsCache = [];
let xhtmlEditor = null;
let mappedElement = null;
let savedSelectionRange = null;

//const filePanel = document.getElementById('filePanel');
//const toggleBtn = document.getElementById('filePanelToggle');

//toggleBtn.addEventListener('click', () => {
//    const collapsed = filePanel.classList.toggle('collapsed');
//    toggleBtn.textContent = collapsed ? '>' : '<';
//});

//document.addEventListener('keydown', e => {
//    if (e.key === 'Escape') {
//        filePanel.classList.add('collapsed');
//        toggleBtn.textContent = '>';
//    }
//});
function loadFileList() {
    //currentJobId = jobId;
    fetch(`/Epub/GetXhtmlFiles?jobId=${currentJobId}`)
        .then(r => r.json())
        .then(files => {
            const list = document.getElementById('xhtmlFiles');
            list.innerHTML = '';

            files.forEach(file => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = file;

                li.onclick = () => selectFile(li, file);

                list.appendChild(li);
            });
        });
}

function selectFile(li, file) {
    document.querySelectorAll('#xhtmlFiles li')
        .forEach(x => x.classList.remove('active'));

    li.classList.add('active');
    currentFile = file;

    const iframe = document.getElementById('xhtmlPreview');
    iframe.addEventListener('load', () => {
        const doc = iframe.contentDocument;
        const fileName = currentFile;

        const selectorSet = mappedPreviewState.get(fileName);
        if (!selectorSet) return;

        selectorSet.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => {
                el.setAttribute('data-preview-mapped', el.tagName.toLowerCase());
            });
        });
    });

    loadXhtmlContent(file);
}

function clearAllPreviewMappings() {
    mappedPreviewState.clear();
    clearAllPreviewTagHighlights();
    loadXhtmlContent(currentFile);
    //document.getElementById('clearhighlights').classList.remove('show');
}
function clearAllPreviewTagHighlights() {
    const iframe = document.getElementById('xhtmlPreview');
    const doc = iframe?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll('[data-preview-tag]')
        .forEach(el => el.removeAttribute('data-preview-tag'));

    document
        .querySelectorAll('#xhtmlFiles .list-group-item')
        .forEach(li => {
            li.classList.remove('file-updated');
        });
}
function loadXhtmlContent(file) {
    //if (!window.xhtmlEditor) {
    //    console.error('Editor not ready');
    //    return;
    //}
    fetch(`/Epub/LoadXhtml?jobId=${currentJobId}&file=${encodeURIComponent(file)}`)
        .then(r => r.text())
        .then(content => {

            const iframe = document.getElementById('xhtmlPreview');
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            doc.open();
            //injectMappingHighlightStyles(doc);
            doc.write(content);
            doc.close();
            injectPreviewHelpers(iframe);
            
            iframe.onload = () => {
                injectPreviewStyles(iframe);
                //attachPreviewClickHandler(iframe);
                //decoratePreviewTags(iframe);
                markAllPreviewTags(iframe);
            };
            //window.xhtmlEditor.setValue(content);
            //extractTagsFromEditor();
        });
}

try {
    document.getElementById('btnSetParent').addEventListener('click', () => {
        const iframe = document.getElementById('xhtmlPreview');
        saveIframeSelection(iframe);
        openParentTagDialog();
    });
} catch (error) { }

function openParentTagDialog() {
    document.getElementById('parentTagModal').classList.remove('hidden');
}

function closeParentTagDialog() {
    document.getElementById('parentTagModal').classList.add('hidden');
}

try { 
    document.getElementById('parentOk').addEventListener('click', () => {
        const tag = document.getElementById('parentTagSelect').value;
        const iframe = document.getElementById('xhtmlPreview');
        applyParentWrapFromSavedSelection(iframe, tag);
        closeParentTagDialog();
    });
} catch (error) { }

try{
    document.getElementById('parentCancel').addEventListener('click', () => {
        document.getElementById('parentTagModal').classList.add('hidden');
    });
} catch (error) { }

function saveIframeSelection(iframe) {
    const sel = iframe.contentWindow.getSelection();
    if (sel && sel.rangeCount > 0) {
        savedSelectionRange = sel.getRangeAt(0);
    }
}

function getIframeSelection(iframe) {
    const win = iframe.contentWindow;
    return win.getSelection();
}

function applyParentWrapFromSavedSelection(iframe, parentTag) {
    if (!savedSelectionRange) return;

    const doc = iframe.contentDocument;
    const range = savedSelectionRange;

    const container = range.commonAncestorContainer.nodeType === 1
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;

    const elements = [];
    if (
        container.nodeType === 1 &&
        container.matches('h1,h2,h3,h4,h5,h6,p,div') &&
        range.intersectsNode(container)
    ) {
        elements.push(container);
    }

    // 2️⃣ include descendants
    container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div').forEach(el => {
        if (range.intersectsNode(el)) {
            elements.push(el);
        }
    });

    if (!elements.length) return;

    //const wrapper = doc.createElement(parentTag);
    //elements[0].parentNode.insertBefore(wrapper, elements[0]);
    //elements.forEach(el => wrapper.appendChild(el));

    fetch('/Epub/SetParentTag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            File: currentFile,
            parentTag: parentTag,
            Tag: elements[0].tagName.toLowerCase(),
            Class: elements[0].getAttribute('class'),
            JobId: currentJobId
        })
    })

    .then(r => r.text())
    .then(updated => {
        const iframe = document.getElementById('xhtmlPreview');
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        doc.open();
        doc.write(updated);
        doc.close();
        injectPreviewHelpers(iframe);

        //window.xhtmlEditor.setValue(updated);
    });


    showMapToast('Set parent tag completed');
    savedSelectionRange = null;
}

function injectMappingHighlightStyles(doc) {
    const style = doc.createElement('style');
    style.id = 'preview-mapping-style';

    style.textContent = `
        [data-preview-mapped="true"] {
            outline: 2px solid #ff9800;
            background-color: rgba(255, 152, 0, 0.25);
        }
    `;

    doc.head.appendChild(style);
}

function decoratePreviewTags(iframe) {
    const doc = iframe.contentDocument;

    doc.querySelectorAll('[data-preview-tag]').forEach(el => {
        // Avoid duplicate labels
        if (el.querySelector(':scope > .preview-tag-label')) return;

        el.classList.add('preview-tag-wrapper');

        const label = doc.createElement('span');
        label.className = 'preview-tag-label';
        label.textContent = `[${el.tagName.toLowerCase()}]`;

        el.insertBefore(label, el.firstChild);
    });
}

function markAllPreviewTags(iframe) {
    const doc = iframe.contentDocument;

    doc.querySelectorAll('*').forEach(el => {
        if (el.nodeType !== 1) return;

        el.setAttribute(
            'data-preview-tag',
            el.tagName.toLowerCase()
        );
    });
}

function injectPreviewStyles(iframe) {
    const doc = iframe.contentDocument;

    const style = doc.createElement('style');
    style.textContent = `
        [data-preview-mapped="h1"] { outline: 1px solid #6f42c1; background: rgba(111,66,193,.15); position: relative; }
        [data-preview-mapped="h2"] { outline: 1px solid #0d6efd; background: rgba(13,110,253,.15); position: relative; }
        [data-preview-mapped="h3"] { outline: 1px solid #20c997; background: rgba(32,201,151,.15); position: relative; }
        [data-preview-mapped="h4"] { outline: 1px solid #198754; background: rgba(25,135,84,.15); position: relative; }

        /* Text */
        [data-preview-mapped="p"]  { outline: 1px solid #fd7e14; background: rgba(253,126,20,.15); position: relative; }
        [data-preview-mapped="span"] { outline: 1px solid #adb5bd; background: rgba(173,181,189,.15); position: relative; }

        /* Lists */
        [data-preview-mapped="ul"],
        [data-preview-mapped="ol"] { outline: 1px solid #0dcaf0; background: rgba(13,202,240,.15); position: relative; }

        /* Figures & media */
        [data-preview-mapped="figure"] { outline: 1px solid #d63384; background: rgba(214,51,132,.15); position: relative; }
        [data-preview-mapped="img"] { outline: 1px dashed #dc3545; position: relative; }

        /* Tables */
        [data-preview-mapped="table"] { outline: 1px solid #6610f2; background: rgba(102,16,242,.12); position: relative; }

        *[data-preview-tag] {
            outline: 1px dashed rgba(0, 123, 255, 0.4);
            position: relative;
        }

        *[data-preview-tag]::before {
            content: "[" attr(data-preview-tag) "]";
            position: absolute;
            top: -0.75em;
            left: 0;
            font-size: 10px;
            font-family: monospace;
            color: #fff;
            background: #A096EF;
            padding: 1px 4px;
            border-radius: 3px;
            pointer-events: none;
            white-space: nowrap;
            z-index: 9999;
        }

    `;

    doc.head.appendChild(style);
}

function injectPreviewHelpers(iframe) {
    const doc = iframe.contentDocument;

    doc.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        const el = e.target.closest('*');
        if (!el) return;

        const tagName = el.tagName.toLowerCase();

        selectElementForMapping(el);
        const sel = iframe.contentWindow.getSelection();
        if (sel && sel.type === 'Range' && sel.toString().trim().length > 0) {
            return;
        }

        highlightElement(el)
        document.getElementById('mappingPanel').classList.add('show');
        document.getElementById('overlaymap').classList.add('show');

    });
}
function highlightElement(el) {
    el.setAttribute('data-mapped', 'true');
}
function selectElementForMapping(el) {
    const classAttr = el.getAttribute('class') || '';
    const tagInfo = {
        tagName: el.tagName.toLowerCase(),
        className: classAttr,
        //attributes: [...el.attributes].map(a => ({
        //    name: a.name,
        //    value: a.value
        //}))
    };

    window.selectedSourceTag = tagInfo;

    populateTagMappingTable(tagInfo);
    //startTagMappingByTag(tagInfo.tagName);
}

function populateTagMappingTable(tags) {
    const tbody = document.querySelector('#tagMappingTable tbody');
    tbody.innerHTML = '';

    //tags.forEach(t => {
    const tr = document.createElement('tr');
    tr.classList.add('tag-map-row');

    tr.innerHTML = `
                <td class="source-tag" classname="${tags.className}">
                    ${tags.tagName}
                </td>
                <td>
                    ${mappedTagSelectHtml()}
                </td>
            `;

    tbody.appendChild(tr);
    //});
}

function startTagMappingByTag(tagName) {

    fetch('/Epub/FindTagOccurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            JobId: currentJobId,
            TagName: tagName
        })
    })

        .then(r => r.json())
        .then(data => {
            renderMappingPanel(tagName, data);
        });
}
function renderMappingPanel(tagName, items) {
    const list = document.getElementById('mappingList');
    list.innerHTML = '';

    items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'mapping-row';
        row.dataset.file = item.fileName;
        row.dataset.tag = tagName;

        row.innerHTML = `
            <div class="mapping-info">
                <span class="file">File: ${item.fileName}</span>
                <span class="tag">Tag: ${tagName}</span>
                <span class="content">
                    Content: ${getFirstWords(item.contents, 4)}
                </span>
            </div>

            <div class="mapping-control">
                <label>Mapped tag:</label>
                ${mappedTagSelectHtml()}
            </div>
            `;

        list.appendChild(row);
    });
}

function getFirstWords(text, count) {
    if (!text) return '';
    try {
        return text.split(/\s+/).slice(0, count).join(' ') + '…';
    }
    catch (error) {
        return text;
    }
}
//function injectPreviewStyles(iframe) {
//    const doc = iframe.contentDocument;

//    if (doc.getElementById('preview-style')) return;

//    const style = doc.createElement('style');
//    style.id = 'preview-style';
//    style.textContent = `/* CSS from Step 1 */`;
//    doc.head.appendChild(style);
//}



//loadTagSelect().then(() => {
//    extractTagsFromEditor();
//});

function extractTagsFromEditor() {
    const xhtml = window.xhtmlEditor.getValue();

    fetch('/Epub/ExtractTags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xhtml })
    })
        .then(r => r.json())
        .then(tags => populateTagMappingTable(tags));
}

/*${loadTagSelect()}*/
function formatAsXmlSignature(sig) {
    let attr = '';

    sig.attributes.forEach(a => {
        attr += ` ${a.name}="${a.value}"`;
    });

    return `&lt;${sig.tag}${attr}&gt;`;
}

document.addEventListener('DOMContentLoaded', loadTagSelect);

function loadTagSelect() {
    return fetch('/Content/TagSelect')
        .then(r => r.text())
        .then(html => {
            mappedTagsCache = html;
        });
}

function mappedTagSelectHtml() {
    if (!mappedTagsCache.length) {
        return '<span class="text-muted">Loading...</span>';
    }

    return mappedTagsCache;
    //`
    //    <select class="mapped-tag form-select">
    //        <option value="">-- Select --</option>
    //        ${mappedTagsCache.map(t => `<option value="${t}">${t}</option>`).join('')}
    //    </select>
    //`;
}

//function downloadEpub() {
//    if (currentJobId != null)
//        window.location.href = `/Epub/DownloadEpub?jobId=${currentJobId}`;
//    else
//        showDownloadToast('No Epub file is ready to download.');
//}
window.completed = function () {
    alert("completed");
    window.parent.postMessage({ type: "ASP_DONE" }, "*");
};

window.downloadEpub = function () {

    //alert("yes");
    //if (!currentJobId) {
    //    showDownToast('❌ No EPUB ready');
    //    return;
    //}
    showDownToast('Saving all XHtml files…');

    // Trigger download in background
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `/Epub/DownloadEpub?jobId=${currentJobId}`;
    //iframe.src = `/Epub/DownloadEpub`;
    document.body.appendChild(iframe);

    // Best-effort completion (browser limitation)
    setTimeout(() => {
        showDownToast('✅ Completed', true);
        setTimeout(hideDownToast, 25000);
    }, 25000);
    window.parent.postMessage({ type: "ASP_DONE" }, "*");
};

function showDownToast(msg, done = false) {
    const toast = document.getElementById('uploadToast');
    const text = document.getElementById('uploadText');
    const spinner = toast.querySelector('.spinner');

    text.textContent = msg;

    if (done) {
        spinner.style.display = 'none';
        text.textContent = '✅ Completed';
    } else {
        spinner.style.display = 'block';
    }

    toast.style.display = 'flex';
}

function hideDownToast() {
    document.getElementById('uploadToast').style.display = 'none';
}


function showDownloadToast(message, duration = 3000) {
    const toast = document.getElementById('downloadtoast');
    toast.innerText = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
