// marketing-launch.js
// Production-safe marketing status shim.
// Public launch promotion remains disabled until the final Base Mainnet
// authorization gate is explicitly satisfied with reproducible evidence.
(function () {
  const status = Object.freeze({
    network: 'Base Mainnet',
    chainId: 8453,
    token: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
    launchAuthorized: false,
    publicFundingAuthorized: false,
    tradingAuthorized: false,
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
      console.warn(
        'Aetheron launch promotion is disabled pending final Base Mainnet authorization.',
      );
      return false;
    }
  }

  window.AetheronMarketingStatus = status;
  window.MarketingLauncher = MarketingLauncher;
})();
