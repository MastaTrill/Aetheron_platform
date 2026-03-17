(function () {
  if (!('serviceWorker' in navigator)) return;

  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    console.log('🔄 Service Worker updated - reloading page...');
    window.location.reload();
  });

  navigator.serviceWorker
    .register('./service-worker.js', { scope: './' })
    .then((reg) => {
      console.log('✅ Service Worker registered successfully');

      // Periodically check for updates
      setInterval(() => {
        try { reg.update(); } catch (_) {}
      }, 60 * 1000);

      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🆕 New version available!');
            try {
              if (typeof window.showToast === 'function') {
                showToast('Update Available', 'A new version is ready. Refreshing...', 'info');
              }
            } catch (_) {}
            setTimeout(() => {
              try { sw.postMessage({ type: 'SKIP_WAITING' }); } catch (_) {}
            }, 2000);
          }
        });
      });

      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e?.data && e.data.type === 'SW_UPDATED') {
          console.log('📦 Service Worker updated and activated');
        }
      });
    })
    .catch((err) => {
      console.error('❌ Service Worker registration failed:', err);
    });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      console.log('📄 Page loaded from cache - checking for updates...');
      window.location.reload();
    }
  });

  console.log('%c🚀 Aetheron Platform v1.3.1', 'color: #00D4FF; font-size: 16px; font-weight: bold;');
  console.log('%c✨ Dashboard loaded successfully', 'color: #10b981; font-size: 12px;');
})();
