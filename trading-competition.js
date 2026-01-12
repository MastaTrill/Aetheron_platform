// trading-competition.js - Automated trading competition system
class TradingCompetition {
  constructor() {
    this.competitions = this.loadCompetitions();
    this.currentCompetition = null;
    this.participants = new Map();
    this.init();
  }

  loadCompetitions() {
    return {
      daily: {
        name: 'Daily Volume Challenge',
        duration: 24 * 60 * 60 * 1000, // 24 hours
        target: 1000, // $1000 volume target
        rewards: {
          first: '10% bonus APY for 7 days',
          second: '7% bonus APY for 5 days',
          third: '5% bonus APY for 3 days',
          participants: '2% bonus APY for 1 day'
        },
        active: false
      },
      weekly: {
        name: 'Weekly Trading Championship',
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        target: 10000, // $10,000 volume target
        rewards: {
          first: '25% bonus APY for 30 days',
          second: '15% bonus APY for 14 days',
          third: '10% bonus APY for 7 days',
          top10: '5% bonus APY for 3 days'
        },
        active: false
      },
      special: {
        name: 'Community Building Event',
        duration: 48 * 60 * 60 * 1000, // 48 hours
        target: 5000, // $5000 volume target
        rewards: {
          milestone: 'Extra rewards for reaching milestones',
          social: 'Bonus for social media shares'
        },
        active: false
      }
    };
  }

  init() {
    this.checkActiveCompetitions();
    this.setupCompetitionDashboard();
    this.startCompetitionMonitoring();
    console.log('🏆 Trading Competition System initialized');
  }

  startCompetition(type) {
    if (this.competitions[type] && !this.competitions[type].active) {
      this.currentCompetition = {
        ...this.competitions[type],
        type,
        startTime: new Date(),
        endTime: new Date(Date.now() + this.competitions[type].duration),
        totalVolume: 0,
        leaderboard: []
      };

      this.competitions[type].active = true;
      this.participants.clear();

      this.announceCompetition();
      console.log(`🏁 ${this.currentCompetition.name} has started!`);
    }
  }

  endCompetition() {
    if (this.currentCompetition) {
      this.calculateWinners();
      this.distributeRewards();
      this.announceWinners();

      // Reset competition
      this.competitions[this.currentCompetition.type].active = false;
      this.currentCompetition = null;

      console.log('🏆 Competition ended and rewards distributed');
    }
  }

  recordTrade(walletAddress, amount, txHash) {
    if (!this.currentCompetition) return;

    // Update participant's volume
    if (!this.participants.has(walletAddress)) {
      this.participants.set(walletAddress, {
        address: walletAddress,
        volume: 0,
        trades: []
      });
    }

    const participant = this.participants.get(walletAddress);
    participant.volume += amount;
    participant.trades.push({
      amount,
      txHash,
      timestamp: new Date()
    });

    // Update total competition volume
    this.currentCompetition.totalVolume += amount;

    // Update leaderboard
    this.updateLeaderboard();

    console.log(`💰 Trade recorded: ${walletAddress} - $${amount}`);
  }

  updateLeaderboard() {
    if (!this.currentCompetition) return;

    this.currentCompetition.leaderboard = Array.from(this.participants.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10); // Top 10
  }

  calculateWinners() {
    if (!this.currentCompetition) return;

    const winners = {
      first: this.currentCompetition.leaderboard[0],
      second: this.currentCompetition.leaderboard[1],
      third: this.currentCompetition.leaderboard[2],
      participants: this.currentCompetition.leaderboard.slice(3)
    };

    this.currentCompetition.winners = winners;
  }

  distributeRewards() {
    // In a real implementation, this would interact with smart contracts
    // For now, we'll just log the rewards
    if (this.currentCompetition.winners) {
      console.log('🎉 Distributing rewards:');
      if (this.currentCompetition.winners.first) {
        console.log(`🥇 1st Place: ${this.currentCompetition.winners.first.address} - ${this.currentCompetition.rewards.first}`);
      }
      if (this.currentCompetition.winners.second) {
        console.log(`🥈 2nd Place: ${this.currentCompetition.winners.second.address} - ${this.currentCompetition.rewards.second}`);
      }
      if (this.currentCompetition.winners.third) {
        console.log(`🥉 3rd Place: ${this.currentCompetition.winners.third.address} - ${this.currentCompetition.rewards.third}`);
      }
    }
  }

  announceCompetition() {
    const announcement = {
      platform: 'twitter',
      content: `🏆 ${this.currentCompetition.name} STARTS NOW! 🏆\n\n🎯 Target: $${this.currentCompetition.target} volume\n⏰ Duration: ${this.currentCompetition.duration / (1000 * 60 * 60)} hours\n\n🏆 Rewards:\n🥇 1st: ${this.currentCompetition.rewards.first}\n🥈 2nd: ${this.currentCompetition.rewards.second}\n🥉 3rd: ${this.currentCompetition.rewards.third}\n\nTrade now: https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e\n\n#AETH #Competition #DeFi`,
      scheduled: new Date()
    };

    // Use the marketing launcher if available
    if (window.marketingLauncher) {
      window.marketingLauncher.postToPlatform(announcement);
    }
  }

  announceWinners() {
    if (!this.currentCompetition.winners) return;

    let winnersText = '';
    if (this.currentCompetition.winners.first) {
      winnersText += `🥇 ${this.currentCompetition.winners.first.address.slice(0, 6)}... - ${this.currentCompetition.rewards.first}\n`;
    }
    if (this.currentCompetition.winners.second) {
      winnersText += `🥈 ${this.currentCompetition.winners.second.address.slice(0, 6)}... - ${this.currentCompetition.rewards.second}\n`;
    }
    if (this.currentCompetition.winners.third) {
      winnersText += `🥉 ${this.currentCompetition.winners.third.address.slice(0, 6)}... - ${this.currentCompetition.rewards.third}\n`;
    }

    const announcement = {
      platform: 'twitter',
      content: `🏆 ${this.currentCompetition.name} RESULTS! 🏆\n\nTotal Volume: $${this.currentCompetition.totalVolume.toFixed(0)}\n\n${winnersText}\nCongratulations to all participants! 🎉\n\nNext competition starts soon...\n\n#AETH #Winners #DeFi`,
      scheduled: new Date()
    };

    if (window.marketingLauncher) {
      window.marketingLauncher.postToPlatform(announcement);
    }
  }

  checkActiveCompetitions() {
    // Check if any competitions should be running
    Object.keys(this.competitions).forEach(type => {
      if (this.competitions[type].active && !this.currentCompetition) {
        // Resume active competition
        this.startCompetition(type);
      }
    });
  }

  startCompetitionMonitoring() {
    // Check for competition end every minute
    setInterval(() => {
      if (this.currentCompetition && new Date() >= this.currentCompetition.endTime) {
        this.endCompetition();
      }
    }, 60000);

    // Check for milestone announcements
    setInterval(() => {
      if (this.currentCompetition) {
        const progress = (this.currentCompetition.totalVolume / this.currentCompetition.target) * 100;
        if (progress >= 25 && !this.currentCompetition.milestone25) {
          this.announceMilestone(25);
          this.currentCompetition.milestone25 = true;
        }
        if (progress >= 50 && !this.currentCompetition.milestone50) {
          this.announceMilestone(50);
          this.currentCompetition.milestone50 = true;
        }
        if (progress >= 75 && !this.currentCompetition.milestone75) {
          this.announceMilestone(75);
          this.currentCompetition.milestone75 = true;
        }
      }
    }, 300000); // Check every 5 minutes
  }

  announceMilestone(percentage) {
    const announcement = {
      platform: 'twitter',
      content: `🎯 MILESTONE REACHED: ${percentage}% of volume target!\n\n$${this.currentCompetition.totalVolume.toFixed(0)} / $${this.currentCompetition.target}\n\nKeep trading to unlock bonus rewards! 🚀\n\n#AETH #Competition #Milestone`,
      scheduled: new Date()
    };

    if (window.marketingLauncher) {
      window.marketingLauncher.postToPlatform(announcement);
    }
  }

  setupCompetitionDashboard() {
    // Add console commands for managing competitions
    window.startDailyCompetition = () => this.startCompetition('daily');
    window.startWeeklyCompetition = () => this.startCompetition('weekly');
    window.startSpecialCompetition = () => this.startCompetition('special');
    window.endCurrentCompetition = () => this.endCompetition();
    window.viewCompetitionStatus = () => {
      if (this.currentCompetition) {
        console.log('Current Competition:', this.currentCompetition);
        console.log('Leaderboard:', this.currentCompetition.leaderboard);
      } else {
        console.log('No active competition');
      }
    };
    window.simulateTrade = (address, amount) => {
      this.recordTrade(address || '0x' + Math.random().toString(16).substr(2, 40), amount || Math.random() * 100);
    };

    console.log('🏆 Competition Commands:');
    console.log('- startDailyCompetition()');
    console.log('- startWeeklyCompetition()');
    console.log('- startSpecialCompetition()');
    console.log('- endCurrentCompetition()');
    console.log('- viewCompetitionStatus()');
    console.log('- simulateTrade(address, amount)');
  }

  getCompetitionStatus() {
    return {
      active: !!this.currentCompetition,
      current: this.currentCompetition,
      available: Object.keys(this.competitions).filter(type => !this.competitions[type].active)
    };
  }
}

// Initialize trading competition system immediately
const tradingCompetition = new TradingCompetition();
window.tradingCompetition = tradingCompetition; // Make globally available

// Also initialize on DOMContentLoaded for safety
document.addEventListener('DOMContentLoaded', () => {
  if (!window.tradingCompetition) {
    const tradingCompetition = new TradingCompetition();
    window.tradingCompetition = tradingCompetition; // Make globally available
  }
});