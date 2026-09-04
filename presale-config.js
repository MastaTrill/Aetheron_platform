window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e",
  presaleContractAddress: "0xe0A3B6368312dFd3E7E76202e673f895f8235A3d",
  replacementPresaleContractAddress: "0xe0A3B6368312dFd3E7E76202e673f895f8235A3d",
  invalidPresaleContractAddress: "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C",
  launchAuthorized: true,
  status: "authorized",
  recorded_status: "public_presale_and_trading_authorized",
  statusMessage: "Public Base presale and trading flags authorized. On-chain tradingEnabled is already true (2026-09-03 audit). Canonical liquidity is not configured yet — do not claim a live liquid market until a verified pool exists.",
  authorization: {
    issue: 219,
    decision: "approved",
    approvedAtUtc: "2026-09-04T05:12:00Z",
    tradingAuthorizedAtUtc: "2026-09-04T05:25:00Z",
    approvedBy: "owner (MastaTrill)",
    scope: "public_presale_purchases_and_trading_flag",
    tradingAuthorized: true,
    liquidityAuthorized: false,
    onChainTradingEnabled: true,
    onChainNote: "docs/LIVE_BASE_STATE_AUDIT_2026-09-03.md records tradingEnabled=true; enableTrading() must not be called again (one-way).",
    residualRisks: [
      "owner and treasury are the same EOA",
      "no canonical DEX pool / router configured on token",
      "liquidity deferred — tradingEnabled does not equal a liquid market",
      "token tax/DEX interaction design caveats in live audit"
    ]
  },
  expectedOwner: "0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2",
  expectedTreasury: "0x15b9F8ecedafD69Eb1dD93E51fE522690Bf6B7C2",
  publicRpcUrl: "https://mainnet.base.org",
  publicRpcUrls: ["https://base-rpc.publicnode.com", "https://mainnet.base.org"],
  rpcTimeoutMs: 8000,
  maxPresaleTokens: 33333333,
  network: "base",
  chainId: 8453,
  nativeSymbol: "ETH",
  minContribution: 0.0003,
  maxContribution: 33.333333
};
window.addEventListener('load', () => {
  if (document.querySelector('script[data-presale-wallet-provider]')) return;
  const script = document.createElement('script');
  script.src = 'presale-wallet-provider.js?v=1.1.0';
  script.dataset.presaleWalletProvider = 'true';
  document.body.appendChild(script);
});
