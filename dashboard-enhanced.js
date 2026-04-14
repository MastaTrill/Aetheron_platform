// dashboard-enhanced.js
// Handles launchpad and token scanner flows when the backend API is available.

document.addEventListener('DOMContentLoaded', function () {
  const STATIC_HOST_SUFFIXES = ['github.io', 'pages.dev'];

  function text(value) {
    return document.createTextNode(String(value));
  }

  function el(tagName, options) {
    const node = document.createElement(tagName);
    const opts = options || {};
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = String(opts.text);
    if (opts.attrs) {
      Object.entries(opts.attrs).forEach(function ([key, value]) {
        if (value !== undefined && value !== null) node.setAttribute(key, String(value));
      });
    }
    return node;
  }

  function fragment() {
    return document.createDocumentFragment();
  }

  function lineBreak() {
    return document.createElement('br');
  }

  function spacer() {
    return el('div', { className: 'result-spacer' });
  }

  function getConfiguredApiBase() {
    const metaBase = document
      .querySelector('meta[name="aetheron-api-base"]')
      ?.getAttribute('content')
      ?.trim();
    const globalBase = typeof window.AETHERON_API_BASE_URL === 'string' ? window.AETHERON_API_BASE_URL.trim() : '';
    const configuredBase = globalBase || metaBase || '';

    if (configuredBase) return configuredBase.replace(/\/+$/, '');

    const hostname = window.location.hostname;
    const isStaticHost = STATIC_HOST_SUFFIXES.some(function (suffix) {
      return hostname === suffix || hostname.endsWith('.' + suffix);
    });

    return isStaticHost ? '' : window.location.origin;
  }

  function setResult(element, tone, content) {
    if (!element) return;
    element.className = 'result-message result-' + tone;
    element.replaceChildren();
    if (content instanceof Node) element.appendChild(content);
    else element.textContent = String(content || '');
  }

  function buildApiRequiredMessage(featureName) {
    const frag = fragment();
    frag.appendChild(text(featureName + ' needs the Aetheron backend API. Configure '));
    frag.appendChild(el('code', { text: 'window.AETHERON_API_BASE_URL' }));
    frag.appendChild(text(' or the '));
    frag.appendChild(el('code', { text: 'aetheron-api-base' }));
    frag.appendChild(text(' meta tag to point at a deployed backend.'));
    return frag;
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      if ([404, 405, 501].includes(response.status)) {
        throw new Error('Backend API not found at this origin. Run the backend server or configure AETHERON_API_BASE_URL.');
      }
      throw new Error(data.details || data.error || 'Request failed with status ' + response.status + '.');
    }

    return data;
  }

  function buildLaunchSuccessMessage(data) {
    const frag = fragment();
    frag.appendChild(el('strong', { text: 'Launch submitted successfully.' }));
    frag.appendChild(lineBreak());
    frag.appendChild(text(data.message || 'Token deployed successfully.'));
    frag.appendChild(spacer());
    frag.appendChild(text('Contract: '));
    frag.appendChild(el('code', { text: data.contractAddress || '' }));
    frag.appendChild(lineBreak());
    frag.appendChild(text('Team wallet: '));
    frag.appendChild(el('code', { text: data.teamWallet || '' }));
    frag.appendChild(lineBreak());
    frag.appendChild(text('Allocation: ' + String(data.allocationPercent ?? '') + '%'));
    frag.appendChild(lineBreak());
    frag.appendChild(el('a', {
      className: 'result-link',
      text: 'Open in PolygonScan',
      attrs: {
        href: 'https://polygonscan.com/token/' + String(data.contractAddress || ''),
        target: '_blank',
        rel: 'noopener',
      },
    }));
    return frag;
  }

  function buildScanSuccessMessage(data, isFullScan) {
    const frag = fragment();
    frag.appendChild(el('strong', { text: 'Scan complete.' }));
    frag.appendChild(lineBreak());
    frag.appendChild(text('Risk Score: ' + String(data.riskScore ?? 'N/A') + '/100'));
    frag.appendChild(lineBreak());
    frag.appendChild(text('Summary: ' + String(data.summary || 'No summary returned.')));

    if (isFullScan && Array.isArray(data.issues) && data.issues.length > 0) {
      frag.appendChild(spacer());
      frag.appendChild(el('div', { className: 'result-section-title', text: 'Reported issues' }));
      const list = el('ul', { className: 'result-list' });
      data.issues.forEach(function (issue) {
        list.appendChild(el('li', { text: issue }));
      });
      frag.appendChild(list);
    }

    return frag;
  }

  const apiBase = getConfiguredApiBase();

  const launchForm = document.getElementById('token-launch-form');
  const launchResult = document.getElementById('launch-result');
  if (launchForm) {
    launchForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!apiBase) {
        setResult(launchResult, 'warning', buildApiRequiredMessage('Token launchpad'));
        return;
      }

      setResult(launchResult, 'info', 'Launching token...');

      const payload = {
        name: document.getElementById('launch-token-name').value.trim(),
        symbol: document.getElementById('launch-token-symbol').value.trim(),
        supply: document.getElementById('launch-token-supply').value,
        teamWallet: document.getElementById('launch-team-wallet').value.trim(),
        allocationPercent: document.getElementById('launch-allocation').value,
        logoUrl: document.getElementById('launch-logo-url').value.trim(),
        website: document.getElementById('launch-website').value.trim(),
        description: document.getElementById('launch-description').value.trim(),
      };

      try {
        const data = await postJson(apiBase + '/api/launch-token', payload);
        setResult(launchResult, 'success', buildLaunchSuccessMessage(data));
      } catch (error) {
        setResult(launchResult, 'error', 'Error launching token: ' + String(error.message));
      }
    });
  }

  const scanForm = document.getElementById('token-scan-form');
  const scanResult = document.getElementById('scan-result');
  if (scanForm) {
    scanForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!apiBase) {
        setResult(scanResult, 'warning', buildApiRequiredMessage('Token scanner'));
        return;
      }

      setResult(scanResult, 'info', 'Scanning token...');

      const address = document.getElementById('scan-token-address').value.trim();
      const type = document.getElementById('scan-type').value;
      const isFullScan = type === 'full';

      try {
        const data = await postJson(apiBase + '/api/scan-token', { address, full: isFullScan });
        setResult(scanResult, 'success', buildScanSuccessMessage(data, isFullScan));
      } catch (error) {
        setResult(scanResult, 'error', 'Error connecting to scanner API: ' + String(error.message));
      }
    });
  }
});
