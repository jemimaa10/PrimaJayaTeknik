function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}

function detectWebPSupport(callback) {
  const img = new Image();
  img.onload = () => callback(img.width === 1);
  img.onerror = () => callback(false);
  img.src =
    'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
}

function getWebPSupport() {
  const acceptWebp = getCookie('acceptwebp');

  if (acceptWebp !== undefined) return;

  detectWebPSupport((supported) => {
    setCookie('acceptwebp', supported, 365);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  getWebPSupport();
});
 