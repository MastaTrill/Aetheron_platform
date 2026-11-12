const BASESCAN_TOKEN_URL = 'https://basescan.org/token/0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const LAUNCH_STATUS_URL = 'presale.html';

function injectDexWidget() {
  // Market-status markup is rendered in index.html to prevent layout shifts.
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
