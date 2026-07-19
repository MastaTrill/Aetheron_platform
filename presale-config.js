window.AETHERON_PRESALE_CONFIG = {
  aethTokenAddress: "0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e",
  presaleContractAddress: "0xe0A3B6368312dFd3E7E76202e673f895f8235A3d",
  replacementPresaleContractAddress: "0xe0A3B6368312dFd3E7E76202e673f895f8235A3d",
  invalidPresaleContractAddress: "0xA7aa360d2F00Cf4130B3244D0A13AE32a49ab07C",
  status: "live",
  statusMessage: "The verified Aetheron Base presale is live.",
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
  script.src = 'presale-wallet-provider.js?v=1.0.0';
  script.dataset.presaleWalletProvider = 'true';
  document.body.appendChild(script);
});
