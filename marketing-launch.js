// marketing-launch.js
// Public presale funding authorized 2026-09-04 (#219).
// Trading and canonical liquidity remain disabled until separate on-chain actions.
(function () {
  const status = Object.freeze({
    network: 'Base Mainnet',
    chainId: 8453,
    token: '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e',
    launchAuthorized: true,
    publicFundingAuthorized: true,
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
      if (!status.publicFundingAuthorized) {
        console.warn('Aetheron public funding is not authorized.');
        return false;
      }
      return true;
    }
  }

  window.AetheronMarketingStatus = status;
  window.MarketingLauncher = MarketingLauncher;
})();
