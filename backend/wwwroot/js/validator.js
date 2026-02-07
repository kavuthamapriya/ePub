function runValidation() {
    const doc = new DOMParser().parseFromString(xhtmlEditor.getValue(), 'text/html');
    const results = [];


    doc.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('alt')) {
            results.push('Image missing alt text');
        }
    });


    document.getElementById('validationResults').innerHTML = results.length
        ? results.map(r => `<div class='text-danger'>${r}</div>`).join('')
        : '<div class="text-success">No issues found</div>';
}