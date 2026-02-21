// Aetheron Dashboard JavaScript
class AetheronDashboard {
  constructor() {
    this.currentSection = 'dashboard';
    this.tradingVolume = 0;
    this.communityStats = {
      twitterFollowers: 0,
      telegramMembers: 0,
      discordMembers: 0,
      totalHolders: 0,
    };
    this.referralCode = this.generateReferralCode();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupSpaceBackground();
    this.loadDashboardData();
    this.setupTradingIncentives();
    this.setupCommunityFeatures();
    this.startRealTimeUpdates();
    console.log('🌌 Aetheron Dashboard Initialized!');
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
    if (el) el.textContent = 'No notifications yet (stub).';
    // TODO: Integrate notification system for staking, proposals, price alerts
  }
  // 3. Theme Auto-Switch
  function initThemeSettings() {
    const el = document.getElementById('themeStatus');
    if (el) el.textContent = 'Auto (stub)';
    // TODO: Detect system theme, add toggle, save to localStorage
  }
  // 4. Staking History & Analytics
  function initStakingHistory() {
    const el = document.getElementById('stakingHistoryTable');
    if (el)
      el.querySelector('tbody').innerHTML =
        '<tr><td colspan="5">No data (stub)</td></tr>';
    // TODO: Fetch staking/unstaking events, render table and chart
  }
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
    if (el) el.textContent = 'Advanced analytics coming soon (stub).';
    // TODO: Render more charts, fetch analytics data
  }

  // Call all placeholder initializers
  initWalletPortfolio();
  initNotifications();
  initThemeSettings();
  initStakingHistory();
  initCommunityChat();
  initNFTGallery();
  initGasFeeEstimator();
  initReferralLeaderboard();
  initLanguageSelector();
  initAdvancedAnalytics();
});

// Add some startup animations
window.addEventListener('load', () => {
  console.log('🚀 Aetheron Platform Loaded Successfully!');
  console.log('🌌 Welcome to the future of space exploration!');
});
