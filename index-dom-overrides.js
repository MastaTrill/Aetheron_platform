import { renderWalletStatus, renderTransactions, createIndexWalletChooserModal, renderUserStakes } from './index-safe-renderers.js';

const CONFIG = window.AETHERON_PRESALE_CONFIG || {};
const TOKEN = CONFIG.tokenAddress || '0xecf7E17faE148C01E1b5008A31Dfd2d1B6608E4e';
const PRESALE = CONFIG.presaleAddress || '0xe0A3B6368312dFd3E7E76202e673f895f8235A3d';
const MINIMUM = CONFIG.minimumPurchaseEth || '0.0003';
const RATE = Number(CONFIG.tokensPerEth || 1000000);
const BASESCAN_TOKEN = `https://basescan.org/token/${TOKEN}`;
const BASESCAN_PRESALE = `https://basescan.org/address/${PRESALE}#code`;

window.POLYGON_RPC_URLS = CONFIG.rpcUrls || ['https://mainnet.base.org', 'https://base.drpc.org', 'https://rpc.ankr.com/base'];

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

function setMeta(selector, content) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute('content', content);
}

function setCardCopy(card, title, description) {
  if (!card) return;
  const heading = card.querySelector('h3');
  const copy = card.querySelector('p');
  if (heading) heading.textContent = title;
  if (copy) copy.textContent = description;
}

function makeButtonLink(button, href) {
  if (!button) return;
  button.removeAttribute('onclick');
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(href);
  }, true);
}

function reconcilePublicHomepage() {
  document.title = 'Aetheron (AETH) | Verified Presale on Base';
  const description = `Explore Aetheron and buy AETH through the verified Base Mainnet presale. Minimum purchase ${MINIMUM} ETH.`;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', 'Aetheron (AETH) | Verified Presale on Base');
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', 'Aetheron (AETH) | Verified Presale on Base');
  setMeta('meta[name="twitter:description"]', description);

  replaceText(document.body, [
    ['0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e', TOKEN],
    ['0xAb5a...9671e', `${TOKEN.slice(0, 8)}...${TOKEN.slice(-4)}`],
    ['Polygon Mainnet', 'Base Mainnet'],
    ['PolygonScan', 'BaseScan'],
    ['Polygon DeFi Command', 'Base DeFi Command'],
    ['MATIC', 'ETH'],
    ['QuickSwap', 'Base presale'],
    ['1 ETH = 1000 AETH', `1 ETH = ${RATE.toLocaleString()} AETH`],
    ['Min 0.001 ETH', `Min ${MINIMUM} ETH`],
    ['Minimum: 0.001 ETH', `Minimum: ${MINIMUM} ETH`],
    ['100+ Holders', 'Verified on Base'],
    ['futuristic staking, analytics', 'verified presale access, analytics'],
    ['staking, analytics, and live ecosystem tracking', 'presale access, analytics, and ecosystem tracking'],
    ['trading opportunities', 'presale and platform notices']
  ]);

  document.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (/quickswap|dexscreener\.com\/polygon/i.test(href)) {
      link.href = 'presale.html';
      link.removeAttribute('target');
    } else if (/polygonscan/i.test(href)) {
      link.href = BASESCAN_TOKEN;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  const oldStakingNav = [...document.querySelectorAll('a.nav-link')].find((link) => link.getAttribute('href') === '#staking');
  if (oldStakingNav) {
    oldStakingNav.href = 'presale.html';
    oldStakingNav.textContent = 'Presale';
  }

  const copy = document.getElementById('copyContractBtn');
  if (copy) copy.dataset.contract = TOKEN;
  const copyText = document.getElementById('copyBtnText');
  if (copyText) copyText.textContent = TOKEN;
  document.querySelectorAll('.contract-address, .contract-address-info').forEach((node) => { node.textContent = TOKEN; });

  const holderCount = document.getElementById('liveHoldersCount');
  if (holderCount) {
    holderCount.textContent = 'Verified';
    const container = holderCount.parentElement;
    if (container) container.lastChild.textContent = ' on Base';
  }

  const presaleInput = document.getElementById('presaleMaticInput');
  if (presaleInput) {
    presaleInput.min = MINIMUM;
    presaleInput.step = '0.0001';
    presaleInput.placeholder = `Min ${MINIMUM} ETH`;
    presaleInput.setAttribute('aria-describedby', 'presaleRate');
  }
  const rate = document.getElementById('presaleRate');
  if (rate) rate.textContent = `(1 ETH = ${RATE.toLocaleString()} AETH)`;
  makeButtonLink(document.getElementById('presaleBuyBtn'), 'presale.html');
  makeButtonLink(document.getElementById('viewOnScanBtn'), BASESCAN_TOKEN);

  window.calcPresaleTokens = function () {
    const input = document.getElementById('presaleMaticInput');
    const output = document.getElementById('presaleTokenOutput');
    if (!input || !output) return;
    const amount = Number(input.value) || 0;
    output.value = `${(amount * RATE).toLocaleString(undefined, { maximumFractionDigits: 2 })} AETH`;
  };
  window.connectWalletForPresale = () => window.location.assign('presale.html');

  document.querySelectorAll('.hero-panel-card').forEach((card) => {
    const label = card.querySelector('.hero-panel-label');
    const value = card.querySelector('.hero-panel-value');
    if (!label || !value) return;
    if (label.textContent.trim() === 'Network') value.textContent = 'Base Mainnet';
    if (label.textContent.trim() === 'Max APY') { label.textContent = 'Sale Status'; value.textContent = 'Verified'; }
    if (label.textContent.trim() === 'Contract') value.textContent = `${PRESALE.slice(0, 8)}...${PRESALE.slice(-4)}`;
    if (label.textContent.trim() === 'Utility') value.textContent = 'Buy, verify, track, and explore on Base';
  });

  document.querySelectorAll('a.feature-card[href="presale.html"]').forEach((card) => {
    setCardCopy(card, 'AETH Base Presale', `Buy AETH through the verified Base Mainnet presale. Minimum ${MINIMUM} ETH.`);
  });
  document.querySelectorAll('a.feature-card[href="#staking"]').forEach((card) => {
    card.href = 'staking-calculator.html';
    setCardCopy(card, 'Staking Planner', 'Model potential scenarios while the public Base staking program remains in planning.');
  });
  setCardCopy(document.querySelector('a.feature-card[href="social-trading/index.html"]'), 'Social Trading Roadmap', 'Preview the planned community trading and signal-sharing experience.');
  setCardCopy(document.querySelector('a.feature-card[href="yield-aggregator/index.html"]'), 'Yield Tools Roadmap', 'Explore the planned Base yield research and comparison toolkit.');
  setCardCopy(document.querySelector('a.feature-card[href="nft-integration/index.html"]'), 'NFT Integration Roadmap', 'Preview planned NFT utility and ecosystem integrations.');

  const priceCard = document.getElementById('priceValue')?.closest('.stat-card');
  if (priceCard) {
    const label = priceCard.querySelector('.label');
    if (label) label.textContent = 'Presale Rate';
  }
  const factualStats = () => {
    const value = document.getElementById('priceValue');
    if (value && value.textContent !== '1M AETH / ETH') value.textContent = '1M AETH / ETH';
    const change = document.getElementById('priceChange');
    if (change) change.innerHTML = '<i class="fas fa-shield-check"></i> <span>Verified Base sale</span>';
  };
  factualStats();
  const statObserver = new MutationObserver(factualStats);
  const priceValue = document.getElementById('priceValue');
  if (priceValue) statObserver.observe(priceValue, { childList: true, characterData: true, subtree: true });

  const tradeLink = document.querySelector('.price-action-row a');
  if (tradeLink) {
    tradeLink.href = 'presale.html';
    tradeLink.removeAttribute('target');
    const title = tradeLink.querySelector('.fw-600');
    const subtitle = tradeLink.querySelector('.text-sm');
    if (title) title.textContent = 'Buy AETH';
    if (subtitle) subtitle.textContent = 'Verified Base Presale';
  }

  const calculatorTitle = [...document.querySelectorAll('.card-title')].find((node) => node.textContent.trim() === 'Rewards Calculator');
  if (calculatorTitle) calculatorTitle.textContent = 'Rewards Planner';
  const calcLabel = document.querySelector('label[for="calcAmount"]');
  if (calcLabel) calcLabel.textContent = 'Illustrative AETH amount';
  const calcButton = document.getElementById('calcBtn');
  if (calcButton) calcButton.innerHTML = '<i class="fas fa-calculator"></i> Estimate Scenario';

  const faqAnswers = document.querySelectorAll('.faq-answer');
  if (faqAnswers[0]) faqAnswers[0].innerHTML = `<p>To buy AETH:</p><ol><li>Open the verified <a class="primary-link" href="presale.html">Base presale</a>.</li><li>Connect MetaMask or Coinbase Wallet.</li><li>Switch to Base Mainnet and enter at least ${MINIMUM} ETH.</li><li>Review the quote and confirm the transaction in your wallet.</li></ol>`;
  if (faqAnswers[1]) faqAnswers[1].innerHTML = '<p>Public staking is not advertised as active yet. The calculator is a planning tool until a verified Base staking contract and final reward schedule are published.</p>';
  if (faqAnswers[2]) faqAnswers[2].innerHTML = '<p>The presale purchase uses ETH on Base Mainnet plus the wallet network fee. The presale page shows the AETH quote before confirmation. No exchange-liquidity or secondary-market claim is made during this phase.</p>';
  if (faqAnswers[3]) faqAnswers[3].innerHTML = `<p>The presale and AETH token source code are verified on BaseScan. Source verification is not the same as an independent security audit; review the verified code and transaction details before purchasing.</p><p><a class="primary-link" target="_blank" rel="noopener noreferrer" href="${BASESCAN_PRESALE}">View verified presale contract</a></p>`;
  if (faqAnswers[4]) faqAnswers[4].innerHTML = '<p>This applies only after a Base staking program is publicly activated. No active staking deposit is promoted on this page today.</p>';
  if (faqAnswers[5]) faqAnswers[5].innerHTML = `<p>Click “Add to MetaMask,” or add the token manually:</p><ul><li><strong>Network:</strong> Base Mainnet</li><li><strong>Contract:</strong> ${TOKEN}</li><li><strong>Symbol:</strong> AETH</li><li><strong>Decimals:</strong> 18</li></ul>`;
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

function init() {
  patchSafeRenderers();
  reconcilePublicHomepage();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
