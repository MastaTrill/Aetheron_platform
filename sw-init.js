(function () {
  if (!('serviceWorker' in navigator)) return;

  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    console.log('Service Worker updated - reloading page...');
    window.location.reload();
  });

  navigator.serviceWorker
    .register('./service-worker.js', { scope: './' })
    .then((reg) => {
      console.log('Service Worker registered successfully');

      setInterval(() => {
        try {
          reg.update();
        } catch (_) {}
      }, 60 * 1000);

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New version available');
            try {
              if (typeof window.showToast === 'function') {
                window.showToast(
                  'Update Available',
                  'A new version is ready. Refreshing...',
                  'info',
                );
              }
            } catch (_) {}

            setTimeout(() => {
              try {
                sw.postMessage({ type: 'SKIP_WAITING' });
              } catch (_) {}
            }, 2000);
          }
        });
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event?.data && event.data.type === 'SW_UPDATED') {
          console.log('Service Worker updated and activated');
        }
      });
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      console.log('Page loaded from cache - checking for updates...');
      window.location.reload();
    }
  });

  console.log(
    '%cAetheron Platform v1.4.2',
    'color: #00D4FF; font-size: 16px; font-weight: bold;',
  );
  console.log(
    '%cDashboard loaded successfully',
    'color: #10b981; font-size: 12px;',
  );
})();
