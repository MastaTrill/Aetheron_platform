// marketing-launch.js
// Launch approval + trading flag recorded 2026-09-04; presale purchases paused because the configured sale window ended.
// Canonical liquidity remains disabled until a verified Base pool exists.
(function () {
  const status = Object.freeze({
    network: 'Base Mainnet',
    chainId: 8453,
    token: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
    launchAuthorized: true,
    publicFundingAuthorized: false,
    presalePurchaseAuthorized: false,
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
      return status.presalePurchaseAuthorized === true;
    }
  }

  window.AetheronMarketingStatus = status;
  window.MarketingLauncher = MarketingLauncher;
})();
