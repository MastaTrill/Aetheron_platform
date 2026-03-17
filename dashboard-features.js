// --- Critical Alerts Banner Logic ---
/** @function window.showCriticalAlert */
/**
 * Shows a critical alert banner.
 */
window.showCriticalAlert = function (type, message) {
  const el = document.getElementById('criticalAlerts');
  if (!el) return;
  el.className = 'critical-alerts ' + (type || 'info');
  el.innerHTML =
    (type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️') +
    '<span>' +
    message +
    '</span>';
  el.style.display = 'flex';
};
/** @function window.clearCriticalAlert */
/**
 * Clears the critical alert banner.
 */
window.clearCriticalAlert = function () {
  const el = document.getElementById('criticalAlerts');
  if (!el) return;
  el.style.display = 'none';
  el.innerHTML = '';
};
// --- Onboarding Tour --- Disabled for CSP compliance
/*
============================
Next Steps for Feature Implementation
============================
1. Wallet Portfolio Breakdown
  - Integrate ethers.js to fetch all ERC-20 balances for connected wallet
  - Render a pie chart using Chart.js in #walletPortfolioChart

2. Real-Time Notifications
  - Implement a notification system (toasts or modal)
  - Trigger on staking, proposals, price alerts, etc.

3. Theme Auto-Switch
  - Detect system theme preference
  - Add toggle and save user preference in localStorage

4. Staking History & Analytics
  - Fetch staking/unstaking events from smart contract or backend
  - Render table (#stakingHistoryTable) and chart (#stakingHistoryChart)

5. Community Chat Widget
  - Embed Discord or Telegram widget in #communityChatWidget

6. NFT Gallery
  - Fetch user NFTs (OpenSea API or custom contract)
  - Display in #nftGalleryPlaceholder

7. Gas Fee Estimator
  - Fetch Polygon gas prices from public API
  - Update #gasFeeEstimate on #gasSpeedSelect change

8. Referral Leaderboard
  - Fetch and display top referrers in #referralLeaderboardPlaceholder
  - Handle referral link copy and sharing

9. Multi-Language Support
  - Wire up #languageSelect, load translations, update #currentLanguage

10. Advanced Analytics
  - Render additional charts in #advancedAnalyticsChart
  - Fetch and display analytics data (price, volume, TVL, whales, etc.)
*/
// Onboarding button click handler
document.getElementById('onboardingBtn').addEventListener('click', () => {
  alert(
    'Onboarding tour temporarily disabled for security. Please explore the dashboard manually.',
  );
});

// --- New Feature JS Hooks & Comments ---
// 1. Wallet Portfolio Breakdown
/** @function window.initWalletPortfolio */
/**
 * Initializes the wallet portfolio breakdown.
 */
window.initWalletPortfolio = function () {
  try {
    // --- Wallet Portfolio Breakdown Implementation ---
    const chartEl = document.getElementById('walletPortfolioChart');
    const placeholder = document.getElementById('walletPortfolioPlaceholder');
    if (!chartEl) return;
    if (!window.account || !window.provider) {
      if (placeholder)
        placeholder.textContent =
          'Connect your wallet to view all token balances.';
      return;
    }
    // List of tokens to show (AETH, MATIC, USDC, USDT, WETH, DAI)
    const TOKENS = [
      {
        symbol: 'AETH',
        address:
          window.AETH_ADDRESS || '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
        decimals: 18,
        color: '#00d4ff',
        abi: ['function balanceOf(address) view returns (uint256)'],
      },
      {
        symbol: 'MATIC',
        address: null, // native
        decimals: 18,
        color: '#8a2be2',
      },
      {
        symbol: 'USDC',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        decimals: 6,
        color: '#2775ca',
        abi: ['function balanceOf(address) view returns (uint256)'],
      },
      {
        symbol: 'USDT',
        address: '0xC2132D05D31c914A87C6611C10748AaCbA5fF3bF',
        decimals: 6,
        color: '#26a17b',
        abi: ['function balanceOf(address) view returns (uint256)'],
      },
      {
        symbol: 'WETH',
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        decimals: 18,
        color: '#f5f5f5',
        abi: ['function balanceOf(address) view returns (uint256)'],
      },
      {
        symbol: 'DAI',
        address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
        decimals: 18,
        color: '#f4b731',
        abi: ['function balanceOf(address) view returns (uint256)'],
      },
    ];
    async function fetchBalances() {
      const balances = [];
      for (const token of TOKENS) {
        try {
          if (token.symbol === 'MATIC') {
            // Native balance
            const bal = await window.provider.getBalance(window.account);
            balances.push({
              symbol: 'MATIC',
              value: parseFloat(ethers.utils.formatUnits(bal, 18)),
              color: token.color,
            });
          } else {
            const contract = new ethers.Contract(
              token.address,
              token.abi,
              window.provider,
            );
            const bal = await contract.balanceOf(window.account);
            balances.push({
              symbol: token.symbol,
              value: parseFloat(ethers.utils.formatUnits(bal, token.decimals)),
              color: token.color,
            });
          }
        } catch (e) {
          console.error('Error fetching balance for', token.symbol, e);
          continue;
        }
      }
      return balances.filter((b) => b.value > 0.0001); // Hide dust
    }
    async function renderPortfolioChart() {
      try {
        if (placeholder) placeholder.textContent = 'Loading portfolio...';
        const balances = await fetchBalances();
        if (!balances.length) {
          if (placeholder)
            placeholder.textContent = 'No tokens found in this wallet.';
          if (window.walletPortfolioChartInstance) {
            window.walletPortfolioChartInstance.destroy();
            window.walletPortfolioChartInstance = null;
          }
          return;
        }
        if (placeholder) placeholder.textContent = '';
        const data = {
          labels: balances.map((b) => b.symbol),
          datasets: [
            {
              data: balances.map((b) => b.value),
              backgroundColor: balances.map((b) => b.color),
              borderColor: '#222',
              borderWidth: 2,
            },
          ],
        };
        const config = {
          type: 'doughnut',
          data,
          options: {
            plugins: {
              legend: {
                labels: {
                  color:
                    getComputedStyle(document.body).getPropertyValue(
                      '--text',
                    ) || '#fff',
                },
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    return `${label}: ${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
                  },
                },
              },
            },
          },
        };
        if (window.walletPortfolioChartInstance) {
          window.walletPortfolioChartInstance.destroy();
        }
        window.walletPortfolioChartInstance = new Chart(chartEl, config);
      } catch (err) {
        console.error('Error rendering portfolio chart:', err);
      }
    }
    renderPortfolioChart();
    // Refresh on wallet/account change
    if (window.ethereum) {
      window.ethereum.on &&
        window.ethereum.on('accountsChanged', renderPortfolioChart);
      window.ethereum.on &&
        window.ethereum.on('chainChanged', renderPortfolioChart);
    }
    // Also refresh every 60s
    setInterval(renderPortfolioChart, 60000);
  } catch (err) {
    console.error('Error initializing wallet portfolio:', err);
  }
};
// 2. Real-Time Notifications
/** @type {any} */
/**
 * @typedef {Window & typeof globalThis & {initNotifications?: Function, showToast?: Function}} CustomWindow
 */
/** @type {CustomWindow} */
const customWindow = window;

/**
 * Initializes real-time notifications.
 */
customWindow.initNotifications = function () {
  // --- Real-Time Notification System ---
  if (customWindow.showToast) return; // Only initialize once
  customWindow.showToast = function (message, opts = {}) {
    const container = document.getElementById('toastContainer');
    if (!container) return alert(message); // fallback
    const toast = document.createElement('div');
    toast.className = 'toast-message ' + (opts.type || 'info');
    toast.setAttribute('role', 'status');
    toast.setAttribute('tabindex', '0');
    toast.style.pointerEvents = 'auto';
    toast.style.background =
      opts.type === 'error'
        ? 'rgba(239,68,68,0.95)'
        : opts.type === 'success'
          ? 'rgba(16,185,129,0.95)'
          : 'rgba(0,212,255,0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '16px 28px';
    toast.style.marginBottom = '12px';
    toast.style.borderRadius = '10px';
    toast.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
    toast.style.fontSize = '1.08em';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '12px';
    toast.innerHTML =
      (opts.type === 'error' ? '❌' : opts.type === 'success' ? '✅' : '🔔') +
      '<span>' +
      message +
      '</span>';
    container.appendChild(toast);
    toast.focus();
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => container.removeChild(toast), 400);
    }, opts.duration || 3500);
  };
};
// 3. Theme Auto-Switch
/** @function window.initThemeSettings */
/**
 * Initializes theme auto-switch and toggle.
 */
window.initThemeSettings = function () {
  // --- Theme Auto-Switch Implementation ---
  const THEME_KEY = 'dashboard-theme';
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.checked = theme === 'dark';
  }
  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY);
  }
  function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    window.showToast &&
      window.showToast(`Switched to ${theme} mode`, { type: 'info' });
  }
  // Detect and apply theme on load
  let theme = getSavedTheme();
  if (!theme) {
    theme = prefersDark.matches ? 'dark' : 'light';
  }
  applyTheme(theme);
  // Listen for system theme changes
  prefersDark.addEventListener('change', (e) => {
    if (!getSavedTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
  // Toggle handler
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      setTheme(e.target.checked ? 'dark' : 'light');
    });
  }
};
// 4. Staking History & Analytics
/** @function window.initStakingHistory */
/**
 * Initializes staking history and analytics.
 */
window.initStakingHistory = function () {
  // --- Staking History & Analytics Implementation ---
  const table = document.getElementById('stakingHistoryTable');
  const chartEl = document.getElementById('stakingHistoryChart');
  const placeholder = document.getElementById('stakingHistoryPlaceholder');
  if (!table || !chartEl) return;
  if (!window.account || !window.stakingContract) {
    if (placeholder)
      placeholder.textContent = 'Connect your wallet to view staking history.';
    return;
  }
  async function fetchStakingEvents() {
    // Example: Fetch events from contract (replace with actual ABI/event names as needed)
    try {
      const filterStake = window.stakingContract.filters.Staked(window.account);
      const filterUnstake = window.stakingContract.filters.Unstaked(
        window.account,
      );
      const [stakeEvents, unstakeEvents] = await Promise.all([
        window.stakingContract.queryFilter(filterStake, 0, 'latest'),
        window.stakingContract.queryFilter(filterUnstake, 0, 'latest'),
      ]);
      // Normalize events
      const events = [
        ...stakeEvents.map((e) => ({
          type: 'Stake',
          amount: parseFloat(ethers.utils.formatEther(e.args.amount)),
          pool: e.args.poolId?.toString?.() || '-',
          tx: e.transactionHash,
          block: e.blockNumber,
          time: null, // will fill below
        })),
        ...unstakeEvents.map((e) => ({
          type: 'Unstake',
          amount: parseFloat(ethers.utils.formatEther(e.args.amount)),
          pool: e.args.poolId?.toString?.() || '-',
          tx: e.transactionHash,
          block: e.blockNumber,
          time: null,
        })),
      ];
      // Sort by block desc
      events.sort((a, b) => b.block - a.block);
      // Fetch timestamps for each event (batch by unique block)
      const blockNumbers = [...new Set(events.map((e) => e.block))];
      const blockTimestamps = {};
      await Promise.all(
        blockNumbers.map(async (block) => {
          const b = await window.provider.getBlock(block);
          blockTimestamps[block] = b.timestamp * 1000;
        }),
      );
      events.forEach((e) => {
        e.time = new Date(blockTimestamps[e.block]).toLocaleString();
      });
      return events;
    } catch (e) {
      if (placeholder)
        placeholder.textContent = 'Error loading staking history.';
      return [];
    }
  }
  async function renderStakingTable() {
    if (placeholder) placeholder.textContent = 'Loading staking history...';
    const events = await fetchStakingEvents();
    if (!events.length) {
      if (placeholder) placeholder.textContent = 'No staking history found.';
      table.innerHTML = '';
      return;
    }
    if (placeholder) placeholder.textContent = '';
    // Render table
    table.innerHTML =
      `<tr><th>Type</th><th>Amount</th><th>Pool</th><th>Time</th><th>Tx</th></tr>` +
      events
        .map(
          (e) =>
            `<tr><td>${e.type}</td><td>${e.amount}</td><td>${e.pool}</td><td>${e.time}</td><td><a href='https://polygonscan.com/tx/${e.tx}' target='_blank'>View</a></td></tr>`,
        )
        .join('');
  }
  async function renderStakingChart() {
    const events = await fetchStakingEvents();
    if (!events.length) {
      if (window.stakingHistoryChartInstance) {
        window.stakingHistoryChartInstance.destroy();
        window.stakingHistoryChartInstance = null;
      }
      return;
    }
    // Group by date
    const daily = {};
    events.forEach((e) => {
      const d = e.time.split(',')[0];
      if (!daily[d]) daily[d] = { Stake: 0, Unstake: 0 };
      daily[d][e.type] += e.amount;
    });
    const labels = Object.keys(daily).reverse();
    const stakeData = labels.map((d) => daily[d].Stake);
    const unstakeData = labels.map((d) => daily[d].Unstake);
    const data = {
      labels,
      datasets: [
        {
          label: 'Staked',
          data: stakeData,
          backgroundColor: 'rgba(16,185,129,0.3)',
          borderColor: 'rgba(16,185,129,1)',
          borderWidth: 2,
          type: 'bar',
        },
        {
          label: 'Unstaked',
          data: unstakeData,
          backgroundColor: 'rgba(239,68,68,0.2)',
          borderColor: 'rgba(239,68,68,1)',
          borderWidth: 2,
          type: 'line',
          fill: false,
        },
      ],
    };
    const config = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Staking Activity Over Time' },
        },
        scales: { y: { beginAtZero: true } },
      },
    };
    if (window.stakingHistoryChartInstance) {
      window.stakingHistoryChartInstance.destroy();
    }
    window.stakingHistoryChartInstance = new Chart(chartEl, config);
  }
  renderStakingTable();
  renderStakingChart();
  // Refresh on account/chain change
  if (window.ethereum) {
    window.ethereum.on &&
      window.ethereum.on('accountsChanged', () => {
        renderStakingTable();
        renderStakingChart();
      });
    window.ethereum.on &&
      window.ethereum.on('chainChanged', () => {
        renderStakingTable();
        renderStakingChart();
      });
  }
  // Also refresh every 60s
  setInterval(() => {
    renderStakingTable();
    renderStakingChart();
  }, 60000);
};
// 5. Community Chat Widget
window.initCommunityChat = function () {
  // --- Community Chat Widget Implementation ---
  const chatEl = document.getElementById('communityChatWidget');
  if (!chatEl) return;
  // Only embed if not already present
  if (chatEl.querySelector('iframe')) return;
  // Example: Discord widget (replace with your server ID and channel ID)
  const DISCORD_SERVER_ID = '112233445566778899'; // TODO: Replace with real server ID
  const DISCORD_CHANNEL_ID = null; // Optional: channel ID
  let src = `https://discord.com/widget?id=${DISCORD_SERVER_ID}&theme=dark`;
  if (DISCORD_CHANNEL_ID) src += `&channel=${DISCORD_CHANNEL_ID}`;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.width = '100%';
  iframe.height = '400';
  iframe.allowTransparency = 'true';
  iframe.setAttribute('frameborder', '0');
  iframe.sandbox =
    'allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts';
  iframe.style.borderRadius = '12px';
  iframe.style.background = 'var(--card)';
  iframe.title = 'Community Chat (Discord)';
  chatEl.innerHTML = '';
  chatEl.appendChild(iframe);
  // Fallback message if widget fails
  setTimeout(() => {
    if (!iframe.contentWindow) {
      chatEl.innerHTML =
        '<div style="color:var(--accent);padding:16px;">Unable to load Discord chat. <a href="https://discord.com/invite/YOUR_INVITE" target="_blank" rel="noopener">Join directly</a>.</div>';
    }
  }, 5000);
};
// 6. NFT Gallery
window.initNFTGallery = function () {
  // TODO: Fetch/display user NFTs in #nftGalleryPlaceholder
};
// 7. Gas Fee Estimator
window.initGasFeeEstimator = function () {
  // TODO: Fetch Polygon gas price, update #gasFeeEstimate on #gasSpeedSelect change
};
// 8. Referral Leaderboard
window.initReferralLeaderboard = function () {
  // TODO: Fetch/display top referrers in #referralLeaderboardPlaceholder, handle referral link copy
};
// 9. Multi-Language Support
window.initLanguageSelector = function () {
  // TODO: Wire up #languageSelect, load translations, update #currentLanguage
};
// 10. Advanced Analytics
window.initAdvancedAnalytics = function () {
  // TODO: Render more charts in #advancedAnalyticsChart, fetch analytics data
};

// New Features Scripts
async function loadPrice() {
  try {
    const res = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/' + AETH_ADDRESS,
    );
    const data = await res.json();
    const price = data.pairs[0].priceUsd;
    const el = document.createElement('div');
    el.innerHTML = 'AETH Price: $' + parseFloat(price).toFixed(4);
    el.style.color = '#00d4ff';
    document.querySelector('.header').appendChild(el);
  } catch {}
}
loadPrice();
setInterval(loadPrice, 30000);

async function loadPoolData() {
  if (!stakingContract) return;
  for (let i = 0; i < 3; i++) {
    const pool = await stakingContract.pools(i);
    console.log('Pool', i, pool);
  }
}
setInterval(loadPoolData, 15000);

if (window.ethereum) {
  ethereum.on('accountsChanged', () => location.reload());
  ethereum.on('chainChanged', () => location.reload());
}

async function loadTreasury() {
  if (!stakingContract || !aethContract || !provider) return;
  try {
    // Example: Fetch staking totals from pools
    let totalTreasury = 0;
    let stakingRewards = 0;
    for (let i = 0; i < 3; i++) {
      const pool = await stakingContract.pools(i);
      totalTreasury += parseFloat(ethers.utils.formatEther(pool[0]));
      stakingRewards += parseFloat(ethers.utils.formatEther(pool[1]));
    }
    document.getElementById('treasuryTotal').textContent =
      totalTreasury.toFixed(2) + ' AETH';
    document.getElementById('stakingRewards').textContent =
      stakingRewards.toFixed(2) + ' AETH';
    // Example: Protocol fees stored in contract
    // If you track fees in MATIC:
    const fees = await provider.getBalance(AETH_ADDRESS); // Replace with actual contract method if exists
    document.getElementById('protocolFees').textContent =
      parseFloat(ethers.utils.formatEther(fees)).toFixed(4) + ' MATIC';
  } catch (e) {
    console.error('Error loading treasury:', e);
  }
}
// Refresh button
document
  .getElementById('refreshTreasuryBtn')
  .addEventListener('click', loadTreasury);
// Auto-load on page
window.addEventListener('DOMContentLoaded', loadTreasury);

let treasuryChartInstance;
async function updateTreasuryChart() {
  if (!stakingContract || !aethContract || !provider) return;
  try {
    // Fetch pool info
    const labels = ['Pool 0', 'Pool 1', 'Pool 2'];
    const stakingData = [];
    const treasuryData = [];
    for (let i = 0; i < 3; i++) {
      const pool = await stakingContract.pools(i);
      treasuryData.push(parseFloat(ethers.utils.formatEther(pool[0])));
      stakingData.push(parseFloat(ethers.utils.formatEther(pool[1])));
    }
    // Protocol fees in MATIC (example)
    const fees = parseFloat(
      ethers.utils.formatEther(await provider.getBalance(AETH_ADDRESS)),
    );
    const data = {
      labels,
      datasets: [
        {
          label: 'Treasury (AETH)',
          data: treasuryData,
          backgroundColor: 'rgba(0, 212, 255, 0.3)',
          borderColor: 'rgba(0, 212, 255, 1)',
          borderWidth: 2,
          tension: 0.4,
          type: 'bar',
        },
        {
          label: 'Staking Rewards (AETH)',
          data: stakingData,
          backgroundColor: 'rgba(138, 43, 226, 0.2)',
          borderColor: 'rgba(138, 43, 226, 1)',
          borderWidth: 2,
          tension: 0.4,
          type: 'line',
          fill: true,
        },
        {
          label: 'Protocol Fees (MATIC)',
          data: [fees, fees, fees],
          borderColor: 'rgba(255, 107, 53, 1)',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 53, 1)',
          type: 'line',
          fill: false,
        },
      ],
    };
    const config = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Treasury & Staking Overview',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
    if (treasuryChartInstance) {
      treasuryChartInstance.destroy();
    }
    treasuryChartInstance = new Chart(
      document.getElementById('treasuryChart'),
      config,
    );
  } catch (e) {
    console.error('Error updating treasury chart:', e);
  }
}
window.addEventListener('DOMContentLoaded', updateTreasuryChart);
setInterval(updateTreasuryChart, 30000);

// Analytics/Engagement Chart
window.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('engagementChart');
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Active Users',
            data: [12, 19, 14, 17, 23, 20, 25],
            fill: true,
            backgroundColor: 'rgba(0,212,255,0.12)',
            borderColor: 'rgba(0,212,255,1)',
            tension: 0.4,
            pointBackgroundColor: 'var(--accent)',
            pointRadius: 5,
            borderWidth: 3,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color:
                getComputedStyle(document.body).getPropertyValue('--primary') ||
                '#00d4ff',
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color:
                getComputedStyle(document.body).getPropertyValue(
                  '--text-main',
                ) || '#fff',
            },
          },
          y: {
            ticks: {
              color:
                getComputedStyle(document.body).getPropertyValue(
                  '--text-main',
                ) || '#fff',
            },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
});

// Payment history render
window.addEventListener('DOMContentLoaded', () => {
  window.renderPaymentHistory && window.renderPaymentHistory();
});

// Localization/i18n
const translations = {
  en: {
    title: 'Aetheron Platform',
    subtitle: 'Decentralized Token & Staking Platform',
    connect: 'Connect Wallet',
    buy: 'Buy AETH',
    pay: 'Pay with Crypto (Coinbase)',
    refresh: 'Refresh Balances',
    walletType: 'Wallet Type:',
    connectedAccount: 'Connected Account:',
    network: 'Network:',
    maticBalance: 'MATIC Balance:',
    aethBalance: 'AETH Balance:',
    transfer: 'Transfer AETH',
    recipient: 'Recipient Address:',
    amount: 'Amount (AETH):',
    transferBtn: 'Transfer',
    stake: 'Stake AETH',
    poolId: 'Pool ID:',
    stakeBtn: 'Stake',
    contractInfo: 'Contract Info',
    paymentHistory: 'Payment History',
    engagement: 'Engagement Analytics',
  },
  es: {
    title: 'Plataforma Aetheron',
    subtitle: 'Plataforma Descentralizada de Token y Staking',
    connect: 'Conectar Billetera',
    buy: 'Comprar AETH',
    pay: 'Pagar con Cripto (Coinbase)',
    refresh: 'Actualizar Saldos',
    walletType: 'Tipo de Billetera:',
    connectedAccount: 'Cuenta Conectada:',
    network: 'Red:',
    maticBalance: 'Saldo MATIC:',
    aethBalance: 'Saldo AETH:',
    transfer: 'Transferir AETH',
    recipient: 'Dirección del Destinatario:',
    amount: 'Cantidad (AETH):',
    stake: 'Apostar AETH',
    poolId: 'Pool-ID:',
    stakeBtn: 'Apostar',
    contractInfo: 'Información del Contrato',
    paymentHistory: 'Historial de Pagos',
    engagement: 'Analítica de Participación',
  },
  fr: {
    title: 'Plateforme Aetheron',
    subtitle: 'Plateforme Décentralisée de Jeton & Staking',
    connect: 'Connecter le Portefeuille',
    buy: 'Acheter AETH',
    pay: 'Payer en Crypto (Coinbase)',
    refresh: 'Rafraîchir Soldes',
    walletType: 'Type de Portefeuille:',
    connectedAccount: 'Compte Connecté:',
    network: 'Réseau:',
    maticBalance: 'Solde MATIC:',
    aethBalance: 'Solde AETH:',
    transfer: 'Transférer AETH',
    recipient: 'Adresse du Destinataire:',
    amount: 'Montant (AETH):',
    transferBtn: 'Transférer',
    stake: 'Staker AETH',
    poolId: 'Pool-ID:',
    stakeBtn: 'Staker',
    contractInfo: 'Info du Contrat',
    paymentHistory: 'Historique des Paiements',
    engagement: "Analytique d'Engagement",
  },
  de: {
    title: 'Aetheron Plattform',
    subtitle: 'Dezentrale Token- & Staking-Plattform',
    connect: 'Wallet Verbinden',
    buy: 'AETH Kaufen',
    pay: 'Mit Krypto Bezahlen (Coinbase)',
    refresh: 'Salden Aktualisieren',
    walletType: 'Wallet-Typ:',
    connectedAccount: 'Verbundenes Konto:',
    network: 'Netzwerk:',
    maticBalance: 'MATIC Kontostand:',
    aethBalance: 'AETH Kontostand:',
    transfer: 'AETH Übertragen',
    recipient: 'Empfängeradresse:',
    amount: 'Betrag (AETH):',
    transferBtn: 'Übertragen',
    stake: 'AETH Staken',
    poolId: 'Pool-ID:',
    stakeBtn: 'Staken',
    contractInfo: 'Vertragsinfo',
    paymentHistory: 'Zahlungsverlauf',
    engagement: 'Engagement-Analyse',
  },
};
function setLang(lang) {
  const t = translations[lang] || translations.en;
  document.querySelector('.logo').textContent = '🌌 ' + t.title;
  document.querySelector('.header p').textContent = t.subtitle;
  document.getElementById('connectBtn').textContent = t.connect;
  document.querySelector('.buy-btn').textContent = t.buy;
  document.querySelector('.coinbase-btn').textContent = t.pay;
  document.querySelector('.refresh-btn').textContent = '🔄 ' + t.refresh;
  document.getElementById('walletType').previousSibling.textContent =
    t.walletType + ' ';
  document.getElementById('accountAddress').previousSibling.textContent =
    t.connectedAccount + ' ';
  document.getElementById('networkName').previousSibling.textContent =
    t.network + ' ';
  document.getElementById('ethBalance').previousSibling.textContent =
    t.maticBalance + ' ';
  document.getElementById('aethBalance').previousSibling.textContent =
    t.aethBalance + ' ';
  document.querySelector('.card h2').textContent = '💰 ' + t.transfer;
  document.getElementById('transferTo').previousSibling.textContent =
    t.recipient;
  document.getElementById('transferAmount').previousSibling.textContent =
    t.amount;
  document.querySelector('.card .action-btn').textContent = t.transferBtn;
  document.querySelectorAll('.card h2')[1].textContent = '🎯 ' + t.stake;
  document.getElementById('poolId').previousSibling.textContent = t.poolId;
  document.getElementById('stakeAmount').previousSibling.textContent = t.amount;
  document.querySelectorAll('.card .action-btn')[1].textContent = t.stakeBtn;
  document.querySelectorAll('.card h2')[2].textContent = '📊 ' + t.contractInfo;
  document.querySelector('.payment-history-title').textContent =
    t.paymentHistory;
  document.getElementById('analyticsCard').querySelector('h2').textContent =
    '📈 ' + t.engagement;
}
document.getElementById('langSelect').addEventListener('change', (e) => {
  setLang(e.target.value);
  localStorage.setItem('dashboard-lang', e.target.value);
});
window.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('dashboard-lang') || 'en';
  document.getElementById('langSelect').value = lang;
  setLang(lang);
});
