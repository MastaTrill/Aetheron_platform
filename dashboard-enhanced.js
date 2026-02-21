// dashboard-enhanced.js
// Handles Token Launchpad and Token Security Scanner UI logic

document.addEventListener('DOMContentLoaded', function () {
  // Token Launchpad
  const launchForm = document.getElementById('token-launch-form');
  const launchResult = document.getElementById('launch-result');
  if (launchForm) {
    launchForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      launchResult.textContent = 'Launching token...';
      const name = document.getElementById('launch-token-name').value;
      const symbol = document.getElementById('launch-token-symbol').value;
      const supply = document.getElementById('launch-token-supply').value;
      const teamWallet = document.getElementById('launch-team-wallet').value;
      const allocation = document.getElementById('launch-allocation').value;
      const logoUrl = document.getElementById('launch-logo-url').value;
      const website = document.getElementById('launch-website').value;
      const description = document.getElementById('launch-description').value;
      // Payment required for launchpad
      try {
        await window.payForLaunchpad(name, symbol, 900); // $9.00 in cents
        launchResult.textContent =
          'Payment successful! Token launch in progress...';
        // TODO: Call backend API to launch token
      } catch (err) {
        launchResult.textContent = 'Error launching token: ' + err.message;
      }
    });
  }

  // Token Security Scanner
  const scanForm = document.getElementById('token-scan-form');
  const scanResult = document.getElementById('scan-result');
  if (scanForm) {
    scanForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      scanResult.textContent = 'Scanning token...';
      const address = document.getElementById('scan-token-address').value;
      const type = document.getElementById('scan-type').value;
      try {
        if (type === 'full') {
          scanResult.textContent = 'Redirecting to payment...';
          await window.payForFullScan(address, 900); // $9.00 in cents
          return;
        }
        // Basic scan (free)
        const res = await fetch('/api/scan-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, full: false }),
        });
        const data = await res.json();
        if (res.ok) {
          scanResult.innerHTML = `Risk Score: ${data.riskScore}/100<br>Summary: ${data.summary}`;
        } else {
          scanResult.textContent = data.error || 'Scan failed.';
        }
      } catch (err) {
        scanResult.textContent = 'Error connecting to scanner API.';
      }
    });
  }
});
