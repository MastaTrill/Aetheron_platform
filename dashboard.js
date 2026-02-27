// Aetheron Dashboard JavaScript
class AetheronDashboard {
  constructor() {
    // Initialize all properties before use
    this.tradingVolume = 0;
    this.tradingRewards = null;
    this.communityStats = {};
    this.achievements = [];
    this.currentSection = 'dashboard';
    this.referralCode = this.generateReferralCode();
    
    // Initialize all setup methods
    this.setupTradingIncentives();
    this.setupCommunityFeatures();
    this.setupEventListeners();
    this.startRealTimeUpdates();
    this.loadDashboardData();
    
    console.log('🚀 AetheronDashboard initialized');
  }

  // Alias notify to showNotification for compatibility
  notify(message, type = 'info') {
    this.showNotification(message, type);
  }

  // Transaction history demo data (replace with real API integration)
  getTxHistory() {
    return JSON.parse(localStorage.getItem('aetheron-tx-history') || '[]');
  }

  setTxHistory(txs) {
    localStorage.setItem('aetheron-tx-history', JSON.stringify(txs));
  }

  renderTxHistory() {
    const table = document.getElementById('txHistoryTable').querySelector('tbody');
    const type = document.getElementById('txTypeFilter').value;
    const date = document.getElementById('txDateFilter').value;
    let txs = this.getTxHistory();
    if (type !== 'all') txs = txs.filter(tx => tx.type === type);
    if (date) txs = txs.filter(tx => tx.date.startsWith(date));
    table.innerHTML = txs.length ? txs.map(tx => `<tr><td>${tx.date}</td><td>${tx.type}</td><td>${tx.amount}</td><td>${tx.token}</td><td>${tx.status}</td></tr>`).join('') : `<tr><td colspan="5" class="text-gray">No transactions found.</td></tr>`;
  }

  exportTxCsv() {
    // ... class methods ...
  }

  handleWalletConnected(account) {
    // Example: Notify on wallet connect
    this.notify('Wallet connected', 'success');
    // Show wallet loading spinner
    const spinner = document.getElementById('walletLoadingSpinner');
    if (spinner) spinner.style.display = 'flex';
    // Update wallet status bar and DOM with account info
    if (!account && window.ethereum && window.ethereum.selectedAddress) {
      account = window.ethereum.selectedAddress;
    }
    if (account) {
      // Update account address in DOM if present
      const accountEl = document.getElementById('accountAddress');
      if (accountEl) accountEl.textContent = account;
      this.updateWalletStatusBar(true);
      setTimeout(() => { if (spinner) spinner.style.display = 'none'; }, 800);
    } else {
      this.updateWalletStatusBar(false);
      if (spinner) spinner.style.display = 'none';
    }
  }

  setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const section =
          e.target.getAttribute('data-section') ||
          e.target.closest('.nav-link').getAttribute('data-section');
        if (section) {
          this.showSection(section);
        }
      });
    });

    // Trading volume incentives
    const tradeButton = document.getElementById('simulate-trade');
    if (tradeButton) {
      tradeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.simulateTrade();
      });
    }

    // Referral system
    const referralButton = document.getElementById('generate-referral');
    if (referralButton) {
      referralButton.addEventListener('click', () =>
        this.generateReferralLink(),
      );
    }

    // Social media sharing
    document.querySelectorAll('.share-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const platform = e.target.dataset.platform;
        this.shareOnSocial(platform);
      });
    });
  }

  setupTradingIncentives() {
    // Trading volume rewards system
    this.tradingRewards = {
      dailyTarget: 1000, // $1000 daily volume target
      currentProgress: 0,
      rewards: [
        { threshold: 100, reward: '5% bonus APY for 24h' },
        { threshold: 500, reward: '10% bonus APY for 24h' },
        { threshold: 1000, reward: '25% bonus APY for 24h' },
        { threshold: 2500, reward: '50% bonus APY for 24h' },
      ],
    };

    this.updateTradingRewards();
  }

  setupCommunityFeatures() {
    // Community engagement features
    this.communityFeatures = {
      leaderboard: [],
      achievements: [],
      events: [],
    };

    this.loadCommunityStats();
    this.setupAchievementSystem();
  }

  startRealTimeUpdates() {
    // Update dashboard data every 30 seconds
    setInterval(() => {
      this.updateLiveStats();
      this.checkTradingMilestones();
    }, 30000);

    // Update community stats every 5 minutes
    setInterval(() => {
      this.updateCommunityStats();
    }, 300000);
  }

  simulateTrade() {
    // Simulate a trade for demo purposes
    const tradeAmount = Math.random() * 100 + 10; // $10-110 trade
    this.tradingVolume += tradeAmount;
    this.tradingRewards.currentProgress += tradeAmount;

    this.updateTradingRewards();
    this.showTradeNotification(tradeAmount);

    console.log(`💰 Simulated trade: $${tradeAmount.toFixed(2)}`);
  }

  updateTradingRewards() {
    const progressBar = document.getElementById('volume-progress');
    const progressText = document.getElementById('volume-text');
    const rewardsList = document.getElementById('trading-rewards');

    if (progressBar && progressText) {
      const progress =
        (this.tradingRewards.currentProgress /
          this.tradingRewards.dailyTarget) *
        100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      progressText.textContent = `$${this.tradingRewards.currentProgress.toFixed(0)} / $${this.tradingRewards.dailyTarget}`;
    }

    if (rewardsList) {
      rewardsList.innerHTML = '';
      this.tradingRewards.rewards.forEach((reward) => {
        const li = document.createElement('li');
        const isUnlocked =
          this.tradingRewards.currentProgress >= reward.threshold;
        li.className = isUnlocked ? 'unlocked' : 'locked';
        li.innerHTML = `<span class="reward-icon">${isUnlocked ? '✅' : '🔒'}</span> $${reward.threshold}+: ${reward.reward}`;
        rewardsList.appendChild(li);
      });
    }
  }

  showTradeNotification(amount) {
    // Create floating notification
    const notification = document.createElement('div');
    notification.className = 'trade-notification';
    notification.innerHTML = `💰 +$${amount.toFixed(2)} volume!`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  generateReferralCode() {
    return 'AETH' + Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  generateReferralLink() {
    const baseUrl = 'https://mastatrill.github.io/Aetheron_platform/';
    const referralLink = `${baseUrl}?ref=${this.referralCode}`;

    // Copy to clipboard
    navigator.clipboard.writeText(referralLink).then(() => {
      this.showNotification('Referral link copied to clipboard!', 'success');
    });

    console.log(`🔗 Generated referral link: ${referralLink}`);
  }

  shareOnSocial(platform) {
    const url = 'https://mastatrill.github.io/Aetheron_platform/';
    const text = `🚀 Check out $AETH - Aetheron Platform! Staking up to 25% APY on Polygon. #DeFi #AETH`;

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  }

  loadCommunityStats() {
    // Simulate loading community stats (in real app, fetch from API)
    this.communityStats = {
      twitterFollowers: Math.floor(Math.random() * 1000) + 100,
      telegramMembers: Math.floor(Math.random() * 500) + 50,
      discordMembers: Math.floor(Math.random() * 200) + 20,
      totalHolders: Math.floor(Math.random() * 100) + 10,
    };

    this.updateCommunityDisplay();
  }

  updateCommunityStats() {
    // Simulate community growth
    Object.keys(this.communityStats).forEach((key) => {
      this.communityStats[key] += Math.floor(Math.random() * 5);
    });

    this.updateCommunityDisplay();
  }

  updateCommunityDisplay() {
    Object.keys(this.communityStats).forEach((key) => {
      const element = document.getElementById(`${key}-count`);
      if (element) {
        element.textContent = this.communityStats[key].toLocaleString();
      }
    });
  }

  setupAchievementSystem() {
    this.achievements = [
      {
        id: 'first-trade',
        name: 'First Trader',
        description: 'Complete your first trade',
        unlocked: false,
      },
      {
        id: 'volume-warrior',
        name: 'Volume Warrior',
        description: 'Reach $1000 daily volume',
        unlocked: false,
      },
      {
        id: 'community-builder',
        name: 'Community Builder',
        description: 'Get 100 social media followers',
        unlocked: false,
      },
      {
        id: 'referral-master',
        name: 'Referral Master',
        description: 'Generate 10 referral links',
        unlocked: false,
      },
    ];

    this.updateAchievements();
  }

  updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    if (achievementsList) {
      achievementsList.innerHTML = '';
      this.achievements.forEach((achievement) => {
        const li = document.createElement('li');
        li.className = `achievement ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        li.innerHTML = `
					<div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
					<div class="achievement-info">
						<h4>${achievement.name}</h4>
						<p>${achievement.description}</p>
					</div>
				`;
        achievementsList.appendChild(li);
      });
    }
  }

  async updateLiveStats() {
    // Show quick stats loading spinner
    const quickStatsSpinner = document.getElementById('quickStatsLoading');
    if (quickStatsSpinner) quickStatsSpinner.style.display = 'flex';
    // Update live trading stats
    const priceElement = document.getElementById('live-price');
    const volumeElement = document.getElementById('live-volume');
    const holdersElement = document.getElementById('live-holders');

    if (priceElement) {
      try {
        // Fetch real price from DexScreener API using the pair address
        const response = await fetch(
          'https://api.dexscreener.com/latest/dex/pairs/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D',
        );
        const data = await response.json();

        if (data && data.pairs && data.pairs[0]) {
          const price = parseFloat(data.pairs[0].priceUsd);
          priceElement.textContent = `$${price.toFixed(6)}`;
          console.log(`📊 Real price updated: $${price.toFixed(6)}`);
        } else {
          // Fallback to mock price if API fails
          const mockPrice = (0.0001 + Math.random() * 0.0002).toFixed(6);
          priceElement.textContent = `$${mockPrice}`;
          console.log(`📊 Mock price (API failed): $${mockPrice}`);
        }
      } catch (error) {
        // Fallback to mock price if API fails
        const mockPrice = (0.0001 + Math.random() * 0.0002).toFixed(6);
        priceElement.textContent = `$${mockPrice}`;
        console.log(`📊 Mock price (API error): $${mockPrice}`, error);
      }
    }

    if (volumeElement) {
      volumeElement.textContent = `$${this.tradingVolume.toFixed(0)}`;
    }

    if (holdersElement) {
      holdersElement.textContent = this.communityStats.totalHolders.toString();
    }
    // Hide quick stats spinner after data loads
    setTimeout(() => { if (quickStatsSpinner) quickStatsSpinner.style.display = 'none'; }, 800);
  }

  checkTradingMilestones() {
    // Check for milestone achievements
    if (
      this.tradingVolume >= 1000 &&
      !this.achievements.find((a) => a.id === 'volume-warrior').unlocked
    ) {
      this.unlockAchievement('volume-warrior');
    }

    if (
      this.communityStats.twitterFollowers >= 100 &&
      !this.achievements.find((a) => a.id === 'community-builder').unlocked
    ) {
      this.unlockAchievement('community-builder');
    }
  }

  unlockAchievement(achievementId) {
    const achievement = this.achievements.find((a) => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.updateAchievements();
      this.showNotification(
        `🏆 Achievement Unlocked: ${achievement.name}!`,
        'achievement',
      );
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;
        this.showSection(section);
      });
    });
  }

  setupSpaceBackground() {
    const canvas = document.getElementById('space-bg');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2,
        opacity: Math.random(),
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0, Math.min(1, star.opacity));
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  showSection(sectionName) {
    console.log(`Attempting to show section: ${sectionName}`);

    // Hide all sections
    document.querySelectorAll('.content-section').forEach((section) => {
      section.classList.remove('active');
      section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
      console.log(`Successfully showed section: ${sectionName}`);
    } else {
      console.error(`Section not found: ${sectionName}`);
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
    });
    const activeLink = document.querySelector(
      `[data-section="${sectionName}"]`,
    );
    if (activeLink) {
      activeLink.classList.add('active');
    }

    this.currentSection = sectionName;
  }

  loadDashboardData() {
    // Load initial dashboard data
    console.log('Loading dashboard data...');
    this.updateLiveStats();
    this.updateTradingRewards();
    this.updateCommunityDisplay();
    this.updateAchievements();
  }
}

// Initialize dashboard immediately
const dashboard = new AetheronDashboard();
window.dashboard = dashboard; // Make globally available

// Also initialize on DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', () => {
  if (!window.dashboard) {
    const dashboard = new AetheronDashboard();
    window.dashboard = dashboard; // Make globally available
  }

  // --- New Feature Placeholders ---
  // 1. Wallet Portfolio Breakdown
  function initWalletPortfolio() {
    const el = document.getElementById('walletPortfolioPlaceholder');
    if (el) el.textContent = 'Loading wallet portfolio (stub)...';
    // TODO: Fetch all ERC-20 balances and render Chart.js pie chart
  }
  // 2. Real-Time Notifications
  function initNotifications() {
    const el = document.getElementById('notificationsPlaceholder');
    if (el) el.textContent = '';
    // Example triggers (replace with real event hooks)
    setTimeout(() => window.dashboard.notify('Staking reward received: +10 AETH', 'success'), 3000);
    setTimeout(() => window.dashboard.notify('New governance proposal: Increase APY', 'info'), 6000);
    setTimeout(() => window.dashboard.notify('Unstaking complete: -100 AETH', 'warning'), 9000);
  }
  // 3. Theme Auto-Switch
  function initThemeSettings() {
    const themeStatus = document.getElementById('themeStatus');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleSwitch = document.getElementById('themeToggleSwitch');
    // Helper: get preferred theme
    function getPreferredTheme() {
      const stored = localStorage.getItem('aetheron-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // System preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    // Helper: set theme
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('aetheron-theme', theme);
      if (themeStatus) themeStatus.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
      if (themeToggleSwitch) themeToggleSwitch.checked = theme === 'auto';
    }
    // Initialize theme
    let theme = getPreferredTheme();
    setTheme(theme);
    // Button click toggles theme
    if (themeToggleBtn) {
      themeToggleBtn.onclick = function () {
        theme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
        setTheme(theme);
      };
    }
    // Switch toggles auto mode
    if (themeToggleSwitch) {
      themeToggleSwitch.onchange = function () {
        if (themeToggleSwitch.checked) {
          localStorage.removeItem('aetheron-theme');
          setTheme(getPreferredTheme());
        } else {
          setTheme(getPreferredTheme());
        }
      };
    }
    // Listen for system theme changes if auto
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('aetheron-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // 4. Staking History & Analytics
  // ... rest of code ...
    const el = document.getElementById('stakingHistoryTable');
    const spinner = document.getElementById('stakingHistorySpinner');
    if (spinner) spinner.style.display = 'flex';
    setTimeout(() => {
      if (el)
        el.querySelector('tbody').innerHTML =
          '<tr><td colspan="5">No data (stub)</td></tr>';
      if (spinner) spinner.style.display = 'none';
    }, 800);
    // TODO: Fetch staking/unstaking events, render table and chart

  
  // 5. Community Chat Widget
  function initCommunityChat() {
    const el = document.getElementById('communityChatWidget');
    if (el) el.textContent = 'Chat widget coming soon (stub).';
    // TODO: Embed Discord/Telegram widget
  }
  // 6. NFT Gallery
  function initNFTGallery() {
    const el = document.getElementById('nftGalleryPlaceholder');
    if (el) el.textContent = 'No NFTs found (stub).';
    // TODO: Fetch/display user NFTs
  }
  // 7. Gas Fee Estimator
  function initGasFeeEstimator() {
    const el = document.getElementById('gasFeeEstimate');
    if (el) el.textContent = 'Estimated gas fee: -- (stub)';
    // TODO: Fetch Polygon gas price, update on speed select
  }
  // 8. Referral Leaderboard
  function initReferralLeaderboard() {
    const el = document.getElementById('referralLeaderboardPlaceholder');
    if (el) el.textContent = 'Leaderboard coming soon (stub).';
    // TODO: Fetch/display top referrers, handle referral link copy
  }
  // 9. Multi-Language Support
  function initLanguageSelector() {
    const el = document.getElementById('currentLanguage');
    if (el) el.textContent = 'Current: English (stub)';
    // TODO: Wire up language selector, load translations
  }
  // 10. Advanced Analytics
  function initAdvancedAnalytics() {
    const el = document.getElementById('advancedAnalyticsPlaceholder');
    const chartEl = document.getElementById('advancedAnalyticsChart');
    if (!chartEl) {
      if (el) el.textContent = 'Analytics chart not found.';
      return;
    }
    if (el) el.textContent = '';

    // Demo data for APY, wallet growth, protocol health
    const labels = [
      'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'
    ];
    const apyData = [5, 5.2, 5.1, 5.3, 5.4, 5.5, 5.6]; // %
    const walletGrowthData = [100, 120, 140, 180, 210, 250, 300]; // # wallets
    const protocolHealthData = [80, 82, 85, 87, 90, 92, 95]; // health score

    // Destroy previous chart if exists
    if (window.advancedAnalyticsChartInstance) {
      window.advancedAnalyticsChartInstance.destroy();
    }

    window.advancedAnalyticsChartInstance = new Chart(chartEl, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'APY (%)',
            data: apyData,
            borderColor: 'rgba(34,197,94,1)',
            backgroundColor: 'rgba(34,197,94,0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Wallet Growth',
            data: walletGrowthData,
            borderColor: 'rgba(59,130,246,1)',
            backgroundColor: 'rgba(59,130,246,0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Protocol Health',
            data: protocolHealthData,
            borderColor: 'rgba(234,179,8,1)',
            backgroundColor: 'rgba(234,179,8,0.1)',
            yAxisID: 'y2',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#fff' } },
          title: {
            display: true,
            text: 'Advanced Analytics: APY, Wallet Growth, Protocol Health',
            color: '#fff',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#fff',
            borderWidth: 1
          }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'APY (%)', color: '#fff' },
            ticks: { color: '#fff', callback: v => v + '%' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Wallets', color: '#fff' },
            ticks: { color: '#fff' },
            grid: { drawOnChartArea: false }
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'right',
            offset: true,
            title: { display: true, text: 'Health Score', color: '#fff' },
            ticks: { color: '#fff' },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }

// Add some startup animations
// Note: The initialization functions are now handled by the AetheronDashboard class constructor

// Add some startup animations
window.addEventListener('load', () => {
  console.log('🚀 Aetheron Platform Loaded Successfully!');
  console.log('🌌 Welcome to the future of space exploration!');
});

// === Dashboard Initialization Functions (outside class) ===
(function() {
  function initWalletPortfolio() {}
  function initNotifications() {}
  function initThemeSettings() {
    // ... existing theme logic ...
    const themeStatus = document.getElementById('themeStatus');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleSwitch = document.getElementById('themeToggleSwitch');
    function getPreferredTheme() {
      const stored = localStorage.getItem('aetheron-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('aetheron-theme', theme);
      if (themeStatus) themeStatus.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
      if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
      if (themeToggleSwitch) themeToggleSwitch.checked = theme === 'auto';
    }
    let theme = getPreferredTheme();
    setTheme(theme);
    if (themeToggleBtn) {
      themeToggleBtn.onclick = function () {
        theme = getPreferredTheme() === 'dark' ? 'light' : 'dark';
        setTheme(theme);
      };
    }
    if (themeToggleSwitch) {
      themeToggleSwitch.onchange = function () {
        if (themeToggleSwitch.checked) {
          localStorage.removeItem('aetheron-theme');
          setTheme(getPreferredTheme());
        } else {
          setTheme(getPreferredTheme());
        }
      };
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('aetheron-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
  function initStakingHistory() {
    const el = document.getElementById('stakingHistoryTable');
    const spinner = document.getElementById('stakingHistorySpinner');
    if (spinner) spinner.style.display = 'flex';
    setTimeout(() => {
      if (el)
        el.querySelector('tbody').innerHTML =
          '<tr><td colspan="5">No data (stub)</td></tr>';
      if (spinner) spinner.style.display = 'none';
    }, 800);
  }
  function initCommunityChat() {
    const el = document.getElementById('communityChatWidget');
    if (el) el.textContent = 'Chat widget coming soon (stub).';
  }
  function initNFTGallery() {
    const el = document.getElementById('nftGalleryPlaceholder');
    if (el) el.textContent = 'No NFTs found (stub).';
  }
  function initGasFeeEstimator() {
    const el = document.getElementById('gasFeeEstimate');
    if (el) el.textContent = 'Estimated gas fee: -- (stub)';
  }
  function initReferralLeaderboard() {
    const el = document.getElementById('referralLeaderboardPlaceholder');
    if (el) el.textContent = 'Leaderboard coming soon (stub).';
  }
  function initLanguageSelector() {
    const el = document.getElementById('currentLanguage');
    if (el) el.textContent = 'Current: English (stub)';
  }
  function initAdvancedAnalytics() {
    const el = document.getElementById('advancedAnalyticsPlaceholder');
    const chartEl = document.getElementById('advancedAnalyticsChart');
    if (!chartEl) {
      if (el) el.textContent = 'Analytics chart not found.';
      return;
    }
    if (el) el.textContent = '';
    const labels = [
      'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'
    ];
    const apyData = [5, 5.2, 5.1, 5.3, 5.4, 5.5, 5.6];
    const walletGrowthData = [100, 120, 140, 180, 210, 250, 300];
    const protocolHealthData = [80, 82, 85, 87, 90, 92, 95];
    if (window.advancedAnalyticsChartInstance) {
      window.advancedAnalyticsChartInstance.destroy();
    }
    window.advancedAnalyticsChartInstance = new Chart(chartEl, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'APY (%)',
            data: apyData,
            borderColor: 'rgba(34,197,94,1)',
            backgroundColor: 'rgba(34,197,94,0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Wallet Growth',
            data: walletGrowthData,
            borderColor: 'rgba(59,130,246,1)',
            backgroundColor: 'rgba(59,130,246,0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          },
          {
            label: 'Protocol Health',
            data: protocolHealthData,
            borderColor: 'rgba(234,179,8,1)',
            backgroundColor: 'rgba(234,179,8,0.1)',
            yAxisID: 'y2',
            tension: 0.4,
            pointRadius: 4,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#fff' } },
          title: {
            display: true,
            text: 'Advanced Analytics: APY, Wallet Growth, Protocol Health',
            color: '#fff',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#fff',
            borderWidth: 1
          }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'APY (%)', color: '#fff' },
            ticks: { color: '#fff', callback: v => v + '%' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Wallets', color: '#fff' },
            ticks: { color: '#fff' },
            grid: { drawOnChartArea: false }
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'right',
            offset: true,
            title: { display: true, text: 'Health Score', color: '#fff' },
            ticks: { color: '#fff' },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: '#fff' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });
  }

// Add some startup animations
