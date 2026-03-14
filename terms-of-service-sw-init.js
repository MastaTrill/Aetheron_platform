// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((e) => console.log('ServiceWorker registered:', e.scope))
      .catch((e) => console.log('ServiceWorker registration failed:', e));
  });
}
