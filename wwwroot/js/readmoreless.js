// Collapses #text-content to a preview and toggles it with #readMoreLess. Pages without the
// block (no description, or a template that renders the text elsewhere) have nothing to do.
window.addEventListener('load', function () {
    const content = document.getElementById('text-content');
    const button = document.getElementById('readMoreLess');
    if (!content || !button) return;

    const previewHeight = 200;

    if (content.scrollHeight > previewHeight) {
        content.style.maxHeight = previewHeight + 'px';
        button.style.display = 'block';
    } else {
        button.style.display = 'none';
    }
    button.addEventListener('click', function () {
        const isCollapsed = content.style.maxHeight === previewHeight + 'px';
        if (isCollapsed) {
            content.style.maxHeight = content.scrollHeight + 'px';
            button.textContent = 'Read Less';
        } else {
            content.style.maxHeight = previewHeight + 'px';
            button.textContent = 'Read More';
        }
    });
});
