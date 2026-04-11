(function () {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .getRegistrations()
    .then(async (registrations) => {
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith('aetheron-'))
            .map((name) => caches.delete(name)),
        );
      }

      console.log('Aetheron service workers unregistered for fresh wallet assets');
    })
    .catch((error) => {
      console.warn('Unable to clear old service workers:', error);
    });

  console.log(
    '%cAetheron Platform v1.4.7',
    'color: #00D4FF; font-size: 16px; font-weight: bold;',
  );
  console.log(
    '%cHomepage cache reset enabled',
    'color: #10b981; font-size: 12px;',
  );
})();
