// Yield Aggregator JavaScript
class YieldAggregator {
  constructor() {
    this.yieldOpportunities = [];
    this.userPositions = [];
    this.protocolData = {};
    this.charts = {};
    this.filters = {
      protocol: 'all',
      asset: 'all',
      risk: 'all',
      minApy: 0,
      search: ''
    };
    this.sortBy = 'apy';

    this.init();
  }

  async init() {
    this.showLoading();
    await this.loadDependencies();
    await this.fetchYieldData();
    this.renderDashboard();
    this.setupEventListeners();
    this.hideLoading();
    this.startRealTimeUpdates();
  }

  showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-seedling"></i>
                <p>Loading Yield Opportunities...</p>
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
    return new Promise((resolve) => {
      if (typeof Chart !== 'undefined') {
        console.log('Chart.js already loaded');
        resolve();
      } else {
        console.log('Waiting for Chart.js to load...');
        const checkChart = setInterval(() => {
          if (typeof Chart !== 'undefined') {
            clearInterval(checkChart);
            console.log('Chart.js loaded successfully');
            resolve();
          }
        }, 100);
      }
    });
  }

  async fetchYieldData() {
    try {
      // Simulate API calls - replace with real DeFi protocol APIs
      const [opportunitiesResponse, positionsResponse] = await Promise.all([
        this.mockYieldOpportunitiesAPI(),
        this.mockUserPositionsAPI()
      ]);

      this.yieldOpportunities = opportunitiesResponse;
      this.userPositions = positionsResponse;
      this.updateProtocolData();
    } catch (error) {
      console.error('Error fetching yield data:', error);
      this.showError('Failed to load yield data. Please try again.');
    }
  }

  async mockYieldOpportunitiesAPI() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: 'aave-usdc',
            protocol: 'Aave',
            asset: 'USDC',
            apy: 8.45,
            tvl: 1250000000,
            risk: 'low',
            rewardToken: 'AAVE',
            icon: '🏦',
            description: 'Lending protocol on Ethereum',
            underlyingAsset: 'USDC',
            poolType: 'Lending'
          },
          {
            id: 'compound-eth',
            protocol: 'Compound',
            asset: 'ETH',
            apy: 6.23,
            tvl: 890000000,
            risk: 'low',
            rewardToken: 'COMP',
            icon: '🏢',
            description: 'Decentralized lending protocol',
            underlyingAsset: 'ETH',
            poolType: 'Lending'
          },
          {
            id: 'uniswap-eth-usdc',
            protocol: 'Uniswap',
            asset: 'ETH/USDC',
            apy: 45.67,
            tvl: 820000000,
            risk: 'medium',
            rewardToken: 'UNI',
            icon: '💧',
            description: 'Liquidity pool on Uniswap V3',
            underlyingAsset: 'ETH/USDC LP',
            poolType: 'Liquidity'
          },
          {
            id: 'curve-3pool',
            protocol: 'Curve',
            asset: '3Pool',
            apy: 12.34,
            tvl: 1580000000,
            risk: 'low',
            rewardToken: 'CRV',
            icon: '📈',
            description: 'Stablecoin liquidity pool',
            underlyingAsset: 'USDC/USDT/DAI',
            poolType: 'Stable'
          },
          {
            id: 'sushiswap-sushi-eth',
            protocol: 'SushiSwap',
            asset: 'SUSHI/ETH',
            apy: 67.89,
            tvl: 234000000,
            risk: 'high',
            rewardToken: 'SUSHI',
            icon: '🍣',
            description: 'High-yield liquidity pool',
            underlyingAsset: 'SUSHI/ETH LP',
            poolType: 'Liquidity'
          },
          {
            id: 'pancakeswap-cake-bnb',
            protocol: 'PancakeSwap',
            asset: 'CAKE/BNB',
            apy: 89.12,
            tvl: 456000000,
            risk: 'high',
            rewardToken: 'CAKE',
            icon: '🥞',
            description: 'Yield farming on BSC',
            underlyingAsset: 'CAKE/BNB LP',
            poolType: 'Liquidity'
          }
        ]);
      }, 1000);
    });
  }

  async mockUserPositionsAPI() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: 'pos-1',
            protocol: 'Aave',
            asset: 'USDC',
            amount: 5000,
            apy: 8.45,
            rewards: 125.50,
            value: 5125.50,
            icon: '🏦'
          },
          {
            id: 'pos-2',
            protocol: 'Uniswap',
            asset: 'ETH/USDC',
            amount: 2.5,
            apy: 45.67,
            rewards: 89.23,
            value: 2340.00,
            icon: '💧'
          }
        ]);
      }, 800);
    });
  }

  updateProtocolData() {
    this.protocolData = {};
    this.yieldOpportunities.forEach(opp => {
      if (!this.protocolData[opp.protocol]) {
        this.protocolData[opp.protocol] = {
          name: opp.protocol,
          opportunities: 0,
          totalTVL: 0,
          avgAPY: 0,
          icon: opp.icon
        };
      }
      this.protocolData[opp.protocol].opportunities++;
      this.protocolData[opp.protocol].totalTVL += opp.tvl;
    });

    // Calculate average APY per protocol
    Object.keys(this.protocolData).forEach(protocol => {
      const opps = this.yieldOpportunities.filter(o => o.protocol === protocol);
      const avgAPY = opps.reduce((sum, opp) => sum + opp.apy, 0) / opps.length;
      this.protocolData[protocol].avgAPY = avgAPY;
    });
  }

  renderDashboard() {
    this.renderStats();
    this.renderYieldOpportunities();
    this.renderProtocolCharts();
    this.renderUserPositions();
    this.renderRecommendations();
  }

  renderStats() {
    const totalTVL = this.yieldOpportunities.reduce((sum, opp) => sum + opp.tvl, 0);
    const avgAPY = this.yieldOpportunities.reduce((sum, opp) => sum + opp.apy, 0) / this.yieldOpportunities.length;
    const activeProtocols = Object.keys(this.protocolData).length;
    const userValue = this.userPositions.reduce((sum, pos) => sum + pos.value, 0);

    document.getElementById('totalTVL').textContent = `$${(totalTVL / 1000000000).toFixed(1)}B`;
    document.getElementById('avgAPY').textContent = `${avgAPY.toFixed(2)}%`;
    document.getElementById('activeProtocols').textContent = activeProtocols;
    document.getElementById('positionValue').textContent = `$${userValue.toFixed(2)}`;
  }

  renderYieldOpportunities() {
    const container = document.getElementById('opportunitiesList');
    const emptyState = document.getElementById('emptyState');
    const countElement = document.getElementById('opportunityCount');

    if (!container) return;

    // Filter and sort opportunities
    let filtered = this.filterOpportunities();
    filtered = this.sortOpportunities(filtered);

    countElement.textContent = `${filtered.length} opportunities`;

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = filtered.map(opp => `
            <div class="opportunity-item" data-id="${opp.id}">
                <div class="opportunity-header">
                    <div class="protocol-info">
                        <div class="protocol-icon">${opp.icon}</div>
                        <div class="protocol-details">
                            <h4>${opp.protocol} - ${opp.asset}</h4>
                            <span class="asset">${opp.description}</span>
                        </div>
                    </div>
                    <div class="opportunity-metrics">
                        <div class="apy-value">${opp.apy.toFixed(2)}% APY</div>
                        <div class="tvl-value">$${(opp.tvl / 1000000).toFixed(0)}M TVL</div>
                    </div>
                </div>
                <div class="opportunity-actions">
                    <span class="risk-badge ${opp.risk}">${opp.risk} risk</span>
                    <button class="btn btn-primary btn-sm" onclick="yieldAggregator.addPosition('${opp.id}')">
                        <i class="fas fa-plus"></i>
                        Add
                    </button>
                </div>
            </div>
        `).join('');
  }

  renderProtocolCharts() {
    this.renderProtocolChart();
    this.renderAPYChart();
    this.renderRiskChart();
  }

  renderProtocolChart() {
    const ctx = document.getElementById('protocolChart');
    if (!ctx) return;

    const protocols = Object.values(this.protocolData);
    const data = {
      labels: protocols.map(p => p.name),
      datasets: [{
        label: 'TVL ($B)',
        data: protocols.map(p => p.totalTVL / 1000000000),
        backgroundColor: protocols.map((_, i) => this.getProtocolColor(i)),
        borderWidth: 0
      }]
    };

    this.charts.protocol = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    this.renderProtocolLegend(protocols);
  }

  renderProtocolLegend(protocols) {
    const legendContainer = document.getElementById('protocolLegend');
    if (!legendContainer) return;

    legendContainer.innerHTML = protocols.map((protocol, i) => `
            <div class="legend-item">
                <div class="legend-color" style="background: ${this.getProtocolColor(i)}"></div>
                <span>${protocol.name} ($${(protocol.totalTVL / 1000000000).toFixed(1)}B)</span>
            </div>
        `).join('');
  }

  renderAPYChart() {
    const ctx = document.getElementById('apyChart');
    if (!ctx) return;

    const protocols = Object.values(this.protocolData);
    const data = {
      labels: protocols.map(p => p.name),
      datasets: [{
        label: 'Average APY (%)',
        data: protocols.map(p => p.avgAPY),
        backgroundColor: protocols.map((_, i) => this.getProtocolColor(i)),
        borderRadius: 8,
        borderSkipped: false
      }]
    };

    this.charts.apy = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        }
      }
    });
  }

  renderRiskChart() {
    const ctx = document.getElementById('riskChart');
    if (!ctx) return;

    const riskCounts = {
      low: this.yieldOpportunities.filter(o => o.risk === 'low').length,
      medium: this.yieldOpportunities.filter(o => o.risk === 'medium').length,
      high: this.yieldOpportunities.filter(o => o.risk === 'high').length
    };

    const data = {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{
        data: [riskCounts.low, riskCounts.medium, riskCounts.high],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }]
    };

    this.charts.risk = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  getProtocolColor(index) {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
    return colors[index % colors.length];
  }

  renderUserPositions() {
    const container = document.getElementById('positionsList');
    const emptyState = document.getElementById('noPositions');

    if (!container) return;

    if (this.userPositions.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = this.userPositions.map(pos => `
            <div class="position-item">
                <div class="position-header">
                    <div class="position-icon">${pos.icon}</div>
                    <div class="position-details">
                        <h4>${pos.protocol} - ${pos.asset}</h4>
                        <span class="amount">${pos.amount.toLocaleString()} tokens</span>
                    </div>
                </div>
                <div class="position-metrics">
                    <div class="metric">
                        <div class="metric-label">APY</div>
                        <div class="metric-value positive">${pos.apy.toFixed(2)}%</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Rewards</div>
                        <div class="metric-value positive">$${pos.rewards.toFixed(2)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Value</div>
                        <div class="metric-value">$${pos.value.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `).join('');
  }

  renderRecommendations() {
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    const recommendations = [
      {
        icon: '🎯',
        title: 'High APY Opportunity',
        description: 'Consider adding liquidity to SushiSwap SUSHI/ETH pool for 67.89% APY. This pool offers competitive yields but monitor impermanent loss risk.'
      },
      {
        icon: '🛡️',
        title: 'Risk Management',
        description: 'Your current portfolio is heavily weighted toward high-risk opportunities. Consider diversifying into stablecoin lending protocols like Aave.'
      },
      {
        icon: '📊',
        title: 'Yield Optimization',
        description: 'Compound offers 6.23% APY on ETH lending with lower risk than liquidity pools. Consider reallocating some high-risk positions.'
      }
    ];

    container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-icon">${rec.icon}</div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            </div>
        `).join('');
  }

  filterOpportunities() {
    return this.yieldOpportunities.filter(opp => {
      const matchesProtocol = this.filters.protocol === 'all' || opp.protocol.toLowerCase() === this.filters.protocol;
      const matchesAsset = this.filters.asset === 'all' || opp.asset.includes(this.filters.asset);
      const matchesRisk = this.filters.risk === 'all' || opp.risk === this.filters.risk;
      const matchesMinApy = opp.apy >= this.filters.minApy;
      const matchesSearch = this.filters.search === '' ||
        opp.protocol.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        opp.asset.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesProtocol && matchesAsset && matchesRisk && matchesMinApy && matchesSearch;
    });
  }

  sortOpportunities(opportunities) {
    return opportunities.sort((a, b) => {
      switch (this.sortBy) {
        case 'apy':
          return b.apy - a.apy;
        case 'tvl':
          return b.tvl - a.tvl;
        case 'risk':
          const riskOrder = { low: 1, medium: 2, high: 3 };
          return riskOrder[a.risk] - riskOrder[b.risk];
        case 'reward':
          return a.rewardToken.localeCompare(b.rewardToken);
        default:
          return 0;
      }
    });
  }

  setupEventListeners() {
    // Filter controls
    document.getElementById('protocolFilter')?.addEventListener('change', (e) => {
      this.filters.protocol = e.target.value;
      this.renderYieldOpportunities();
    });

    document.getElementById('assetFilter')?.addEventListener('change', (e) => {
      this.filters.asset = e.target.value;
      this.renderYieldOpportunities();
    });

    document.getElementById('riskFilter')?.addEventListener('change', (e) => {
      this.filters.risk = e.target.value;
      this.renderYieldOpportunities();
    });

    document.getElementById('minApyFilter')?.addEventListener('input', (e) => {
      this.filters.minApy = parseFloat(e.target.value) || 0;
      this.renderYieldOpportunities();
    });

    document.getElementById('sortBy')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderYieldOpportunities();
    });

    document.getElementById('searchFilter')?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.renderYieldOpportunities();
    });

    // Action buttons
    document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshData());
    document.getElementById('addPositionBtn')?.addEventListener('click', () => this.showAddPositionModal());
    document.getElementById('connectWalletBtn')?.addEventListener('click', () => this.connectWallet());

    // Modal
    document.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal());
    document.getElementById('positionForm')?.addEventListener('submit', (e) => this.handleAddPosition(e));
  }

  async refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      refreshBtn.disabled = true;
    }

    await this.fetchYieldData();
    this.renderDashboard();

    setTimeout(() => {
      if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
      }
    }, 1000);
  }

  addPosition(opportunityId) {
    const opportunity = this.yieldOpportunities.find(o => o.id === opportunityId);
    if (opportunity) {
      this.showAddPositionModal(opportunity);
    }
  }

  showAddPositionModal(opportunity = null) {
    const modal = document.getElementById('positionModal');
    if (!modal) return;

    if (opportunity) {
      // Pre-fill form with opportunity data
      document.getElementById('protocolSelect').value = opportunity.protocol.toLowerCase();
      document.getElementById('assetSelect').value = opportunity.asset;
    }

    modal.classList.add('show');
  }

  closeModal() {
    const modal = document.getElementById('positionModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  async handleAddPosition(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const positionData = {
      protocol: formData.get('protocol'),
      asset: formData.get('asset'),
      amount: parseFloat(formData.get('amount'))
    };

    // Simulate adding position
    console.log('Adding position:', positionData);

    // Add to user positions (in real app, this would be an API call)
    const opportunity = this.yieldOpportunities.find(o =>
      o.protocol.toLowerCase() === positionData.protocol &&
      o.asset === positionData.asset
    );

    if (opportunity) {
      const newPosition = {
        id: `pos-${Date.now()}`,
        protocol: opportunity.protocol,
        asset: opportunity.asset,
        amount: positionData.amount,
        apy: opportunity.apy,
        rewards: (positionData.amount * opportunity.apy / 100) * 0.01, // Rough calculation
        value: positionData.amount,
        icon: opportunity.icon
      };

      this.userPositions.push(newPosition);
      this.renderUserPositions();
      this.renderStats();
    }

    this.closeModal();
    event.target.reset();
  }

  connectWallet() {
    // Simulate wallet connection
    console.log('Connecting wallet...');
    alert('Wallet connection would be implemented here with Web3.js');
  }

  startRealTimeUpdates() {
    // Update data every 60 seconds
    setInterval(async () => {
      await this.fetchYieldData();
      this.updateLiveData();
    }, 60000);
  }

  updateLiveData() {
    // Update only the changing values without full re-render
    this.renderStats();
    this.renderYieldOpportunities();
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

    const container = document.querySelector('.recommendations-list');
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing Yield Aggregator');
  window.yieldAggregator = new YieldAggregator();
});

// Global functions for onclick handlers
function closeModal() {
  if (window.yieldAggregator) {
    window.yieldAggregator.closeModal();
  }
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YieldAggregator;
}