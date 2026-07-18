(function retireLegacyAetheronCache() {
  async function cleanup() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  }
  cleanup().catch((error) => console.warn('Legacy cache cleanup was not completed:', error));
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data?.type === 'AETHERON_CACHE_RETIRED') window.location.reload();
  });
})();
