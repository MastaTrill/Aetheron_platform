// Chart initialization with null checks
function initPriceChart() {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;
  // ...existing chart code...
}
function initVolumeChart() {
  const canvas = document.getElementById('volumeChart');
  if (!canvas) return;
  // ...existing chart code...
}
function initTVLChart() {
  const canvas = document.getElementById('tvlChart');
  if (!canvas) return;
  // ...existing chart code...
}
function initStakingChart() {
  const canvas = document.getElementById('stakingChart');
  if (!canvas) return;
  // ...existing chart code...
}
// Error handling for wallet connection
function checkWalletConnection() {
  try {
    // ...existing wallet connection code...
  } catch (err) {
    console.error('Error checking wallet connection:', err);
  }
}
// Null check for parentElement access
document.addEventListener('DOMContentLoaded', function () {
  const el = document.getElementById('someElement');
  if (el && el.parentElement) {
    // ...existing code...
  }
});
