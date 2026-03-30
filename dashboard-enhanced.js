// dashboard-enhanced.js
// Handles launchpad and token scanner flows when the backend API is available.

document.addEventListener('DOMContentLoaded', function () {
  const STATIC_HOST_SUFFIXES = ['github.io', 'pages.dev'];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[character];
    });
  }

  function getConfiguredApiBase() {
    const metaBase = document
      .querySelector('meta[name="aetheron-api-base"]')
      ?.getAttribute('content')
      ?.trim();
    const globalBase =
      typeof window.AETHERON_API_BASE_URL === 'string'
        ? window.AETHERON_API_BASE_URL.trim()
        : '';
    const configuredBase = globalBase || metaBase || '';

    if (configuredBase) {
      return configuredBase.replace(/\/+$/, '');
    }

    const hostname = window.location.hostname;
    const isStaticHost = STATIC_HOST_SUFFIXES.some(function (suffix) {
      return hostname === suffix || hostname.endsWith('.' + suffix);
    });

    return isStaticHost ? '' : window.location.origin;
  }

  function setResult(element, tone, messageHtml) {
    if (!element) {
      return;
    }

    element.className = 'result-message result-' + tone;
    element.innerHTML = messageHtml;
  }

  function buildApiRequiredMessage(featureName) {
    return (
      escapeHtml(featureName) +
      ' needs the Aetheron backend API. Configure ' +
      '<code>window.AETHERON_API_BASE_URL</code> or the ' +
      '<code>aetheron-api-base</code> meta tag to point at a deployed backend.'
    );
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
        throw new Error(
          'Backend API not found at this origin. Run the backend server or configure AETHERON_API_BASE_URL.',
        );
      }

      throw new Error(
        data.details || data.error || 'Request failed with status ' + response.status + '.',
      );
    }

    return data;
  }

  function buildLaunchSuccessMessage(data) {
    const contractAddress = escapeHtml(data.contractAddress || '');
    const teamWallet = escapeHtml(data.teamWallet || '');
    const allocation = escapeHtml(String(data.allocationPercent ?? ''));
    const message = escapeHtml(data.message || 'Token deployed successfully.');

    return (
      '<strong>Launch submitted successfully.</strong><br />' +
      message +
      '<div class="result-spacer"></div>' +
      'Contract: <code>' +
      contractAddress +
      '</code><br />' +
      'Team wallet: <code>' +
      teamWallet +
      '</code><br />' +
      'Allocation: ' +
      allocation +
      '%<br />' +
      '<a class="result-link" href="https://polygonscan.com/token/' +
      contractAddress +
      '" target="_blank" rel="noopener">Open in PolygonScan</a>'
    );
  }

  function buildScanSuccessMessage(data, isFullScan) {
    const riskScore = escapeHtml(String(data.riskScore ?? 'N/A'));
    const summary = escapeHtml(data.summary || 'No summary returned.');
    let html = '<strong>Scan complete.</strong><br />Risk Score: ' + riskScore + '/100<br />Summary: ' + summary;

    if (isFullScan && Array.isArray(data.issues) && data.issues.length > 0) {
      html +=
        '<div class="result-spacer"></div><div class="result-section-title">Reported issues</div><ul class="result-list">' +
        data.issues
          .map(function (issue) {
            return '<li>' + escapeHtml(issue) + '</li>';
          })
          .join('') +
        '</ul>';
    }

    return html;
  }

  const apiBase = getConfiguredApiBase();

  const launchForm = document.getElementById('token-launch-form');
  const launchResult = document.getElementById('launch-result');
  if (launchForm) {
    launchForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!apiBase) {
        setResult(
          launchResult,
          'warning',
          buildApiRequiredMessage('Token launchpad'),
        );
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
        setResult(
          launchResult,
          'error',
          'Error launching token: ' + escapeHtml(error.message),
        );
      }
    });
  }

  const scanForm = document.getElementById('token-scan-form');
  const scanResult = document.getElementById('scan-result');
  if (scanForm) {
    scanForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!apiBase) {
        setResult(
          scanResult,
          'warning',
          buildApiRequiredMessage('Token scanner'),
        );
        return;
      }

      setResult(scanResult, 'info', 'Scanning token...');

      const address = document.getElementById('scan-token-address').value.trim();
      const type = document.getElementById('scan-type').value;
      const isFullScan = type === 'full';

      try {
        const data = await postJson(apiBase + '/api/scan-token', {
          address,
          full: isFullScan,
        });
        setResult(scanResult, 'success', buildScanSuccessMessage(data, isFullScan));
      } catch (error) {
        setResult(
          scanResult,
          'error',
          'Error connecting to scanner API: ' + escapeHtml(error.message),
        );
      }
    });
  }
});
