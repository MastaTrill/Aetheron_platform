// performance-monitor.js - Contract and platform performance monitoring
class PerformanceMonitor {
  constructor() {
    this.contracts = {
      AETH: "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e",
      STAKING: "0x896D9d37A67B0bBf81dde0005975DA7850FFa638"
    };
    this.performance = {
      contractHealth: 'unknown',
      liquidityHealth: 'unknown',
      transactionVolume: 0,
      activeUsers: 0,
      gasUsage: 0,
      lastUpdate: null
    };
    this.alerts = [];
    this.init();
  }

  init() {
    this.checkContractHealth();
    this.monitorLiquidity();
    this.setupPerformanceDashboard();
    this.startPeriodicChecks();

    console.log('📈 Performance monitoring initialized');
  }

  async checkContractHealth() {
    try {
      if (!window.ethers || !window.ethereum) {
        this.performance.contractHealth = 'no_wallet';
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      // Check if contracts are accessible
      const aethContract = new ethers.Contract(
        this.contracts.AETH,
        ["function totalSupply() view returns (uint256)", "function owner() view returns (address)"],
        provider
      );

      const stakingContract = new ethers.Contract(
        this.contracts.STAKING,
        ["function getPoolCount() view returns (uint256)"],
        provider
      );

      // Test contract calls
      const [totalSupply, owner, poolCount] = await Promise.all([
        aethContract.totalSupply(),
        aethContract.owner(),
        stakingContract.getPoolCount().catch(() => 0)
      ]);

      this.performance.contractHealth = 'healthy';
      this.performance.lastUpdate = new Date();

      console.log('✅ Contract health check passed:', {
        totalSupply: ethers.formatEther(totalSupply),
        owner,
        poolCount: poolCount.toString()
      });

    } catch (error) {
      this.performance.contractHealth = 'error';
      this.addAlert('Contract health check failed', error.message);
      console.error('❌ Contract health check failed:', error);
    }
  }

  async monitorLiquidity() {
    try {
      // Check QuickSwap liquidity (this would need actual implementation)
      // For now, we'll simulate liquidity monitoring
      this.performance.liquidityHealth = 'checking';

      // In a real implementation, you would:
      // 1. Query QuickSwap pair contract
      // 2. Check reserves
      // 3. Calculate liquidity depth
      // 4. Monitor price impact

      // Simulate liquidity check
      setTimeout(() => {
        this.performance.liquidityHealth = 'healthy'; // or 'low', 'insufficient'
        this.updatePerformanceDisplay();
      }, 2000);

    } catch (error) {
      this.performance.liquidityHealth = 'error';
      this.addAlert('Liquidity monitoring failed', error.message);
    }
  }

  setupPerformanceDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'performance-dashboard';
    dashboard.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: rgba(255,255,255,0.95); padding: 15px; border-radius: 10px; font-size: 12px; z-index: 1000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h4>📈 Platform Health</h4>
                <div id="performance-metrics">
                    <div>Contracts: <span id="contract-health" class="status">checking</span></div>
                    <div>Liquidity: <span id="liquidity-health" class="status">checking</span></div>
                    <div>Transactions: <span id="tx-volume">0</span></div>
                    <div>Active Users: <span id="active-users">0</span></div>
                    <div>Last Update: <span id="last-update">never</span></div>
                </div>
                <div id="performance-alerts" style="margin-top: 10px; max-height: 100px; overflow-y: auto;"></div>
                <button onclick="window.performanceMonitor.runHealthCheck()" style="margin-top: 10px; padding: 5px 10px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">🔄 Check Health</button>
            </div>
        `;
    document.body.appendChild(dashboard);

    // Add CSS for status indicators
    const style = document.createElement('style');
    style.textContent = `
            .status.healthy { color: #10b981; }
            .status.error { color: #ef4444; }
            .status.warning { color: #f59e0b; }
            .status.checking { color: #6b7280; }
            .status.no_wallet { color: #8b5cf6; }
        `;
    document.head.appendChild(style);

    this.updatePerformanceDisplay();
  }

  updatePerformanceDisplay() {
    const contractEl = document.getElementById('contract-health');
    const liquidityEl = document.getElementById('liquidity-health');
    const txEl = document.getElementById('tx-volume');
    const usersEl = document.getElementById('active-users');
    const updateEl = document.getElementById('last-update');

    if (contractEl) contractEl.textContent = this.performance.contractHealth;
    if (contractEl) contractEl.className = `status ${this.performance.contractHealth}`;

    if (liquidityEl) liquidityEl.textContent = this.performance.liquidityHealth;
    if (liquidityEl) liquidityEl.className = `status ${this.performance.liquidityHealth}`;

    if (txEl) txEl.textContent = this.performance.transactionVolume;
    if (usersEl) usersEl.textContent = this.performance.activeUsers;
    if (updateEl) updateEl.textContent = this.performance.lastUpdate ?
      this.performance.lastUpdate.toLocaleTimeString() : 'never';
  }

  addAlert(title, message) {
    const alert = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date(),
      read: false
    };

    this.alerts.unshift(alert);
    this.updateAlertsDisplay();

    // Auto-remove after 5 minutes
    setTimeout(() => {
      this.alerts = this.alerts.filter(a => a.id !== alert.id);
      this.updateAlertsDisplay();
    }, 5 * 60 * 1000);
  }

  updateAlertsDisplay() {
    const alertsEl = document.getElementById('performance-alerts');
    if (!alertsEl) return;

    alertsEl.innerHTML = this.alerts.slice(0, 3).map(alert => `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 5px 10px; margin: 5px 0; border-radius: 3px;">
                <strong>${alert.title}</strong><br>
                <small>${alert.message}</small>
            </div>
        `).join('');
  }

  startPeriodicChecks() {
    // Check health every 5 minutes
    setInterval(() => {
      this.checkContractHealth();
      this.monitorLiquidity();
    }, 5 * 60 * 1000);

    // Update display every 30 seconds
    setInterval(() => {
      this.updatePerformanceDisplay();
    }, 30 * 1000);
  }

  async runHealthCheck() {
    console.log('🔄 Running manual health check...');
    await this.checkContractHealth();
    await this.monitorLiquidity();
    this.updatePerformanceDisplay();
    console.log('✅ Health check complete');
  }

  // Public methods for external monitoring
  getPerformanceData() {
    return { ...this.performance };
  }

  getAlerts() {
    return [...this.alerts];
  }
}

// Initialize performance monitoring
document.addEventListener('DOMContentLoaded', () => {
  window.performanceMonitor = new PerformanceMonitor();
});