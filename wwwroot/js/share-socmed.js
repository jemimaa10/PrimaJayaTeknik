document.addEventListener('DOMContentLoaded', function() {
    const pageUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);

    // Function to open a new window for sharing
    function openShareWindow(url, width, height) {
        window.open(url, '_blank', `width=${width},height=${height},toolbar=0,menubar=0,location=0,status=0,scrollbars=0,resizable=1`);
    }

    // Facebook Share
    const shareFacebookButton = document.getElementById('shareFacebook');
    if (shareFacebookButton) {
        shareFacebookButton.addEventListener('click', function() {
            const facebookUrl = `https://www.facebook.com/sharer.php?u=${pageUrl}`;
            openShareWindow(facebookUrl, 600, 400);
        });
    }

    // Twitter Share
    const shareTwitterButton = document.getElementById('shareX');
    if (shareTwitterButton) {
        shareTwitterButton.addEventListener('click', function() {
            const twitterUrl = `https://x.com/intent/post?url=${pageUrl}&text=${pageTitle}`;
            openShareWindow(twitterUrl, 600, 400);
        });
    }

    // LinkedIn Share
    const shareLinkedInButton = document.getElementById('shareLinkedIn');
    if (shareLinkedInButton) {
        shareLinkedInButton.addEventListener('click', function() {
            const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${pageTitle}`;
            openShareWindow(linkedInUrl, 600, 400);
        });
    }
});