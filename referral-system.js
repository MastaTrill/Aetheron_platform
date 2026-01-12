// referral-system.js - Automated referral tracking and rewards
class ReferralSystem {
  constructor() {
    this.referrals = new Map(); // referrer -> referred users
    this.rewards = new Map(); // user -> earned rewards
    this.conversionRates = {
      trade: 0.05, // 5% of referred user's trade volume
      stake: 0.10, // 10% of referred user's staking rewards
      hold: 0.02  // 2% bonus APY for successful referrals
    };
    this.init();
  }

  init() {
    this.loadReferralData();
    this.setupReferralDashboard();
    this.startRewardCalculation();
    console.log('🤝 Referral System initialized');
  }

  generateReferralCode(userAddress) {
    // Create a unique referral code based on address
    const hash = this.simpleHash(userAddress);
    return 'AETH' + hash.toString(36).toUpperCase().slice(0, 8);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  createReferralLink(referrerAddress) {
    const code = this.generateReferralCode(referrerAddress);
    const baseUrl = 'https://mastatrill.github.io/Aetheron_platform/';
    return `${baseUrl}?ref=${code}`;
  }

  trackReferral(referralCode, newUserAddress) {
    // Find the referrer by code
    let referrerAddress = null;
    for (const [address, code] of this.referrals.entries()) {
      if (code === referralCode) {
        referrerAddress = address;
        break;
      }
    }

    if (referrerAddress && referrerAddress !== newUserAddress) {
      // Add to referrer's list
      if (!this.referrals.has(referrerAddress)) {
        this.referrals.set(referrerAddress, []);
      }
      this.referrals.get(referrerAddress).push({
        address: newUserAddress,
        joined: new Date(),
        trades: 0,
        volume: 0,
        active: true
      });

      // Initialize rewards tracking
      if (!this.rewards.has(referrerAddress)) {
        this.rewards.set(referrerAddress, {
          totalEarned: 0,
          pending: 0,
          history: []
        });
      }

      this.saveReferralData();
      console.log(`👥 Referral tracked: ${newUserAddress} referred by ${referrerAddress}`);

      // Announce successful referral
      this.announceReferral(referrerAddress, newUserAddress);
    }
  }

  recordReferredTrade(referrerAddress, referredAddress, tradeAmount) {
    const referrerList = this.referrals.get(referrerAddress);
    if (referrerList) {
      const referredUser = referrerList.find(user => user.address === referredAddress);
      if (referredUser) {
        referredUser.trades += 1;
        referredUser.volume += tradeAmount;

        // Calculate and add reward
        const reward = tradeAmount * this.conversionRates.trade;
        this.addReward(referrerAddress, reward, 'trade', referredAddress);

        console.log(`💰 Referral reward: ${referrerAddress} earned $${reward.toFixed(4)} from ${referredAddress}'s trade`);
      }
    }
  }

  recordReferredStake(referrerAddress, referredAddress, stakeReward) {
    const referrerList = this.referrals.get(referrerAddress);
    if (referrerList) {
      const referredUser = referrerList.find(user => user.address === referredAddress);
      if (referredUser) {
        // Calculate and add reward
        const reward = stakeReward * this.conversionRates.stake;
        this.addReward(referrerAddress, reward, 'stake', referredAddress);

        console.log(`💰 Referral reward: ${referrerAddress} earned $${reward.toFixed(4)} from ${referredAddress}'s staking`);
      }
    }
  }

  addReward(referrerAddress, amount, type, sourceAddress) {
    const rewards = this.rewards.get(referrerAddress);
    if (rewards) {
      rewards.pending += amount;
      rewards.history.push({
        amount,
        type,
        source: sourceAddress,
        timestamp: new Date(),
        claimed: false
      });

      this.saveReferralData();
    }
  }

  claimRewards(referrerAddress) {
    const rewards = this.rewards.get(referrerAddress);
    if (rewards && rewards.pending > 0) {
      const claimedAmount = rewards.pending;
      rewards.totalEarned += claimedAmount;
      rewards.pending = 0;

      // Mark recent rewards as claimed
      rewards.history.forEach(reward => {
        if (!reward.claimed) {
          reward.claimed = true;
        }
      });

      this.saveReferralData();

      console.log(`✅ ${referrerAddress} claimed $${claimedAmount.toFixed(4)} in referral rewards`);
      return claimedAmount;
    }
    return 0;
  }

  getReferralStats(address) {
    const referrals = this.referrals.get(address) || [];
    const rewards = this.rewards.get(address) || { totalEarned: 0, pending: 0, history: [] };

    return {
      referralCode: this.generateReferralCode(address),
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.active).length,
      totalVolume: referrals.reduce((sum, r) => sum + r.volume, 0),
      totalEarned: rewards.totalEarned,
      pendingRewards: rewards.pending,
      referralLink: this.createReferralLink(address)
    };
  }

  getLeaderboard() {
    const leaderboard = [];
    for (const [address, rewards] of this.rewards.entries()) {
      const referrals = this.referrals.get(address) || [];
      leaderboard.push({
        address,
        totalEarned: rewards.totalEarned,
        pending: rewards.pending,
        referralCount: referrals.length,
        totalVolume: referrals.reduce((sum, r) => sum + r.volume, 0)
      });
    }

    return leaderboard
      .sort((a, b) => (b.totalEarned + b.pending) - (a.totalEarned + a.pending))
      .slice(0, 10);
  }

  announceReferral(referrerAddress, newUserAddress) {
    const announcement = {
      platform: 'twitter',
      content: `👥 New community member joined!\n\nWelcome to the Aetheron family! 🌌\n\nSpecial thanks to our referral champions for bringing new users onboard.\n\nKeep sharing and earn rewards! 💰\n\n#AETH #Community #Referral`,
      scheduled: new Date()
    };

    if (window.marketingLauncher) {
      window.marketingLauncher.postToPlatform(announcement);
    }
  }

  startRewardCalculation() {
    // Calculate bonus APY rewards for successful referrers
    setInterval(() => {
      this.referrals.forEach((referralList, referrerAddress) => {
        const activeReferrals = referralList.filter(r => r.active && r.volume > 100).length;
        if (activeReferrals >= 5) { // Bonus for 5+ active referrals
          const bonusApy = activeReferrals * this.conversionRates.hold;
          // In a real system, this would apply to their staking rewards
          console.log(`🎁 ${referrerAddress} earned ${bonusApy}% bonus APY from ${activeReferrals} active referrals`);
        }
      });
    }, 3600000); // Check hourly
  }

  loadReferralData() {
    // Load from localStorage (in production, this would be from a database)
    const savedReferrals = localStorage.getItem('referralData');
    if (savedReferrals) {
      const data = JSON.parse(savedReferrals);
      this.referrals = new Map(data.referrals.map(([k, v]) => [k, v]));
      this.rewards = new Map(data.rewards.map(([k, v]) => [k, v]));
    }
  }

  saveReferralData() {
    // Save to localStorage (in production, this would be to a database)
    const data = {
      referrals: Array.from(this.referrals.entries()),
      rewards: Array.from(this.rewards.entries())
    };
    localStorage.setItem('referralData', JSON.stringify(data));
  }

  setupReferralDashboard() {
    // Add console commands for managing referrals
    window.getReferralStats = (address) => {
      return this.getReferralStats(address);
    };

    window.getReferralLeaderboard = () => {
      return this.getLeaderboard();
    };

    window.generateReferralLink = (address) => {
      return this.createReferralLink(address);
    };

    window.claimReferralRewards = (address) => {
      return this.claimRewards(address);
    };

    window.simulateReferral = (referrer, referred, amount) => {
      this.trackReferral(this.generateReferralCode(referrer), referred);
      if (amount) {
        this.recordReferredTrade(referrer, referred, amount);
      }
    };

    console.log('🤝 Referral Commands:');
    console.log('- getReferralStats(address)');
    console.log('- getReferralLeaderboard()');
    console.log('- generateReferralLink(address)');
    console.log('- claimReferralRewards(address)');
    console.log('- simulateReferral(referrer, referred, tradeAmount)');
  }

  // Method to check URL for referral code on page load
  checkUrlForReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode) {
      // Store referral code for when user connects wallet
      sessionStorage.setItem('pendingReferral', refCode);
      console.log(`🎯 Referral code detected: ${refCode}`);
    }
  }

  // Method to process referral when user connects wallet
  processPendingReferral(userAddress) {
    const refCode = sessionStorage.getItem('pendingReferral');
    if (refCode) {
      this.trackReferral(refCode, userAddress);
      sessionStorage.removeItem('pendingReferral');
    }
  }
}

// Initialize referral system immediately
const referralSystem = new ReferralSystem();
window.referralSystem = referralSystem; // Make globally available

// Check for referral codes in URL
referralSystem.checkUrlForReferral();

// Also initialize on DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', () => {
  if (!window.referralSystem) {
    const referralSystem = new ReferralSystem();
    window.referralSystem = referralSystem; // Make globally available

    // Check for referral codes in URL
    referralSystem.checkUrlForReferral();
  }
});