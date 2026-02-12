// Analytics Dashboard JavaScript
class AnalyticsDashboard {
  constructor() {
    this.charts = {};
    this.portfolioData = null;
    this.riskMetrics = null;
    this.yieldOpportunities = null;
    this.isLoading = false;
    this.walletConnected = false;
    this.userAddress = null;

    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
    this.startRealTimeUpdates();
  }

  async init() {
    try {
      this.showLoading();
      await this.loadDependencies();
      this.setupEventListeners();
      await this.checkWalletConnection();
      
      if (this.walletConnected) {
        await this.fetchPortfolioData();
        this.renderDashboard();
      } else {
        this.showWalletPrompt();
      }
      
      this.hideLoading();
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      this.hideLoading();
      this.showError('Failed to initialize analytics dashboard');
    }
  }

  showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-chart-line"></i>
                <p>Loading Analytics...</p>
            </div>
        `;
    document.body.appendChild(overlay);
  }

  hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  async loadDependencies() {
    // Load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
      await this.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
      await this.loadScript('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns');
    }

    // Load date-fns for date handling
    if (typeof dateFns === 'undefined') {
      await this.loadScript('https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js');
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.userAddress = accounts[0];
          this.walletConnected = true;
          this.updateWalletUI();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }

    // Listen for wallet connection events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          this.userAddress = accounts[0];
          this.walletConnected = true;
          this.updateWalletUI();
          this.fetchPortfolioData();
          this.renderDashboard();
        } else {
          this.walletConnected = false;
          this.userAddress = null;
          this.updateWalletUI();
          this.showWalletPrompt();
        }
      });
    }
  }

  async connectWallet() {
    try {
      if (typeof window.ethereum === 'undefined') {
        this.showError('MetaMask not detected. Please install MetaMask to connect your wallet.');
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.userAddress = accounts[0];
      this.walletConnected = true;
      this.updateWalletUI();
      
      // Fetch real portfolio data
      await this.fetchPortfolioData();
      this.renderDashboard();
      
      this.showToast('Wallet connected successfully!', 'success');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      this.showError('Failed to connect wallet. Please try again.');
    }
  }

  updateWalletUI() {
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
      if (this.walletConnected && this.userAddress) {
        connectBtn.innerHTML = `<i class="fas fa-wallet"></i> ${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
        connectBtn.classList.add('connected');
      } else {
        connectBtn.innerHTML = `<i class="fas fa-wallet"></i> Connect Wallet`;
        connectBtn.classList.remove('connected');
      }
    }
  }

  showWalletPrompt() {
    const tbody = document.querySelector('.asset-table tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            <i class="fas fa-wallet"></i>
            <p>Connect your wallet to view portfolio analytics</p>
            <button id="connectPromptBtn" class="btn btn-primary" style="margin-top: 1rem;">
              <i class="fas fa-wallet"></i> Connect Wallet
            </button>
          </td>
        </tr>
      `;

      // Add event listener to the prompt button
      const promptBtn = document.getElementById('connectPromptBtn');
      if (promptBtn) {
        promptBtn.addEventListener('click', () => this.connectWallet());
      }
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  async fetchPortfolioData() {
    if (!this.walletConnected || !this.userAddress) {
      this.showWalletPrompt();
      return;
    }

    try {
      // Fetch real portfolio data from multiple sources
      const [portfolioResponse, riskResponse, yieldResponse] = await Promise.all([
        this.fetchRealPortfolioData(),
        this.calculateRiskMetrics(),
        this.fetchYieldOpportunities()
      ]);

      this.portfolioData = portfolioResponse;
      this.riskMetrics = riskResponse;
      this.yieldOpportunities = yieldResponse;
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      this.showError('Failed to load portfolio data. Please try again.');
    }
  }

  async fetchRealPortfolioData() {
    try {
      // Get token balances from the wallet
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(this.userAddress);
      const ethBalance = parseFloat(ethers.utils.formatEther(balance));

      // Get token prices from DexScreener API
      const priceResponse = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e,0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619,0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');
      const priceData = await priceResponse.json();

      // Extract prices
      const prices = {};
      if (priceData.pairs) {
        priceData.pairs.forEach(pair => {
          if (pair.baseToken.symbol === 'AETH') prices.AETH = parseFloat(pair.priceUsd);
          if (pair.baseToken.symbol === 'WETH') prices.ETH = parseFloat(pair.priceUsd);
          if (pair.baseToken.symbol === 'USDC') prices.USDC = parseFloat(pair.priceUsd);
        });
      }

      // Mock additional tokens for demo (in production, scan wallet for all ERC20 tokens)
      const assets = [
        {
          symbol: 'ETH',
          name: 'Ethereum',
          balance: ethBalance,
          price: prices.ETH || 2850.00,
          change24h: 2.34,
          allocation: 0 // Will be calculated
        },
        {
          symbol: 'AETH',
          name: 'Aetheron Token',
          balance: 1250.50, // Mock balance
          price: prices.AETH || 0.0005512,
          change24h: 5.67,
          allocation: 0
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          balance: 5000.00, // Mock balance
          price: prices.USDC || 1.00,
          change24h: 0.00,
          allocation: 0
        }
      ];

      // Calculate values and allocations
      let totalValue = 0;
      assets.forEach(asset => {
        asset.value = asset.balance * asset.price;
        totalValue += asset.value;
      });

      assets.forEach(asset => {
        asset.allocation = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;
      });

      const totalChange = assets.reduce((sum, asset) => sum + (asset.change24h * asset.allocation / 100), 0);

      return {
        totalValue: totalValue,
        totalChange: totalChange,
        assets: assets,
        performance: {
          '1D': totalChange,
          '7D': totalChange * 7, // Simplified
          '30D': totalChange * 30,
          '90D': totalChange * 90,
          '1Y': totalChange * 365
        },
        historicalData: this.generateHistoricalData(totalValue)
      };
    } catch (error) {
      console.error('Error fetching real portfolio data:', error);
      // Fallback to mock data
      return this.mockPortfolioAPI();
    }
  }

  async mockPortfolioAPI() {
    // Mock portfolio data - replace with real API call
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          totalValue: 45280.50,
          totalChange: 8.45,
          assets: [
            {
              symbol: 'ETH',
              name: 'Ethereum',
              balance: 12.5,
              price: 2850.00,
              value: 35625.00,
              change24h: 2.34,
              allocation: 78.5
            },
            {
              symbol: 'MATIC',
              name: 'Polygon',
              balance: 2500,
              price: 0.85,
              value: 2125.00,
              change24h: -1.23,
              allocation: 4.7
            },
            {
              symbol: 'USDC',
              name: 'USD Coin',
              balance: 7530.50,
              price: 1.00,
              value: 7530.50,
              change24h: 0.00,
              allocation: 16.6
            }
          ],
          performance: {
            '1D': 2.34,
            '7D': 8.45,
            '30D': 15.67,
            '90D': 23.89,
            '1Y': 156.78
          },
          historicalData: this.generateHistoricalData()
        });
      }, 1000);
    });
  }

  async mockRiskAPI() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          volatility: 0.23,
          sharpeRatio: 1.85,
          maxDrawdown: -12.5,
          beta: 0.87,
          diversification: 0.78,
          recommendations: [
            'Consider increasing USDC allocation for stability',
            'Monitor ETH volatility closely',
            'Diversify into more DeFi protocols'
          ]
        });
      }, 800);
    });
  }

  async mockYieldAPI() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            protocol: 'Aave',
            apy: 8.45,
            type: 'Lending',
            risk: 'Low',
            tvl: '$12.5B',
            icon: '🏦'
          },
          {
            protocol: 'Uniswap',
            apy: 45.67,
            type: 'Liquidity',
            risk: 'Medium',
            tvl: '$8.2B',
            icon: '💧'
          },
          {
            protocol: 'Curve',
            apy: 12.34,
            type: 'Stable',
            risk: 'Low',
            tvl: '$15.8B',
            icon: '📈'
          }
        ]);
      }, 600);
    });
  }

  generateHistoricalData() {
    const data = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const value = 40000 + Math.random() * 10000 + i * 100;
      data.push({
        date: date.toISOString(),
        value: value
      });
    }
    return data;
  }

  renderDashboard() {
    this.renderStats();
    this.renderCharts();
    this.renderRiskAnalysis();
    this.renderAssetTable();
    this.renderYieldOpportunities();
    this.renderPerformanceMetrics();
    this.renderAlerts();
  }

  renderStats() {
    const statsGrid = document.querySelector('.stats-grid');

    const stats = [
      {
        label: 'Total Portfolio Value',
        value: `$${this.portfolioData.totalValue.toLocaleString()}`,
        change: this.portfolioData.totalChange,
        icon: 'fas fa-wallet',
        class: 'primary'
      },
      {
        label: '24h Change',
        value: `${this.portfolioData.totalChange > 0 ? '+' : ''}${this.portfolioData.totalChange}%`,
        change: this.portfolioData.totalChange,
        icon: 'fas fa-chart-line',
        class: this.portfolioData.totalChange >= 0 ? 'success' : 'danger'
      },
      {
        label: 'Assets Held',
        value: this.portfolioData.assets.length,
        change: null,
        icon: 'fas fa-coins',
        class: 'info'
      },
      {
        label: 'Best Performer',
        value: this.portfolioData.assets.reduce((best, asset) =>
          asset.change24h > best.change24h ? asset : best
        ).symbol,
        change: this.portfolioData.assets.reduce((best, asset) =>
          asset.change24h > best.change24h ? asset : best
        ).change24h,
        icon: 'fas fa-trophy',
        class: 'warning'
      }
    ];

    statsGrid.innerHTML = stats.map(stat => `
            <div class="stat-card ${stat.class}">
                <div class="icon">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="label">${stat.label}</div>
                <div class="value">${stat.value}</div>
                ${stat.change !== null ? `
                    <div class="change ${stat.change >= 0 ? 'positive' : stat.change < 0 ? 'negative' : 'neutral'}">
                        ${stat.change > 0 ? '+' : ''}${typeof stat.change === 'number' && stat.change % 1 !== 0 ? stat.change.toFixed(2) : stat.change}${typeof stat.change === 'number' ? '%' : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
  }

  renderCharts() {
    this.renderPortfolioChart();
    this.renderAllocationChart();
  }

  renderPortfolioChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    const data = this.portfolioData.historicalData;

    this.charts.portfolio = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Portfolio Value',
          data: data.map(d => ({
            x: new Date(d.date),
            y: d.value
          })),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => `$${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM dd'
              }
            },
            grid: {
              display: false
            }
          },
          y: {
            grid: {
              color: 'rgba(0,0,0,0.05)'
            },
            ticks: {
              callback: (value) => `$${value.toLocaleString()}`
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  }

  renderAllocationChart() {
    const ctx = document.getElementById('allocationChart');
    if (!ctx) return;

    const data = this.portfolioData.assets.map(asset => ({
      label: asset.symbol,
      value: asset.allocation,
      color: this.getAssetColor(asset.symbol)
    }));

    this.charts.allocation = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.label),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: data.map(d => d.color),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });

    // Render custom legend
    this.renderAllocationLegend(data);
  }

  renderAllocationLegend(data) {
    const legendContainer = document.querySelector('.allocation-legend');
    if (!legendContainer) return;

    legendContainer.innerHTML = data.map(item => `
            <div class="legend-item">
                <div class="legend-color" style="background: ${item.color}"></div>
                <span>${item.label} (${item.value}%)</span>
            </div>
        `).join('');
  }

  getAssetColor(symbol) {
    const colors = {
      'ETH': '#627eea',
      'MATIC': '#8247e5',
      'USDC': '#2775ca',
      'WBTC': '#f7931a',
      'LINK': '#2a5ada'
    };
    return colors[symbol] || '#6b7280';
  }

  renderRiskAnalysis() {
    const riskMetrics = document.querySelector('.risk-metrics');
    const recommendations = document.querySelector('.risk-recommendations ul');

    const metrics = [
      {
        label: 'Volatility',
        value: `${(this.riskMetrics.volatility * 100).toFixed(1)}%`,
        percentage: this.riskMetrics.volatility * 100
      },
      {
        label: 'Sharpe Ratio',
        value: this.riskMetrics.sharpeRatio.toFixed(2),
        percentage: Math.min(this.riskMetrics.sharpeRatio * 25, 100)
      },
      {
        label: 'Max Drawdown',
        value: `${this.riskMetrics.maxDrawdown.toFixed(1)}%`,
        percentage: Math.abs(this.riskMetrics.maxDrawdown)
      },
      {
        label: 'Diversification',
        value: `${(this.riskMetrics.diversification * 100).toFixed(0)}%`,
        percentage: this.riskMetrics.diversification * 100
      }
    ];

    riskMetrics.innerHTML = metrics.map(metric => `
            <div class="risk-metric">
                <div class="metric-label">${metric.label}</div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-bar">
                    <div class="metric-fill" style="width: ${metric.percentage}%"></div>
                </div>
            </div>
        `).join('');

    recommendations.innerHTML = this.riskMetrics.recommendations.map(rec => `
            <li><i class="fas fa-lightbulb"></i> ${rec}</li>
        `).join('');
  }

  renderAssetTable() {
    const tbody = document.querySelector('.asset-table tbody');
    if (!tbody) return;

    tbody.innerHTML = this.portfolioData.assets.map(asset => `
            <tr>
                <td>
                    <div class="asset-symbol">${asset.symbol}</div>
                    <div class="asset-name">${asset.name}</div>
                </td>
                <td>${asset.balance.toLocaleString()}</td>
                <td>$${asset.price.toLocaleString()}</td>
                <td>$${asset.value.toLocaleString()}</td>
                <td>
                    <span class="price-change ${asset.change24h >= 0 ? 'positive' : 'negative'}">
                        ${asset.change24h > 0 ? '+' : ''}${asset.change24h.toFixed(2)}%
                    </span>
                </td>
                <td>
                    <div>${asset.allocation.toFixed(1)}%</div>
                    <div class="allocation-bar">
                        <div class="allocation-fill" style="width: ${asset.allocation}%"></div>
                    </div>
                </td>
            </tr>
        `).join('');
  }

  renderYieldOpportunities() {
    const container = document.querySelector('.yield-opportunities');
    if (!container) return;

    container.innerHTML = this.yieldOpportunities.map(opportunity => `
            <div class="yield-item">
                <div class="yield-header">
                    <div class="yield-protocol">
                        <div class="protocol-icon">${opportunity.icon}</div>
                        <div>
                            <div class="asset-symbol">${opportunity.protocol}</div>
                            <div class="asset-name">${opportunity.type}</div>
                        </div>
                    </div>
                    <div class="yield-apy">${opportunity.apy.toFixed(2)}% APY</div>
                </div>
                <div class="yield-details">
                    <span class="yield-type">${opportunity.type}</span>
                    <span class="yield-risk">${opportunity.risk} Risk</span>
                    <span class="yield-tvl">TVL: ${opportunity.tvl}</span>
                </div>
            </div>
        `).join('');
  }

  renderPerformanceMetrics() {
    const container = document.querySelector('.performance-metrics .metric-grid');
    if (!container) return;

    const performance = this.portfolioData.performance;

    container.innerHTML = Object.entries(performance).map(([period, value]) => `
            <div class="metric-item">
                <div class="metric-label">${period}</div>
                <div class="metric-value ${value >= 0 ? 'positive' : 'negative'}">
                    ${value > 0 ? '+' : ''}${value.toFixed(2)}%
                </div>
            </div>
        `).join('');
  }

  renderAlerts() {
    const container = document.querySelector('.alerts-list');
    if (!container) return;

    const alerts = [
      {
        type: 'info',
        icon: 'fas fa-info-circle',
        title: 'Portfolio Rebalancing',
        message: 'Consider rebalancing your portfolio to maintain target allocations.',
        time: '2 hours ago'
      },
      {
        type: 'warning',
        icon: 'fas fa-exclamation-triangle',
        title: 'High Volatility Alert',
        message: 'ETH volatility has increased significantly in the last 24 hours.',
        time: '4 hours ago'
      },
      {
        type: 'success',
        icon: 'fas fa-check-circle',
        title: 'Yield Opportunity',
        message: 'New high-yield opportunity available on Aave protocol.',
        time: '6 hours ago'
      }
    ];

    container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">
                    <i class="${alert.icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${alert.time}</div>
                </div>
            </div>
        `).join('');
  }

  setupEventListeners() {
    // Wallet connection button
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => this.connectWallet());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    // Time range selector
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
      timeRangeSelect.addEventListener('change', (e) => this.changeTimeRange(e.target.value));
    }

    // Search functionality
    const searchInput = document.getElementById('assetSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.filterAssets(e.target.value));
    }
  }

  async refreshData() {
    this.isLoading = true;
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      refreshBtn.disabled = true;
    }

    await this.fetchPortfolioData();
    this.renderDashboard();

    setTimeout(() => {
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
      }
      this.isLoading = false;
    }, 1000);
  }

  exportData() {
    const data = {
      portfolio: this.portfolioData,
      risk: this.riskMetrics,
      yield: this.yieldOpportunities,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  changeTimeRange(range) {
    // Update chart data based on time range
    console.log('Changing time range to:', range);
    // This would fetch different historical data based on the range
  }

  filterAssets(searchTerm) {
    const rows = document.querySelectorAll('.asset-table tbody tr');
    const term = searchTerm.toLowerCase();

    rows.forEach(row => {
      const symbol = row.querySelector('.asset-symbol').textContent.toLowerCase();
      const name = row.querySelector('.asset-name').textContent.toLowerCase();

      if (symbol.includes(term) || name.includes(term)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  startRealTimeUpdates() {
    // Update data every 30 seconds
    setInterval(async () => {
      if (!this.isLoading) {
        await this.fetchPortfolioData();
        this.updateLiveData();
      }
    }, 30000);
  }

  updateLiveData() {
    // Update only the changing values without full re-render
    this.renderStats();
    this.renderAssetTable();
    this.renderPerformanceMetrics();
  }

  showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert-item danger';
    alert.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="alert-content">
                <div class="alert-title">Error</div>
                <div class="alert-message">${message}</div>
            </div>
        `;

    const container = document.querySelector('.alerts-list');
    if (container) {
      container.insertBefore(alert, container.firstChild);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsDashboard;
}

// Initialize the dashboard and make it globally accessible
const analyticsDashboard = new AnalyticsDashboard();
window.analyticsDashboard = analyticsDashboard;