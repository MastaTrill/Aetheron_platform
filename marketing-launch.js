// marketing-launch.js
// Public presale + trading flag authorized 2026-09-04.
// Canonical liquidity remains disabled until a verified Base pool exists.
(function () {
  const status = Object.freeze({
    network: 'Base Mainnet',
    chainId: 8453,
    token: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
    launchAuthorized: true,
    publicFundingAuthorized: true,
    tradingAuthorized: true,
    onChainTradingEnabled: true,
    canonicalLiquidityAuthorized: false,
    statusUrl: 'presale.html',
  });

  class MarketingLauncher {
    constructor() {
      this.status = status;
    }

    init() {
      return status;
    }

    launchCampaign() {
      return status.publicFundingAuthorized === true;
    }
  }

  window.AetheronMarketingStatus = status;
  window.MarketingLauncher = MarketingLauncher;
})();
