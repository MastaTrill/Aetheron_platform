(function () {
  const DEFAULT_PLAUSIBLE_DOMAIN = 'mastatrill.github.io';
  const DEFAULT_PLAUSIBLE_SRC = 'https://plausible.io/js/plausible.js';
  const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

  function getConfiguredValue(metaName, globalName, fallback) {
    const metaValue = document
      .querySelector(`meta[name="${metaName}"]`)
      ?.getAttribute('content')
      ?.trim();
    const globalValue =
      typeof window[globalName] === 'string' ? window[globalName].trim() : '';
    const configuredValue = globalValue || metaValue || fallback;

    return configuredValue ? configuredValue.trim() : '';
  }

  function shouldLoadPlausible() {
    const hostname = window.location.hostname || '';

    if (!hostname || LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.local')) {
      return false;
    }

    return true;
  }

  function loadScript(src, domain) {
    return new Promise(function (resolve, reject) {
      const existingScript = document.querySelector(
        `script[data-aetheron-src="${src}"]`,
      );

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
      script.defer = true;
      script.dataset.domain = domain;
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

  async function initializePlausible() {
    if (!shouldLoadPlausible()) {
      return;
    }

    const domain = getConfiguredValue(
      'aetheron-plausible-domain',
      'AETHERON_PLAUSIBLE_DOMAIN',
      DEFAULT_PLAUSIBLE_DOMAIN,
    );
    const src = getConfiguredValue(
      'aetheron-plausible-src',
      'AETHERON_PLAUSIBLE_SRC',
      DEFAULT_PLAUSIBLE_SRC,
    );

    if (!domain || !src) {
      return;
    }

    try {
      await loadScript(src, domain);
    } catch (error) {
      console.warn('Plausible init skipped:', error);
    }
  }

  initializePlausible();
})();
