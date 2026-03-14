// litepaper-service-worker-init.js
// Registers the service worker for the litepaper page.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then((e) => console.log('ServiceWorker registered:', e.scope))
      .catch((e) => console.log('ServiceWorker registration failed:', e));
  });
}
