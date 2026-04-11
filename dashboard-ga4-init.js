(function () {
  function getMeasurementId() {
    const metaId = document
      .querySelector('meta[name="aetheron-ga4-id"]')
      ?.getAttribute('content')
      ?.trim();
    const globalId =
      typeof window.AETHERON_GA4_MEASUREMENT_ID === 'string'
        ? window.AETHERON_GA4_MEASUREMENT_ID.trim()
        : '';
    const configuredId = globalId || metaId || '';

    if (!configuredId || configuredId === 'G-XXXXXXXXXX') {
      return '';
    }

    return configuredId;
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

  async function initializeGa4() {
    const measurementId = getMeasurementId();
    if (!measurementId) {
      return;
    }

    try {
      await loadScript(
        'https://www.googletagmanager.com/gtag/js?id=' +
          encodeURIComponent(measurementId),
      );
    } catch (error) {
      console.warn('GA4 script failed to load:', error);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId);
  }

  initializeGa4();
})();
