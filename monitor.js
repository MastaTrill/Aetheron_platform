// monitor.js - Platform monitoring and analytics
class AetheronMonitor {
  constructor() {
    this.contracts = {
      AETH: "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e",
      STAKING: "0x896D9d37A67B0bBf81dde0005975DA7850FFa638"
    };
    this.metrics = {
      pageViews: 0,
      walletConnections: 0,
      transactions: 0,
      stakingActivity: 0,
      errors: 0
    };
    this.init();
  }

  init() {
    this.trackPageViews();
    this.monitorWalletConnections();
    this.monitorContractActivity();
    this.setupErrorTracking();
    this.sendMetrics();
  }

  trackPageViews() {
    // Track page views
    this.metrics.pageViews++;
    console.log('📊 Page view tracked');

    // Track user engagement
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      this.trackEvent('time_spent', { seconds: timeSpent });
    });
  }

  monitorWalletConnections() {
    // Listen for wallet connection events
    window.addEventListener('ethereum#initialized', () => {
      this.metrics.walletConnections++;
      this.trackEvent('wallet_connected');
    });

    // Monitor account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          this.trackEvent('account_changed', { address: accounts[0] });
        }
      });
    }
  }

  async monitorContractActivity() {
    try {
      // Check contract balances and activity
      if (window.ethers && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);

        // Monitor AETH transfers
        const aethContract = new ethers.Contract(
          this.contracts.AETH,
          ["event Transfer(address indexed from, address indexed to, uint256 value)"],
          provider
        );

        aethContract.on("Transfer", (from, to, value) => {
          this.metrics.transactions++;
          this.trackEvent('aeth_transfer', {
            from: from,
            to: to,
            value: ethers.formatEther(value)
          });
        });

        // Monitor staking activity
        const stakingContract = new ethers.Contract(
          this.contracts.STAKING,
          ["event Staked(address indexed user, uint256 poolId, uint256 amount)"],
          provider
        );

        stakingContract.on("Staked", (user, poolId, amount) => {
          this.metrics.stakingActivity++;
          this.trackEvent('staking_deposit', {
            user: user,
            poolId: poolId.toString(),
            amount: ethers.formatEther(amount)
          });
        });
      }
    } catch (error) {
      console.error('Contract monitoring error:', error);
    }
  }

  setupErrorTracking() {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.metrics.errors++;
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors++;
      this.trackEvent('promise_rejection', {
        reason: event.reason?.toString()
      });
    });
  }

  trackEvent(eventName, data = {}) {
    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...data
    };

    console.log('📊 Event tracked:', eventData);

    // Send to analytics (replace with actual analytics endpoint)
    this.sendToAnalytics(eventData);
  }

  sendToAnalytics(data) {
    // Placeholder for analytics integration
    // Replace with actual analytics service (Google Analytics, Mixpanel, etc.)
    try {
      // Example: Send to Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', data.event, {
          custom_parameter_1: JSON.stringify(data)
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  sendMetrics() {
    // Send metrics every 5 minutes
    setInterval(() => {
      this.trackEvent('platform_metrics', { ...this.metrics });
    }, 5 * 60 * 1000);
  }

  // Public method to get current metrics
  getMetrics() {
    return { ...this.metrics };
  }
}

// Initialize monitoring when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.aetheronMonitor = new AetheronMonitor();
});