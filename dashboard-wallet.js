// dashboard-wallet.js
// WalletConnect and DEX aggregator integration for Aetheron Platform

// Assumes ethers.js and @walletconnect/web3-provider are loaded globally

let walletProvider = null;
let walletType = null;
let walletAccount = null;

// WalletConnect provider instance
let wcProvider = null;

// 1inch aggregator API endpoint (Polygon)
const AGGREGATOR_API = 'https://api.1inch.io/v5.0/137';

// UI Elements
const walletConnectBtn = document.getElementById('walletConnectBtn');
const connectBtn = document.getElementById('connectBtn');
const walletStatusText = document.getElementById('walletStatusText');
const walletStatusIcon = document.getElementById('walletStatusIcon');
const walletTypeEl = document.getElementById('walletType');
const walletInfo = document.getElementById('walletInfo');

// --- Wallet Connectors ---
async function connectMetaMask() {
  if (!window.ethereum) {
    alert('MetaMask not detected.');
    return;
  }
  walletProvider = new ethers.BrowserProvider(window.ethereum);
  walletType = 'MetaMask';
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  walletAccount = accounts[0];
  updateWalletUI();
}

async function connectWalletConnect() {
  if (!window.WalletConnectProvider) {
    alert('WalletConnectProvider not loaded.');
    return;
  }
  wcProvider = new window.WalletConnectProvider.default({
    rpc: { 137: 'https://polygon-rpc.com' },
    chainId: 137,
  });
  await wcProvider.enable();
  walletProvider = new ethers.BrowserProvider(wcProvider);
  walletType = 'WalletConnect';
  const accounts = wcProvider.accounts;
  walletAccount = accounts[0];
  updateWalletUI();
}

function updateWalletUI() {
  if (walletAccount) {
    walletStatusText.textContent = 'Wallet connected';
    walletStatusIcon.textContent = '🟢';
    walletTypeEl.textContent = walletType;
    // Show account in wallet info
    const accountEl = document.getElementById('accountAddress');
    if (accountEl) accountEl.textContent = walletAccount;
  } else {
    walletStatusText.textContent = 'Wallet not connected';
    walletStatusIcon.textContent = '🔴';
    walletTypeEl.textContent = '-';
    if (document.getElementById('accountAddress'))
      document.getElementById('accountAddress').textContent = '-';
  }
}

// --- DEX Aggregator Swap (1inch) ---
async function swapTokens(fromToken, toToken, amount) {
  if (!walletProvider || !walletAccount) {
    alert('Connect a wallet first.');
    return;
  }
  // Get quote
  const url = `${AGGREGATOR_API}/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
  const quote = await fetch(url).then((r) => r.json());
  // Get swap tx data
  const swapUrl = `${AGGREGATOR_API}/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${walletAccount}&slippage=1`;
  const swapData = await fetch(swapUrl).then((r) => r.json());
  // Send tx
  const signer = await walletProvider.getSigner();
  const tx = await signer.sendTransaction({
    to: swapData.tx.to,
    data: swapData.tx.data,
    value: swapData.tx.value || 0,
  });
  alert('Swap submitted! Tx: ' + tx.hash);
}

// --- Event Listeners ---
if (connectBtn) connectBtn.onclick = connectMetaMask;
if (walletConnectBtn) walletConnectBtn.onclick = connectWalletConnect;

// Expose for debugging
window.connectMetaMask = connectMetaMask;
window.connectWalletConnect = connectWalletConnect;
window.swapTokens = swapTokens;
