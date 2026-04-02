(function () {
  const SENTRY_BUNDLE_URL =
    'https://browser.sentry-cdn.com/7.92.0/bundle.tracing.min.js';

  function getConfiguredDsn() {
    const metaDsn = document
      .querySelector('meta[name="aetheron-sentry-dsn"]')
      ?.getAttribute('content')
      ?.trim();
    const globalDsn =
      typeof window.AETHERON_SENTRY_DSN === 'string'
        ? window.AETHERON_SENTRY_DSN.trim()
        : '';
    const configuredDsn = globalDsn || metaDsn || '';

    if (!configuredDsn || configuredDsn === 'YOUR_SENTRY_DSN') {
      return '';
    }

    return configuredDsn;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const existingScript = document.querySelector('script[data-aetheron-src="' + src + '"]');
      if (existingScript) {
        if (existingScript.dataset.loaded === 'true') {
          resolve();
          return;
        }

        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.aetheronSrc = src;
      script.addEventListener(
        'load',
        function () {
          script.dataset.loaded = 'true';
          resolve();
        },
        { once: true },
      );
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  async function initializeSentry() {
    const dsn = getConfiguredDsn();
    if (!dsn) {
      return;
    }

    try {
      if (!window.Sentry) {
        await loadScript(SENTRY_BUNDLE_URL);
      }

      if (!window.Sentry || typeof window.Sentry.init !== 'function') {
        return;
      }

      const integrations =
        typeof window.Sentry.BrowserTracing === 'function'
          ? [new window.Sentry.BrowserTracing()]
          : [];

      window.Sentry.init({
        dsn,
        integrations,
        tracesSampleRate: 1.0,
      });
    } catch (error) {
      console.warn('Sentry init skipped:', error);
    }
  }

  initializeSentry();
})();
