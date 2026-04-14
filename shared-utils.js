// Aetheron Platform - Shared Utilities
// Handles wallet connections, user state, and cross-feature functionality

class AetheronPlatform {
  constructor() {
    this.currentUser = null;
    this.isConnected = false;
    this.userBalance = 0;
    this.userBalanceUSD = 0;
    this.priceData = null;

    this.init();
  }

  init() {
    this.bindGlobalEvents();
    this.loadPriceData();
    this.checkWalletConnection();
  }

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.wallet-btn, #connectWallet, #connectWalletBtn')) {
        e.preventDefault();
        this.connectWallet();
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[onclick*="disconnectWallet"]')) {
        this.disconnectWallet();
      }
    });
  }

  async connectWallet() {
    try {
      if (typeof window.ethereum === 'undefined') {
        this.showToast('MetaMask not detected. Please install MetaMask and refresh the page.', 'error');
        this.showMetaMaskInstallGuide();
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.currentUser = accounts[0];
      this.isConnected = true;

      this.updateUI();
      this.loadUserData();
      this.showToast('Wallet connected successfully!', 'success');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      if (error && (error.code === 4001 || error.message?.includes('User rejected'))) {
        this.showToast('Wallet connection request was rejected.', 'warning');
      } else if (error && error.message?.includes('MetaMask')) {
        this.showToast('MetaMask extension not found. Please install MetaMask.', 'error');
        this.showMetaMaskInstallGuide();
      } else {
        this.showToast('Failed to connect wallet. Please try again.', 'error');
      }
    }
  }

  showMetaMaskInstallGuide() {
    if (document.getElementById('metamask-guide')) return;

    const guide = document.createElement('div');
    guide.id = 'metamask-guide';
    guide.style = 'position:fixed;z-index:9999;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;';

    const panel = document.createElement('div');
    panel.style = 'background:#fff;padding:2em 2.5em;border-radius:12px;max-width:400px;text-align:center;box-shadow:0 4px 32px rgba(0,0,0,0.18);';

    const title = document.createElement('h2');
    title.style.marginBottom = '0.5em';
    title.textContent = 'MetaMask Required';

    const text = document.createElement('p');
    text.style.marginBottom = '1.2em';
    text.appendChild(document.createTextNode('To use wallet features, please '));

    const link = document.createElement('a');
    link.href = 'https://metamask.io/download/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.color = '#f6851b';
    link.style.fontWeight = '600';
    link.textContent = 'install MetaMask';

    text.appendChild(link);
    text.appendChild(document.createTextNode(' and refresh this page.'));

    const closeButton = document.createElement('button');
    closeButton.style = 'background:#f6851b;color:#fff;border:none;padding:0.7em 1.5em;border-radius:6px;font-size:1em;cursor:pointer;';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', () => guide.remove());

    panel.appendChild(title);
    panel.appendChild(text);
    panel.appendChild(closeButton);
    guide.appendChild(panel);
    document.body.appendChild(guide);
  }

  disconnectWallet() {
    this.currentUser = null;
    this.isConnected = false;
    this.userBalance = 0;
    this.userBalanceUSD = 0;
    this.updateUI();
    this.showToast('Wallet disconnected', 'info');
  }

  async checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          this.currentUser = accounts[0];
          this.isConnected = true;
          this.loadUserData();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
    this.updateUI();
  }

  async loadUserData() {
    if (!this.isConnected || !this.currentUser) return;

    try {
      this.userBalance = Math.random() * 1000;
      this.userBalanceUSD = this.userBalance * (this.priceData?.price || 0.0001);
      this.updateUI();
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async loadPriceData() {
    try {
      this.priceData = {
        price: 0.0001234,
        marketCap: 1234567,
        change24h: 5.67,
        liquidity: 890123,
      };
      this.updatePriceDisplays();
    } catch (error) {
      console.error('Error loading price data:', error);
    }
  }

  updateWalletButton(btn) {
    btn.replaceChildren();
    const icon = document.createElement('i');
    icon.className = this.isConnected ? 'fas fa-check' : 'fas fa-wallet';
    btn.appendChild(icon);
    const label = this.isConnected
      ? ` ${this.currentUser.slice(0, 6)}...${this.currentUser.slice(-4)}`
      : ' Connect Wallet';
    btn.appendChild(document.createTextNode(label));
    btn.classList.toggle('connected', this.isConnected);
  }

  updateUI() {
    const walletButtons = document.querySelectorAll('.wallet-btn, #connectWallet, #connectWalletBtn');
    walletButtons.forEach((btn) => this.updateWalletButton(btn));

    const balanceElements = document.querySelectorAll('#userBalance, .user-balance');
    balanceElements.forEach((el) => {
      el.textContent = this.userBalance.toFixed(2);
    });

    const usdElements = document.querySelectorAll('#userBalanceUSD, .user-balance-usd');
    usdElements.forEach((el) => {
      el.textContent = `$${this.userBalanceUSD.toFixed(2)} USD`;
    });

    const connectedSections = document.querySelectorAll('#walletConnected, .wallet-connected');
    const notConnectedSections = document.querySelectorAll('#walletNotConnected, .wallet-not-connected');

    connectedSections.forEach((el) => {
      el.classList.toggle('hidden', !this.isConnected);
    });

    notConnectedSections.forEach((el) => {
      el.classList.toggle('hidden', this.isConnected);
    });
  }

  updatePriceDisplays() {
    if (!this.priceData) return;

    const priceElements = document.querySelectorAll('#priceValue, .aeth-price');
    priceElements.forEach((el) => {
      el.textContent = `$${this.priceData.price.toFixed(6)}`;
    });

    const mcapElements = document.querySelectorAll('.market-cap');
    mcapElements.forEach((el) => {
      el.textContent = `$${(this.priceData.marketCap / 1000000).toFixed(1)}M`;
    });

    const changeElements = document.querySelectorAll('#priceChange, .price-change');
    changeElements.forEach((el) => {
      const change = this.priceData.change24h;
      el.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      el.className = change >= 0 ? 'change positive' : 'change negative';
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const content = document.createElement('div');
    content.className = 'toast-content';

    const title = document.createElement('div');
    title.className = 'toast-title';
    title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}`;

    const body = document.createElement('div');
    body.className = 'toast-message';
    body.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.textContent = '×';

    content.appendChild(title);
    content.appendChild(body);
    toast.appendChild(content);
    toast.appendChild(closeButton);

    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    closeButton.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
  }

  navigateToFeature(feature) {
    const featureMap = {
      'social-trading': 'social-trading/index.html',
      'yield-aggregator': 'yield-aggregator/index.html',
      'nft-integration': 'nft-integration/index.html',
      analytics: 'analytics/index.html',
      dashboard: 'dashboard-enhanced.html',
      home: 'index.html',
    };

    const path = featureMap[feature];
    if (path) {
      window.location.href = path;
    }
  }

  shareToSocialTrading(signal) {
    sessionStorage.setItem('sharedSignal', JSON.stringify(signal));
    this.navigateToFeature('social-trading');
  }

  getSharedData(key) {
    return JSON.parse(sessionStorage.getItem(key) || 'null');
  }

  setSharedData(key, data) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aetheronPlatform = new AetheronPlatform();
});

if (typeof window.connectWallet !== 'function') {
  window.connectWallet = function () {
    if (window.aetheronPlatform && typeof window.aetheronPlatform.connectWallet === 'function') {
      window.aetheronPlatform.connectWallet();
    }
  };
}

if (typeof window.disconnectWallet !== 'function') {
  window.disconnectWallet = function () {
    if (window.aetheronPlatform && typeof window.aetheronPlatform.disconnectWallet === 'function') {
      window.aetheronPlatform.disconnectWallet();
    }
  };
}

if (typeof window.addTokenToWallet !== 'function') {
  window.addTokenToWallet = async function () {
    if (window.aetheronPlatform && typeof window.aetheronPlatform.showToast === 'function') {
      window.aetheronPlatform.showToast('Token added to wallet!', 'success');
    }
  };
}
