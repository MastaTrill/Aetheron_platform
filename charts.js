const BASESCAN_TOKEN_URL = 'https://basescan.org/token/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const LAUNCH_STATUS_URL = 'presale.html';

function injectDexWidget() {
  if (document.getElementById('aethDexWidget')) return;

  const container = document.querySelector('.container');
  if (!container) return;

  const widget = document.createElement('section');
  widget.id = 'aethDexWidget';
  widget.setAttribute('aria-labelledby', 'dexWidgetTitle');
  widget.style.cssText =
    'margin:20px 0;padding:18px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1)';

  widget.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px">
      <div>
        <h2 id="dexWidgetTitle" style="margin:0 0 4px">AETH Market Status</h2>
        <div id="dexStatus" role="status" aria-live="polite" style="font-size:.9rem;opacity:.82">
          No canonical Base DEX pool is live. Public purchases and market-price claims remain disabled.
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="${LAUNCH_STATUS_URL}" class="btn btn-outline" aria-label="Review verified AETH Base launch status">
          <i class="fas fa-shield-alt" aria-hidden="true"></i> Launch Status
        </a>
        <a href="${BASESCAN_TOKEN_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" aria-label="Verify the AETH token on BaseScan">
          <i class="fas fa-external-link-alt" aria-hidden="true"></i> BaseScan
        </a>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
      <div>Network<br><strong>Base Mainnet</strong></div>
      <div>Canonical Liquidity<br><strong>Not live</strong></div>
      <div>Purchases<br><strong>Closed</strong></div>
      <div>Price Feed<br><strong>Not published</strong></div>
    </div>
  `;

  container.insertBefore(widget, container.children[1] || null);
}

function updateDexWidget() {
  const status = document.getElementById('dexStatus');
  if (status) {
    status.textContent = 'No canonical Base DEX pool is live. Public purchases and market-price claims remain disabled.';
  }
}

function initializeCharts() {
  injectDexWidget();
  updateDexWidget();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCharts, { once: true });
} else {
  initializeCharts();
}

window.AetheronCharts = { init: initializeCharts, refreshMarket: updateDexWidget };
