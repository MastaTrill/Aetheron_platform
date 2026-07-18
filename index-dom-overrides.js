import { renderWalletStatus, renderTransactions, createIndexWalletChooserModal, renderUserStakes } from './index-safe-renderers.js';

const TOKEN = '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const PRESALE = '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const BASESCAN_TOKEN = `https://basescan.org/token/${TOKEN}`;

window.POLYGON_RPC_URLS = ['https://mainnet.base.org', 'https://base.drpc.org', 'https://rpc.ankr.com/base'];

function replaceText(root, replacements) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    let value = node.nodeValue;
    replacements.forEach(([from, to]) => { value = value.split(from).join(to); });
    node.nodeValue = value;
  });
}

function reconcilePublicHomepage() {
  replaceText(document.body, [
    ['0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e', TOKEN],
    ['0xAb5a...9671e', '0xecf7...8E4e'],
    ['Polygon Mainnet', 'Base Mainnet'],
    ['PolygonScan', 'BaseScan'],
    ['MATIC', 'ETH'],
    ['QuickSwap', 'verified presale'],
    ['1 ETH = 1000 AETH', '1 ETH = 1,000,000 AETH'],
    ['Minimum: 0.001 ETH', 'Minimum: 0.0003 ETH'],
    ['100+ Holders', 'Verified on Base'],
    ['Polygon DeFi Command', 'Base DeFi Command']
  ]);

  document.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (/quickswap|polygonscan|dexscreener\.com\/polygon/i.test(href)) {
      link.href = link.textContent.includes('BaseScan') ? BASESCAN_TOKEN : 'presale.html';
      if (link.href.endsWith('presale.html')) link.removeAttribute('target');
    }
  });

  const copy = document.getElementById('copyContractBtn');
  if (copy) copy.dataset.contract = TOKEN;
  document.querySelectorAll('.contract-address-info').forEach((node) => { node.textContent = TOKEN; });

  const heroBadges = [...document.querySelectorAll('.hero-badge, .badge, .status-badge')];
  heroBadges.forEach((badge) => {
    if (/holders/i.test(badge.textContent)) badge.textContent = '● Verified on Base';
  });

  const faqAnswers = document.querySelectorAll('.faq-answer');
  if (faqAnswers[0]) faqAnswers[0].innerHTML = `<p>To buy AETH:</p><ol><li>Open the verified <a class="primary-link" href="presale.html">Base presale</a>.</li><li>Connect MetaMask or Coinbase Wallet.</li><li>Switch to Base Mainnet and enter at least 0.0003 ETH.</li><li>Review the quote and confirm the transaction in your wallet.</li></ol>`;
  if (faqAnswers[1]) faqAnswers[1].innerHTML = '<p>Public staking is not being advertised as active yet. The calculator is for planning only until a Base staking contract and final reward schedule are published.</p>';
  if (faqAnswers[2]) faqAnswers[2].innerHTML = '<p>The presale purchase uses ETH on Base Mainnet plus the wallet’s network gas fee. The page shows the token quote before confirmation. No exchange-liquidity or trading claim is made during the presale phase.</p>';
  if (faqAnswers[3]) faqAnswers[3].innerHTML = `<p>The live presale and AETH token source code are verified on BaseScan. Contract verification is not the same as an independent security audit; buyers should review the verified code and transaction details.</p><p><a class="primary-link" target="_blank" rel="noopener noreferrer" href="https://basescan.org/address/${PRESALE}#code">View verified presale</a></p>`;
  if (faqAnswers[4]) faqAnswers[4].innerHTML = '<p>This question applies only after a Base staking program is publicly activated. No active staking deposit is promoted on this page today.</p>';
  if (faqAnswers[5]) faqAnswers[5].innerHTML = `<p>Click “Add to MetaMask,” or add the token manually:</p><ul><li><strong>Network:</strong> Base Mainnet</li><li><strong>Contract:</strong> ${TOKEN}</li><li><strong>Symbol:</strong> AETH</li><li><strong>Decimals:</strong> 18</li></ul>`;

  window.calcPresaleTokens = function () {
    const input = document.getElementById('presaleMaticInput');
    const output = document.getElementById('presaleTokenOutput');
    if (input && output) output.value = `${((Number(input.value) || 0) * 1000000).toLocaleString()} AETH`;
  };

  const style = document.createElement('style');
  style.textContent = `
    .hero-grid,.feature-grid,.dashboard-grid{align-items:stretch}
    .feature-card,.card,.command-deck{overflow:hidden;min-width:0}
    .contract-address,.contract-address-info{overflow-wrap:anywhere}
    input,select,button,.btn{min-height:44px}
    @media(max-width:900px){.hero-grid,.dashboard-grid{grid-template-columns:1fr!important}.hero-title{font-size:clamp(3rem,12vw,5.4rem)!important;line-height:.95}.contract-display{max-width:100%;overflow:hidden}.contract-display span{overflow-wrap:anywhere}}
  `;
  document.head.appendChild(style);
}

function patchSafeRenderers() {
  window.checkWalletStatus = async function () {
    const status = document.getElementById('walletStatus');
    if (!status) return false;
    const wallet = window.resolveInjectedProvider?.() || window.ethereum;
    renderWalletStatus(status, wallet ? 'detected' : 'missing', wallet?.isCoinbaseWallet ? 'Coinbase Wallet' : wallet?.isMetaMask ? 'MetaMask' : 'Browser Wallet');
    return Boolean(wallet);
  };
  window.displayTransactions = function (transactions) {
    const list = document.getElementById('txList');
    if (list) renderTransactions(list, Array.isArray(transactions) ? transactions : []);
  };
  window.ensureWalletChooser = function () {
    let modal = document.getElementById('walletChooserModal');
    if (!modal) { modal = createIndexWalletChooserModal(); document.body.appendChild(modal); }
    return modal;
  };
  window.displayUserStakes = function (stakes) {
    const list = document.getElementById('userStakesList');
    if (list) renderUserStakes(list, Array.isArray(stakes) ? stakes : []);
  };
  window.showQRCode = function () {
    const modal = document.getElementById('qrModal');
    const container = document.getElementById('qrcode');
    if (!modal || !container || typeof QRCode === 'undefined') return;
    container.replaceChildren();
    new QRCode(container, { text: TOKEN, width: 256, height: 256, correctLevel: QRCode.CorrectLevel.H });
    modal.style.display = 'block';
  };
}

function init() { patchSafeRenderers(); reconcilePublicHomepage(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
