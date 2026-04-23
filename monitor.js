// monitor.js - Platform monitoring, live trading banner, and market analytics
class AetheronMonitor {
  constructor() {
    this.contracts = {
      AETH: '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
      STAKING: '0x896D9d37A67B0bBf81dde0005975DA7850FFa638',
      PAIR: '0xd57c5E33ebDC1b565F99d06809debbf86142705D'
    };
    this.links = {
      trade: 'https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
      pair: 'https://dexscreener.com/polygon/0xd57c5E33ebDC1b565F99d06809debbf86142705D',
      analytics: 'analytics-dashboard.html',
      token: 'https://polygonscan.com/token/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e'
    };
    this.metrics = {
      pageViews: 0,
      walletConnections: 0,
      transactions: 0,
      stakingActivity: 0,
      errors: 0,
      holderEstimate: 0,
      liquidityUsd: 0,
      volume24h: 0,
      priceUsd: 0
    };
    this.marketSnapshot = null;
    this.marketPollIntervalMs = 60000;
    this.minimumLiveLiquidityUsd = 100;
    this.init();
  }

  init() {
    this.injectBannerStyles();
    this.trackPageViews();
    this.monitorWalletConnections();
    this.monitorContractActivity();
    this.setupErrorTracking();
    this.setupLiveTradingBanner();
    this.startMarketWatcher();
    this.sendMetrics();
  }

  injectBannerStyles() {
    if (document.getElementById('aetheron-live-banner-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'aetheron-live-banner-styles';
    style.textContent = `
      .aetheron-live-banner {
        display: grid;
        grid-template-columns: 1.2fr 2fr auto;
        gap: 16px;
        align-items: center;
        margin: 16px auto 20px;
        padding: 16px 18px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.12);
        background: linear-gradient(135deg, rgba(17,24,39,0.92), rgba(76,29,149,0.72));
        box-shadow: 0 20px 45px rgba(0,0,0,0.28);
        color: #fff;
      }
      .aetheron-live-banner.is-live {
        border-color: rgba(34,197,94,0.45);
        box-shadow: 0 20px 45px rgba(34,197,94,0.16);
      }
      .aetheron-live-banner__status {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .aetheron-live-banner__eyebrow {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: rgba(255,255,255,0.7);
      }
      .aetheron-live-banner__headline {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.15rem;
        font-weight: 700;
      }
      .aetheron-live-banner__dot {
        width: 11px;
        height: 11px;
        border-radius: 999px;
        background: #f59e0b;
        box-shadow: 0 0 0 0 rgba(245,158,11,0.6);
        animation: aetheronPulse 1.8s infinite;
      }
      .aetheron-live-banner.is-live .aetheron-live-banner__dot {
        background: #22c55e;
        box-shadow: 0 0 0 0 rgba(34,197,94,0.5);
      }
      .aetheron-live-banner__meta {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }
      .aetheron-live-banner__metric {
        background: rgba(255,255,255,0.08);
        border-radius: 14px;
        padding: 10px 12px;
      }
      .aetheron-live-banner__metric-label {
        font-size: 0.72rem;
        color: rgba(255,255,255,0.68);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
      }
      .aetheron-live-banner__metric-value {
        font-size: 0.98rem;
        font-weight: 700;
      }
      .aetheron-live-banner__actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .aetheron-live-banner__button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        text-decoration: none;
        color: #fff;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.08);
        font-weight: 600;
      }
      .aetheron-live-banner__button--primary {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border-color: rgba(34,197,94,0.35);
      }
      @keyframes aetheronPulse {
        0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
        70% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
      }
      @media (max-width: 960px) {
        .aetheron-live-banner {
          grid-template-columns: 1fr;
        }
        .aetheron-live-banner__meta {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .aetheron-live-banner__actions {
          justify-content: flex-start;
        }
      }
      @media (max-width: 640px) {
        .aetheron-live-banner__meta {
          grid-template-columns: 1fr 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupLiveTradingBanner() {
    const mainContent = document.querySelector('#main-content .container') || document.querySelector('main .container') || document.body;
    if (!mainContent || document.getElementById('aetheronLiveTradingBanner')) {
      return;
    }

    const banner = document.createElement('section');
    banner.id = 'aetheronLiveTradingBanner';
    banner.className = 'aetheron-live-banner';
    banner.innerHTML = `
      <div class="aetheron-live-banner__status">
        <div class="aetheron-live-banner__eyebrow">Market Status</div>
        <div class="aetheron-live-banner__headline">
          <span class="aetheron-live-banner__dot" aria-hidden="true"></span>
          <span id="aetheronLiveHeadline">Preparing live trading...</span>
        </div>
        <div id="aetheronLiveSubhead" class="aetheron-live-banner__eyebrow">Waiting for live liquidity signal from DexScreener.</div>
      </div>
      <div class="aetheron-live-banner__meta">
        <div class="aetheron-live-banner__metric">
          <div class="aetheron-live-banner__metric-label">Price</div>
          <div class="aetheron-live-banner__metric-value" id="aetheronBannerPrice">--</div>
        </div>
        <div class="aetheron-live-banner__metric">
          <div class="aetheron-live-banner__metric-label">Liquidity</div>
          <div class="aetheron-live-banner__metric-value" id="aetheronBannerLiquidity">--</div>
        </div>
        <div class="aetheron-live-banner__metric">
          <div class="aetheron-live-banner__metric-label">24h Volume</div>
          <div class="aetheron-live-banner__metric-value" id="aetheronBannerVolume">--</div>
        </div>
        <div class="aetheron-live-banner__metric">
          <div class="aetheron-live-banner__metric-label">Holders</div>
          <div class="aetheron-live-banner__metric-value" id="aetheronBannerHolders">--</div>
        </div>
      </div>
      <div class="aetheron-live-banner__actions">
        <a class="aetheron-live-banner__button aetheron-live-banner__button--primary" href="${this.links.trade}" target="_blank" rel="noopener noreferrer">Trade AETH</a>
        <a class="aetheron-live-banner__button" href="${this.links.pair}" target="_blank" rel="noopener noreferrer">DexScreener</a>
        <a class="aetheron-live-banner__button" href="${this.links.analytics}">Analytics</a>
      </div>
    `;

    const insertionTarget = mainContent.firstElementChild;
    if (insertionTarget) {
      mainContent.insertBefore(banner, insertionTarget.nextSibling || insertionTarget);
    } else {
      mainContent.prepend(banner);
    }
  }

  async startMarketWatcher() {
    await this.refreshMarketSnapshot();
    setInterval(() => this.refreshMarketSnapshot(), this.marketPollIntervalMs);
  }

  async refreshMarketSnapshot() {
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/pairs/polygon/${this.contracts.PAIR}`);
      if (!response.ok) {
        throw new Error(`DexScreener returned ${response.status}`);
      }

      const payload = await response.json();
      const pair = payload?.pair;
      if (!pair) {
        throw new Error('Pair data not available yet');
      }

      const priceUsd = Number(pair.priceUsd || 0);
      const liquidityUsd = Number(pair.liquidity?.usd || 0);
      const volume24h = Number(pair.volume?.h24 || 0);
      const buys24h = Number(pair.txns?.h24?.buys || 0);
      const sells24h = Number(pair.txns?.h24?.sells || 0);
      const priceChange24h = Number(pair.priceChange?.h24 || 0);
      const fdv = Number(pair.fdv || 0);
      const holderEstimate = Math.max(1, Math.round(liquidityUsd > 0 ? liquidityUsd / 100 : 1));
      const isLive = liquidityUsd >= this.minimumLiveLiquidityUsd;

      this.marketSnapshot = {
        priceUsd,
        liquidityUsd,
        volume24h,
        buys24h,
        sells24h,
        fdv,
        priceChange24h,
        holderEstimate,
        isLive,
        updatedAt: new Date().toISOString()
      };

      this.metrics.priceUsd = priceUsd;
      this.metrics.liquidityUsd = liquidityUsd;
      this.metrics.volume24h = volume24h;
      this.metrics.holderEstimate = holderEstimate;

      this.updateBanner();
      this.broadcastMarketSnapshot();
      this.updateExistingMarketNodes();
    } catch (error) {
      console.error('Market watcher error:', error);
      this.updateBannerError(error.message);
    }
  }

  updateBanner() {
    const banner = document.getElementById('aetheronLiveTradingBanner');
    if (!banner || !this.marketSnapshot) {
      return;
    }

    banner.classList.toggle('is-live', this.marketSnapshot.isLive);
    const headline = document.getElementById('aetheronLiveHeadline');
    const subhead = document.getElementById('aetheronLiveSubhead');
    const price = document.getElementById('aetheronBannerPrice');
    const liquidity = document.getElementById('aetheronBannerLiquidity');
    const volume = document.getElementById('aetheronBannerVolume');
    const holders = document.getElementById('aetheronBannerHolders');

    if (headline) {
      headline.textContent = this.marketSnapshot.isLive ? 'LIVE TRADING ACTIVE' : 'Liquidity warming up';
    }
    if (subhead) {
      subhead.textContent = this.marketSnapshot.isLive
        ? `Price ${this.formatUsd(this.marketSnapshot.priceUsd)} · ${this.marketSnapshot.priceChange24h >= 0 ? '+' : ''}${this.marketSnapshot.priceChange24h.toFixed(2)}% in 24h`
        : 'Trade links are ready. Banner switches to live once market liquidity clears the launch threshold.';
    }
    if (price) price.textContent = this.formatUsd(this.marketSnapshot.priceUsd, true);
    if (liquidity) liquidity.textContent = this.compactUsd(this.marketSnapshot.liquidityUsd);
    if (volume) volume.textContent = this.compactUsd(this.marketSnapshot.volume24h);
    if (holders) holders.textContent = `${this.marketSnapshot.holderEstimate}+`;
  }

  updateBannerError(message) {
    const headline = document.getElementById('aetheronLiveHeadline');
    const subhead = document.getElementById('aetheronLiveSubhead');
    if (headline) headline.textContent = 'Market signal unavailable';
    if (subhead) subhead.textContent = message || 'Unable to reach DexScreener right now.';
  }

  updateExistingMarketNodes() {
    if (!this.marketSnapshot) {
      return;
    }

    const holdersNodes = [document.getElementById('holdersValue'), document.getElementById('liveHoldersCount')].filter(Boolean);
    holdersNodes.forEach((node) => {
      node.textContent = `${this.marketSnapshot.holderEstimate}+`;
    });

    const holdersChange = document.getElementById('holdersChange');
    if (holdersChange) {
      holdersChange.textContent = this.marketSnapshot.isLive ? 'Live market detected' : 'Awaiting live liquidity';
    }
  }

  broadcastMarketSnapshot() {
    window.dispatchEvent(new CustomEvent('aetheron:market-data', { detail: this.marketSnapshot }));
  }

  compactUsd(value) {
    if (!Number.isFinite(value) || value <= 0) {
      return '$0';
    }
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  formatUsd(value, smallAllowed = false) {
    if (!Number.isFinite(value) || value <= 0) {
      return '$0.00';
    }
    if (smallAllowed && value < 0.01) {
      return `$${value.toFixed(8)}`;
    }
    return `$${value.toFixed(4)}`;
  }

  trackPageViews() {
    this.metrics.pageViews += 1;
    console.log('Page view tracked');

    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      this.trackEvent('time_spent', { seconds: timeSpent });
    });
  }

  monitorWalletConnections() {
    window.addEventListener('ethereum#initialized', () => {
      this.metrics.walletConnections += 1;
      this.trackEvent('wallet_connected');
    });

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
      if (window.ethers && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const aethContract = new ethers.Contract(
          this.contracts.AETH,
          ['event Transfer(address indexed from, address indexed to, uint256 value)'],
          provider
        );

        aethContract.on('Transfer', (from, to, value) => {
          this.metrics.transactions += 1;
          this.trackEvent('aeth_transfer', {
            from,
            to,
            value: ethers.utils ? ethers.utils.formatEther(value) : String(value)
          });
        });

        const stakingContract = new ethers.Contract(
          this.contracts.STAKING,
          ['event Staked(address indexed user, uint256 poolId, uint256 amount)'],
          provider
        );

        stakingContract.on('Staked', (user, poolId, amount) => {
          this.metrics.stakingActivity += 1;
          this.trackEvent('staking_deposit', {
            user,
            poolId: poolId.toString(),
            amount: ethers.utils ? ethers.utils.formatEther(amount) : String(amount)
          });
        });
      }
    } catch (error) {
      console.error('Contract monitoring error:', error);
    }
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.metrics.errors += 1;
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors += 1;
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

    console.log('Event tracked:', eventData);
    this.sendToAnalytics(eventData);
  }

  sendToAnalytics(data) {
    try {
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
    setInterval(() => {
      this.trackEvent('platform_metrics', { ...this.metrics, market: this.marketSnapshot || null });
    }, 5 * 60 * 1000);
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.aetheronMonitor = new AetheronMonitor();
});