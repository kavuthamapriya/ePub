//function uploadEpub() {
//    const fileInput = document.getElementById('epubInput');
//    const file = fileInput.files[0];

//    if (!file) {
//        alert('Select an EPUB file');
//        return;
//    }

//    const formData = new FormData();
//    formData.append('epubFile', file); // name MUST match controller param

//    fetch('/Epub/Upload', {
//        method: 'POST',
//        body: formData
//    })
//        .then(async r => {
//            const text = await r.text();
//            try {
//                var jsCont = JSON.parse(text)
//                loadFileList(jsCont.jobId);
//                return JSON.parse(text);
//            } catch {
//                throw new Error(text);
//            }
//        })
//        .then(res =>
//            console.log(res)
//        )
//        .catch(err => console.error('Upload failed:', err.message));
//}

function uploadPDF() {

    const fileInput = document.getElementById('pdfInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Select an PDF file');
        return;
    }
    document.getElementById('pdfInput').value = '';

    const formData = new FormData();
    formData.append('pdfFile', file); // MUST match controller param

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Epub/PDFUpload', true);

    // 🔹 Upload progress (streaming)
    xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            showToast(`Uploading PDF…`);
        }
    };

    // 🔹 Response handling (your logic preserved)
    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                const jsCont = JSON.parse(xhr.responseText);
                //const iframe = document.getElementById('pdfPreview');
                //iframe.src = `/Epub/PreviewPdf?jobId=${jsCont.pdfJobId}&fileName=${jsCont.pdfFileName}`;
                document.getElementById('pdfPreview').src = jsCont.pdfPath;
                showToast('✅ Upload completed');
                setTimeout(hideToast, 3000);
            } catch (err) {
                console.error('Invalid JSON:', xhr.responseText);
                showToast('❌ Server error');
            }
        } else {
            console.error(xhr.responseText);
            showToast('❌ Upload failed');
        }
    };

    xhr.onerror = function () {
        showToast('❌ Network error');
    };

    xhr.send(formData);
}


function uploadEpub() {
    const fileInput = document.getElementById('epubInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Select an EPUB file');
        return;
    }

    const formData = new FormData();
    formData.append('epubFile', file); // MUST match controller param

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/Epub/Upload', true);

    // 🔹 Upload progress (streaming)
    xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            showToast(`Uploading EPUB…`);
        }
    };

    // 🔹 Response handling (your logic preserved)
    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                const jsCont = JSON.parse(xhr.responseText);
                loadFileList(jsCont.jobId);
                showToast('✅ Upload completed');
                setTimeout(hideToast, 3000);
            } catch (err) {
                console.error('Invalid JSON:', xhr.responseText);
                showToast('❌ Server error');
            }
        } else {
            console.error(xhr.responseText);
            showToast('❌ Upload failed');
        }
    };

    xhr.onerror = function () {
        showToast('❌ Network error');
    };

    xhr.send(formData);
    document.getElementById('epubInput').value = '';
}

function showToast(msg, done = false) {
    const toast = document.getElementById('uploadToast');
    const text = document.getElementById('uploadText');
    const spinner = toast.querySelector('.spinner');

    text.textContent = msg;

    if (done) {
        spinner.style.display = 'none';
        text.textContent = '✅ Upload completed';
    } else {
        spinner.style.display = 'block';
    }

    toast.style.display = 'flex';
}

function hideToast() {
    document.getElementById('uploadToast').style.display = 'none';
}