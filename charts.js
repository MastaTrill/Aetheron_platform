// Live DexScreener market widget for the AETH Polygon pair
const DEXSCREENER_PAIR_URL =
  'https://dexscreener.com/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D';
const DEXSCREENER_API_URL =
  'https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D';

function formatUsd(value, options = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '--';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    notation: options.compact ? 'compact' : 'standard'
  }).format(amount);
}

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
        <h2 id="dexWidgetTitle" style="margin:0 0 4px">Live AETH Market</h2>
        <div id="dexStatus" role="status" aria-live="polite" style="font-size:.85rem;opacity:.75">Loading DexScreener data…</div>
      </div>
      <a href="${DEXSCREENER_PAIR_URL}" target="_blank" rel="noopener noreferrer" class="btn btn-outline"
        aria-label="View the AETH Polygon market on DexScreener">
        <i class="fas fa-chart-line" aria-hidden="true"></i> View on DexScreener
      </a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
      <div>Price<br><strong id="dexPrice">--</strong></div>
      <div>Liquidity<br><strong id="dexLiquidity">--</strong></div>
      <div>24h Volume<br><strong id="dexVolume">--</strong></div>
      <div>24h Buys / Sells<br><strong id="dexTx">--</strong></div>
    </div>
  `;

  container.insertBefore(widget, container.children[1] || null);
}

async function updateDexWidget() {
  const status = document.getElementById('dexStatus');

  try {
    const response = await fetch(DEXSCREENER_API_URL);
    if (!response.ok) throw new Error(`DexScreener request failed (${response.status})`);

    const data = await response.json();
    const pair = data.pairs?.[0];
    if (!pair) throw new Error('DexScreener returned no matching pair');

    document.getElementById('dexPrice').textContent = formatUsd(pair.priceUsd, {
      maximumFractionDigits: 10
    });
    document.getElementById('dexLiquidity').textContent = formatUsd(pair.liquidity?.usd, {
      compact: true
    });
    document.getElementById('dexVolume').textContent = formatUsd(pair.volume?.h24, {
      compact: true
    });
    document.getElementById('dexTx').textContent =
      `${pair.txns?.h24?.buys ?? '--'} / ${pair.txns?.h24?.sells ?? '--'}`;

    if (status) status.textContent = 'Live data · refreshes every 60 seconds';
  } catch (error) {
    console.error('Unable to refresh DexScreener market data:', error);
    if (status) status.textContent = 'Live data is temporarily unavailable. Open DexScreener for the latest market.';
  }
}

function initializeCharts() {
  injectDexWidget();
  updateDexWidget();
  window.setInterval(updateDexWidget, 60000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCharts, { once: true });
} else {
  initializeCharts();
}

window.AetheronCharts = { init: initializeCharts, refreshMarket: updateDexWidget };
