function addItem() {
    const val = document.getElementById('newItem').value;
    fetch('/Content/Add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'value=' + encodeURIComponent(val)
    })
        // .then(r => r.text())
        // .then(html => {
        //     document.getElementById('rightPanel').innerHTML = html;
        //     loadTagSelect(); // ✅ dropdown auto updates
        // });
        .then(() => {
            openPanel();
            loadTagSelect();
        });
}

function removeItem(val) {
    fetch('/Content/Remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'value=' + encodeURIComponent(val)
    })
        // .then(r => r.text())
        // .then(html => {
        //     document.getElementById('rightPanel').innerHTML = html;
        //     loadTagSelect(); // ✅ dropdown auto updates
        // });
        .then(() => {
            openPanel();
            loadTagSelect();
        });
}

function openPanel() {
    fetch('/Content/Panel')
        .then(r => r.text())
        .then(html => {
            document.getElementById('rightPanel').innerHTML = html;
            document.getElementById('rightPanel').classList.add('show');
            document.getElementById('overlay').classList.add('show');
        });
}

function startMapping() {
    //const panel = document.getElementById('mappingPanel');
    //panel.classList.remove('hidden');
    //panel.style.display = 'block';
    document.getElementById('mappingPanel').classList.add('show');
    document.getElementById('overlaymap').classList.add('show');

    // Load mapped tags first, then extract tags
    // loadMappedTags().then(() => {
    //     extractTagsFromEditor();
    // });
}

function closePanel() {
    document.getElementById('rightPanel').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('mappingPanel').classList.remove('show');
    document.getElementById('overlaymap').classList.remove('show');

}

// $(document).ready(function () {
//     loadTagSelect();
// });

// document.addEventListener('DOMContentLoaded', loadTagSelect);

// function loadTagSelect() {
//     fetch('/Content/TagSelect')
//         .then(r => r.text())
//         .then(html => {
//             document.getElementById('tagSelectContainer').innerHTML = html;
//         });
// }
