// marketing-automation.js
// Automated marketing tools for Aetheron Platform

class AetheronMarketing {
  constructor() {
    this.platform = 'Aetheron';
    this.token = 'AETH';
    this.contract = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
    this.staking = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';
    this.chain = 'Polygon';

    // Quick links
    this.links = {
      dashboard: 'https://mastatrill.github.io/Aetheron_platform/',
      buy: 'https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
      chart:
        'https://dexscreener.com/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D',
      contract:
        'https://polygonscan.com/address/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
      staking: 'https://mastatrill.github.io/Aetheron_platform/#staking',
    };

    this.postedToday = new Set();
    this.init();
  }

  init() {
    this.loadPostedHistory();
    this.schedulePosts();
    console.log('🚀 Aetheron Marketing Automation Initialized');
  }

  loadPostedHistory() {
    try {
      const saved = localStorage.getItem('aetheron_posted');
      if (saved) {
        const data = JSON.parse(saved);
        // Clear posts from more than 24 hours ago
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        this.postedToday = new Set(
          data.filter((item) => item.timestamp > cutoff).map((item) => item.id),
        );
      }
    } catch (e) {
      this.postedToday = new Set();
    }
  }

  savePostedHistory() {
    try {
      const data = [...this.postedToday].map((id) => ({
        id,
        timestamp: Date.now(),
      }));
      localStorage.setItem('aetheron_posted', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save post history');
    }
  }

  // Generate tweet text
  generateTweet(type) {
    const tweets = {
      launch: `🚀 $${this.token} IS NOW LIVE ON ${this.chain}! 🚀

The future of DeFi is here!

✅ ${this.getFormattedSupply()}
✅ Staking up to 25% APY
✅ Audited contracts
✅ Fully decentralized

💰 Buy: ${this.links.buy}
📊 Chart: ${this.links.chart}
🌐 Dashboard: ${this.links.dashboard}

$${this.chain} #DeFi #Crypto #${this.token}`,

      staking: `💎 Why stake $${this.token}? 💎

🔒 3 lock periods:
• 30 days = 5% APY
• 90 days = 12% APY  
• 180 days = 25% APY

The longer you stake, the more you earn! 🚀

Stake now: ${this.links.dashboard}`,

      tokenomics: `📊 $${this.token} TOKENOMICS 📊

💰 Total Supply: ${this.getFormattedSupply()}

📈 Distribution:
• 50% Liquidity Pool
• 20% Team (locked)
• 15% Marketing
• 15% Staking Rewards

Low taxes = happy holders! 💪

$${this.token} $${this.chain} #DeFi`,

      community: `👋 Hey ${this.chain} community! 👋

We just launched $${this.token} - a community-driven DeFi platform!

No whale dumping, no team tokens in circulation, just pure DeFi utility.

Come check us out! 🌟

🌐 ${this.links.dashboard}`,

      engagement: `Hot take: ${new Date().getFullYear()} is the year of ${this.chain} DeFi 🔥

$${this.token} is positioned to be a major player.

Don't sleep on this one. 👀

DYOR: ${this.links.contract}`,

      daily: `🌅 Good morning, $${this.token} family! 🌅

${this.getDailyMotivation()}

What's your stake looking like? 💎

🌐 ${this.links.dashboard}`,

      milestone: `🎉 ${this.getMilestoneMessage()} 🎉

$${this.token} is growing stronger every day!

Thank you for your support! 💎🚀

${this.links.dashboard}`,

      reminder: `📌 Reminder: $${this.token} staking is live! 📌

Don't miss out on up to 25% APY!

🔒 Lock your tokens and earn passive income
💰 Rewards are distributed automatically

Stake here: ${this.links.staking}`,
    };

    return tweets[type] || tweets.launch;
  }

  getFormattedSupply() {
    return '1,000,000,000 tokens';
  }

  getDailyMotivation() {
    const quotes = [
      'HODLing is the new diamond hands 💎',
      'Patience pays in crypto ⏰',
      'Staking today = rewards tomorrow 🚀',
      "DeFi is the future, and you're part of it 🌟",
      'Every stakeholder is an owner 💰',
      'Compound interest is the 8th wonder of the world 🧮',
      'Stay hydrated, stay staked 💧',
      'Slow and steady wins the DeFi race 🐢',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  getMilestoneMessage() {
    const milestones = [
      'New milestone reached!',
      'Another achievement unlocked!',
      'Community growing stronger!',
      'Thank you for the support!',
      "We're just getting started!",
    ];
    return milestones[Math.floor(Math.random() * milestones.length)];
  }

  // Schedule posts
  schedulePosts() {
    // Check every hour
    setInterval(() => this.checkScheduledPosts(), 60 * 60 * 1000);

    // Initial check
    this.checkScheduledPosts();
  }

  checkScheduledPosts() {
    const hour = new Date().getHours();

    // Morning post (9 AM)
    if (hour === 9 && !this.postedToday.has('morning')) {
      this.queuePost('daily');
      this.postedToday.add('morning');
      this.savePostedHistory();
    }

    // Evening post (6 PM)
    if (hour === 18 && !this.postedToday.has('evening')) {
      this.queuePost('engagement');
      this.postedToday.add('evening');
      this.savePostedHistory();
    }
  }

  queuePost(type) {
    const content = this.generateTweet(type);
    console.log('📝 Queued post:', content.substring(0, 50) + '...');

    // In production, this would integrate with Twitter API
    // For now, we just log and provide copyable content
    this.showCopyModal(type, content);
  }

  showCopyModal(type, content) {
    // Escape HTML special characters to prevent XSS
    const escapeHtml = (text) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    // Create modal for easy copying
    const modal = document.createElement('div');
    modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 500px;
            font-family: Arial, sans-serif;
        `;

    modal.innerHTML = `
            <h3 style="margin-bottom: 15px;">📋 Copy ${type} Post</h3>
            <textarea style="width: 100%; height: 200px; margin-bottom: 10px;">${escapeHtml(content)}</textarea>
            <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value).then(() => alert('Copied!'))" 
                    style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                📋 Copy to Clipboard
            </button>
            <button onclick="this.closest('div').remove()" 
                    style="background: #ccc; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                ✕ Close
            </button>
        `;

    document.body.appendChild(modal);
  }

  // Manual post triggers
  postLaunch() {
    const content = this.generateTweet('launch');
    this.showCopyModal('launch', content);
  }

  postStaking() {
    const content = this.generateTweet('staking');
    this.showCopyModal('staking', content);
  }

  postTokenomics() {
    const content = this.generateTweet('tokenomics');
    this.showCopyModal('tokenomics', content);
  }

  // Get all links for sharing
  getShareLinks() {
    return `
🌐 SHARE LINKS:

Dashboard: ${this.links.dashboard}
Buy: ${this.links.buy}
Chart: ${this.links.chart}
Contract: ${this.links.contract}

Or copy this:
Check out $${this.token} - a DeFi gem on $${this.chain}! 🚀 ${this.links.dashboard}
        `;
  }

  // Generate Reddit post
  generateRedditPost(subreddit) {
    const templates = {
      CryptoMoonShots: `
🚀 $${this.token} - JUST LAUNCHED ON ${this.chain} WITH 25% STAKING APY! 🚀

I usually don't post about new launches but this one caught my attention.

**What is Aetheron?**
Aetheron is a DeFi platform built on ${this.chain} featuring token staking with up to 25% APY.

**Tokenomics:**
• Total Supply: ${this.getFormattedSupply()}
• 50% LP (already added!)
• 20% Team (vested)
• 15% Marketing
• 15% Staking Rewards

**What's in it for holders?**
- Passive income through staking
- Low 3% buy / 5% sell tax
- 3 staking pools with different lock periods
- Fully transparent on PolygonScan

**Contract:** ${this.contract}

**Dashboard:** ${this.links.dashboard}

**How to Buy:**
1. Get MATIC on Coinbase/Binance
2. Send to MetaMask
3. Bridge to ${this.chain} via wallet.polygon.technology
4. Swap for ${this.token} on QuickSwap

Always DYOR! NFA! 🚀
            `,

      PolygonMoonShots: `
🔥 $${this.token} - NEW DEFI GEM ON ${this.chain} 🔥

• ${this.getFormattedSupply()}
• Up to 25% APY staking
• Live dashboard
• QuickSwap listed

Contract: ${this.contract}

DYOR: ${this.links.dashboard}
            `,
    };

    return templates[subreddit] || templates.CryptoMoonShots;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.aetheronMarketing = new AetheronMarketing();

  // Make functions globally accessible
  window.postLaunch = () => window.aetheronMarketing.postLaunch();
  window.postStaking = () => window.aetheronMarketing.postStaking();
  window.postTokenomics = () => window.aetheronMarketing.postTokenomics();
  window.getShareLinks = () => {
    console.log(window.aetheronMarketing.getShareLinks());
    alert(window.aetheronMarketing.getShareLinks());
  };
});

// Console helper
console.log('💡 Marketing commands available:');
console.log('   postLaunch() - Generate launch tweet');
console.log('   postStaking() - Generate staking tweet');
console.log('   postTokenomics() - Generate tokenomics tweet');
console.log('   getShareLinks() - Get all shareable links');
