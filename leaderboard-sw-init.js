'serviceWorker' in navigator &&
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((e) => {
        console.log('ServiceWorker registered:', e.scope);
        setInterval(() => e.update(), 6e4);
        e.addEventListener('updatefound', () => {
          const r = e.installing;
          r.addEventListener('statechange', () => {
            if ('activated' === r.state && navigator.serviceWorker.controller) {
              setTimeout(() => window.location.reload(), 2e3);
            }
          });
        });
      })
      .catch((e) => console.log('ServiceWorker registration failed:', e));
  });
window.addEventListener('pageshow', (e) => {
  if (e.persisted) window.location.reload();
});
