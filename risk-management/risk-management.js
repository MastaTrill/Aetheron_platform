// Risk Management JavaScript
class RiskManagement {
  constructor() {
    this.charts = {};
    this.riskData = {};
    this.portfolioData = {};
    this.alerts = [];
    this.init();
  }

  init() {
    this.initializeCharts();
    this.loadRiskData();
    this.setupEventListeners();
    this.startRealTimeUpdates();
    this.showToast('Risk Management Dashboard Loaded', 'success');
  }

  initializeCharts() {
    // Risk Profile Chart
    const riskProfileCtx = document.getElementById('riskProfileChart').getContext('2d');
    this.charts.riskProfile = new Chart(riskProfileCtx, {
      type: 'doughnut',
      data: {
        labels: ['Low Risk Assets', 'Medium Risk Assets', 'High Risk Assets'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: [
            '#10b981',
            '#f59e0b',
            '#ef4444'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    // Efficient Frontier Chart
    const efficientFrontierCtx = document.getElementById('efficientFrontierChart').getContext('2d');
    this.charts.efficientFrontier = new Chart(efficientFrontierCtx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Efficient Frontier',
          data: this.generateEfficientFrontierData(),
          backgroundColor: '#667eea',
          borderColor: '#667eea',
          showLine: true,
          fill: false,
          tension: 0.4
        }, {
          label: 'Current Portfolio',
          data: [{ x: 0.15, y: 0.08 }],
          backgroundColor: '#ef4444',
          pointRadius: 8
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Risk (Volatility)'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Expected Return'
            }
          }
        }
      }
    });
  }

  generateEfficientFrontierData() {
    const data = [];
    for (let risk = 0.05; risk <= 0.3; risk += 0.02) {
      const return_val = 0.02 + (risk * 1.5) + (Math.random() * 0.02 - 0.01);
      data.push({ x: risk, y: return_val });
    }
    return data;
  }

  loadRiskData() {
    // Simulate loading risk data
    this.riskData = {
      portfolioRisk: 12.3,
      maxDrawdown: 8.7,
      sharpeRatio: 1.85,
      var95: -2450,
      expectedShortfall: -3120,
      beta: 0.87,
      volatility: 18.5
    };

    this.updateRiskMetrics();
  }

  updateRiskMetrics() {
    document.getElementById('portfolio-risk').textContent = `${this.riskData.portfolioRisk}%`;
    document.getElementById('max-drawdown').textContent = `${this.riskData.maxDrawdown}%`;
    document.getElementById('sharpe-ratio').textContent = this.riskData.sharpeRatio.toFixed(2);
    document.getElementById('var95').textContent = `$${this.riskData.var95.toLocaleString()}`;
    document.getElementById('expectedShortfall').textContent = `$${this.riskData.expectedShortfall.toLocaleString()}`;
    document.getElementById('beta').textContent = this.riskData.beta.toFixed(2);
    document.getElementById('volatility').textContent = `${this.riskData.volatility}%`;
  }

  setupEventListeners() {
    // Allocation sliders
    const sliders = ['stocksAllocation', 'bondsAllocation', 'cryptoAllocation'];
    sliders.forEach(id => {
      const slider = document.getElementById(id);
      const valueSpan = document.getElementById(id.replace('Allocation', 'Value'));
      slider.addEventListener('input', () => {
        valueSpan.textContent = `${slider.value}%`;
        this.updateAllocationTotal();
      });
    });

    // Rule toggles
    const toggles = ['maxLossRule', 'maxDrawdownRule', 'correlationRule'];
    toggles.forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        this.updateRuleStatus(id);
      });
    });
  }

  updateAllocationTotal() {
    const stocks = parseInt(document.getElementById('stocksAllocation').value);
    const bonds = parseInt(document.getElementById('bondsAllocation').value);
    const crypto = parseInt(document.getElementById('cryptoAllocation').value);
    const total = stocks + bonds + crypto;

    if (total !== 100) {
      document.getElementById('stocksValue').style.color = '#ef4444';
      document.getElementById('bondsValue').style.color = '#ef4444';
      document.getElementById('cryptoValue').style.color = '#ef4444';
    } else {
      document.getElementById('stocksValue').style.color = '#10b981';
      document.getElementById('bondsValue').style.color = '#10b981';
      document.getElementById('cryptoValue').style.color = '#10b981';
    }
  }

  updateRuleStatus(ruleId) {
    const checkbox = document.getElementById(ruleId);
    const ruleGroup = checkbox.closest('.rule-group');

    if (checkbox.checked) {
      ruleGroup.style.opacity = '1';
    } else {
      ruleGroup.style.opacity = '0.6';
    }
  }

  calculatePositionSize() {
    const accountBalance = parseFloat(document.getElementById('accountBalance').value);
    const riskPerTrade = parseFloat(document.getElementById('riskPerTrade').value) / 100;
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);

    if (!accountBalance || !riskPerTrade || !entryPrice || !stopLoss) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    const riskAmount = accountBalance * riskPerTrade;
    const stopLossDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = riskAmount / stopLossDistance;

    const resultDiv = document.getElementById('positionSizeResult');
    resultDiv.innerHTML = `
            <div style="color: #10b981; font-weight: 600;">
                Position Size: ${positionSize.toFixed(4)} units
            </div>
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                Risk Amount: $${riskAmount.toFixed(2)} | Stop Distance: $${stopLossDistance.toFixed(2)}
            </div>
        `;

    this.showToast('Position size calculated successfully', 'success');
  }

  calculateRiskReward() {
    const entryPrice = parseFloat(document.getElementById('rrEntryPrice').value);
    const takeProfit = parseFloat(document.getElementById('takeProfit').value);
    const stopLoss = parseFloat(document.getElementById('rrStopLoss').value);

    if (!entryPrice || !takeProfit || !stopLoss) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const riskRewardRatio = reward / risk;

    const resultDiv = document.getElementById('riskRewardResult');
    resultDiv.innerHTML = `
            <div style="color: ${riskRewardRatio >= 2 ? '#10b981' : riskRewardRatio >= 1 ? '#f59e0b' : '#ef4444'}; font-weight: 600;">
                Risk/Reward Ratio: 1:${riskRewardRatio.toFixed(2)}
            </div>
            <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                Risk: $${risk.toFixed(2)} | Reward: $${reward.toFixed(2)}
            </div>
        `;

    this.showToast('Risk/reward ratio calculated', 'success');
  }

  applyRiskRules() {
    const rules = {
      maxLoss: document.getElementById('maxLossRule').checked ? parseFloat(document.getElementById('maxLossValue').value) : null,
      maxDrawdown: document.getElementById('maxDrawdownRule').checked ? parseFloat(document.getElementById('maxDrawdownValue').value) : null,
      correlation: document.getElementById('correlationRule').checked ? parseFloat(document.getElementById('correlationValue').value) : null
    };

    // Simulate applying rules
    this.showLoading(true);
    setTimeout(() => {
      this.showLoading(false);
      this.showToast('Risk rules applied successfully', 'success');

      // Update risk metrics based on rules
      if (rules.maxLoss) {
        this.riskData.portfolioRisk = Math.min(this.riskData.portfolioRisk, rules.maxLoss);
      }
      if (rules.maxDrawdown) {
        this.riskData.maxDrawdown = Math.min(this.riskData.maxDrawdown, rules.maxDrawdown);
      }

      this.updateRiskMetrics();
    }, 1500);
  }

  optimizePortfolio() {
    this.showLoading(true);

    setTimeout(() => {
      this.showLoading(false);

      // Update efficient frontier with new optimal point
      const optimalPoint = { x: 0.12, y: 0.095 };
      this.charts.efficientFrontier.data.datasets[1].data = [optimalPoint];
      this.charts.efficientFrontier.update();

      this.showToast('Portfolio optimized successfully', 'success');
    }, 2000);
  }

  runScenario(scenario) {
    this.showLoading(true);

    const scenarios = {
      crash: {
        name: 'Market Crash',
        impact: -35,
        message: 'Market crash scenario simulation completed'
      },
      bull: {
        name: 'Bull Market',
        impact: 45,
        message: 'Bull market scenario simulation completed'
      },
      defi: {
        name: 'DeFi Protocol Failure',
        impact: -15,
        message: 'DeFi failure scenario simulation completed'
      }
    };

    setTimeout(() => {
      this.showLoading(false);
      const scenarioData = scenarios[scenario];
      this.showToast(scenarioData.message, scenarioData.impact > 0 ? 'success' : 'warning');

      // Update risk metrics based on scenario
      this.riskData.portfolioRisk += scenarioData.impact * 0.1;
      this.updateRiskMetrics();
    }, 2500);
  }

  startRealTimeUpdates() {
    // Simulate real-time risk monitoring
    setInterval(() => {
      // Random small changes to simulate market movement
      this.riskData.portfolioRisk += (Math.random() - 0.5) * 0.1;
      this.riskData.volatility += (Math.random() - 0.5) * 0.05;

      // Keep values in reasonable ranges
      this.riskData.portfolioRisk = Math.max(5, Math.min(25, this.riskData.portfolioRisk));
      this.riskData.volatility = Math.max(10, Math.min(30, this.riskData.volatility));

      this.updateRiskMetrics();

      // Check for alerts
      this.checkRiskAlerts();
    }, 30000); // Update every 30 seconds
  }

  checkRiskAlerts() {
    if (this.riskData.portfolioRisk > 15 && !this.alerts.includes('high_risk')) {
      this.showRiskAlert('High Risk Alert', 'Portfolio risk has exceeded 15%', 'warning');
      this.alerts.push('high_risk');
    }

    if (this.riskData.volatility > 25 && !this.alerts.includes('high_volatility')) {
      this.showRiskAlert('High Volatility', 'Market volatility is above normal levels', 'danger');
      this.alerts.push('high_volatility');
    }
  }

  showRiskAlert(title, message, type) {
    const alertsContainer = document.querySelector('.alerts-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-card ${type}`;
    alertDiv.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="alert-content">
                <h4>${title}</h4>
                <p>${message}</p>
                <span class="alert-time">Just now</span>
            </div>
        `;

    alertsContainer.insertBefore(alertDiv, alertsContainer.firstChild);

    // Remove alert after 10 seconds
    setTimeout(() => {
      alertDiv.remove();
      this.alerts = this.alerts.filter(alert => alert !== type + '_alert');
    }, 10000);
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = {
      success: 'check-circle',
      error: 'times-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    }[type] || 'info-circle';

    toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

    toastContainer.appendChild(toast);

    // Remove toast after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RiskManagement();
});

// Global functions for HTML onclick handlers
function calculatePositionSize() {
  window.riskManager?.calculatePositionSize();
}

function calculateRiskReward() {
  window.riskManager?.calculateRiskReward();
}

function applyRiskRules() {
  window.riskManager?.applyRiskRules();
}

function optimizePortfolio() {
  window.riskManager?.optimizePortfolio();
}

function runScenario(scenario) {
  window.riskManager?.runScenario(scenario);
}</content >
  <parameter name="filePath">c:\Users\willi\.vscode\Aetheron_platform\risk-management\risk-management.js