// dashboard-wallet.js
// WalletConnect and DEX aggregator integration for Aetheron Platform

// Assumes ethers.js is loaded globally. WalletConnect v2 is provided by the
// official @walletconnect/ethereum-provider UMD script when a project ID is configured.

let walletProvider = null;
let walletType = null;
let walletAccount = null;

// WalletConnect provider instance
let wcProvider = null;
let walletBindingsInitialized = false;

// 1inch aggregator API endpoint (Polygon)
// Legacy Polygon swap functionality is quarantined from the Base wallet experience.
const AGGREGATOR_API = null;

// UI Elements
const walletConnectBtn = document.getElementById('walletConnectBtn');
const connectBtn = document.getElementById('connectBtn');
const walletStatusText = document.getElementById('walletStatusText');
const walletStatusIcon = document.getElementById('walletStatusIcon');
const walletTypeEl = document.getElementById('walletType');

function dispatchWalletEvent(name, detail = {}) {
  window.dispatchEvent(
    new CustomEvent(name, {
      detail,
    }),
  );
}

function syncLegacyDashboard(accountAddress = null) {
  if (!window.dashboard) {
    return;
  }

  window.dashboard.walletAccount = accountAddress || null;
}

function createInjectedProvider(injectedProvider) {
  if (ethers && typeof ethers.BrowserProvider === 'function') {
    return new ethers.BrowserProvider(injectedProvider);
  }

  if (ethers && ethers.providers && ethers.providers.Web3Provider) {
    return new ethers.providers.Web3Provider(injectedProvider);
  }

  throw new Error('Compatible ethers provider API not found.');
}

function getWalletConnectProjectId() {
  const metaProjectId = document
    .querySelector('meta[name="walletconnect-project-id"]')
    ?.getAttribute('content')
    ?.trim();
  const runtimeProjectId =
    typeof window.AETHERON_WALLETCONNECT_PROJECT_ID === 'string'
      ? window.AETHERON_WALLETCONNECT_PROJECT_ID.trim()
      : '';

  return runtimeProjectId || metaProjectId || '';
}

function showWalletMessage(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, { type });
    return;
  }

  alert(message);
}

function getWalletConnectEthereumProvider() {
  const walletConnectPackage = window['@walletconnect/ethereum-provider'];

  if (walletConnectPackage?.EthereumProvider?.init) {
    return walletConnectPackage.EthereumProvider;
  }

  if (walletConnectPackage?.default?.init) {
    return walletConnectPackage.default;
  }

  return null;
}

function getWalletConnectMetadata() {
  const currentHref =
    window.location?.href || 'https://aetrs.com/dashboard.html';
  const currentOrigin =
    window.location?.origin || 'https://mastatrill.github.io';

  return {
    description: 'Aetheron Platform Dashboard',
    icons: [new URL('apple-touch-icon.png', currentHref).href],
    name: 'Aetheron Platform',
    url: currentOrigin,
  };
}

async function getWalletConnectProvider() {
  if (wcProvider) {
    return wcProvider;
  }

  const projectId = getWalletConnectProjectId();
  const EthereumProvider = getWalletConnectEthereumProvider();

  if (!projectId || !EthereumProvider) {
    return null;
  }

  wcProvider = await EthereumProvider.init({
    events: ['chainChanged', 'accountsChanged'],
    methods: [
      'eth_requestAccounts',
      'eth_accounts',
      'eth_chainId',
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
    ],
    metadata: getWalletConnectMetadata(),
    optionalChains: [8453],
    projectId,
    rpcMap: {
      8453: `https://rpc.walletconnect.com?chainId=eip155:8453&projectId=${projectId}`,
    },
    showQrModal: true,
  });

  const handleDisconnect = () => {
    wcProvider = null;
    setWalletState(null, null, null);
    syncLegacyDashboard(null);
    dispatchWalletEvent('aetheron:wallet-disconnected');
  };

  wcProvider.on?.('disconnect', handleDisconnect);
  wcProvider.on?.('session_delete', handleDisconnect);

  return wcProvider;
}

function setWalletState(nextAccount, nextType, nextProvider) {
  walletAccount = nextAccount || null;
  walletType = nextType || null;
  walletProvider = nextProvider || null;
  updateWalletUI();
}

// --- Wallet Connectors ---
async function connectMetaMask() {
  if (
    typeof window.connectWallet === 'function' &&
    window.connectWallet !== connectMetaMask
  ) {
    return window.connectWallet({
      auto: false,
      walletType: 'metamask',
    });
  }

  if (!window.ethereum) {
    alert('MetaMask not detected.');
    return;
  }

  walletProvider = createInjectedProvider(window.ethereum);
  walletType = 'MetaMask';
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  if (String(chainId).toLowerCase() !== '0x2105' || !accounts?.[0]) {
    setWalletState(null, null, null);
    syncLegacyDashboard(null);
    showWalletMessage('Switch to Base Mainnet (8453) and reconnect before using wallet features.', 'warning');
    return { connected: false, reason: 'wallet_not_on_base' };
  }
  setWalletState(accounts[0], walletType, walletProvider);
  syncLegacyDashboard(walletAccount);
  dispatchWalletEvent('aetheron:wallet-connected', {
    account: walletAccount,
    walletType,
  });
  return { connected: true, account: walletAccount, chainId: '0x2105' };
}

async function connectWalletConnect(options = {}) {
  if (!getWalletConnectProjectId()) {
    const message =
      'WalletConnect QR is not configured on this deployment yet. Use MetaMask or Coinbase Wallet instead.';

    if (
      typeof window.connectWallet === 'function' &&
      window.ethereum
    ) {
      showWalletMessage(`${message} Opening your browser wallet now.`, 'warning');
      return window.connectWallet({
        auto: Boolean(options.auto),
        walletType: 'browser',
      });
    }

    showWalletMessage(message, 'warning');
    return null;
  }

  let connectedProvider = null;
  try {
    connectedProvider = await getWalletConnectProvider();

    if (!connectedProvider) {
      throw new Error('WalletConnect v2 provider is not available.');
    }

    const hasExistingSession =
      Boolean(connectedProvider.session) &&
      Array.isArray(connectedProvider.accounts) &&
      connectedProvider.accounts.length > 0;

    if (!hasExistingSession || !Boolean(options.auto)) {
      await connectedProvider.connect();
    }
  } catch (error) {
    const message =
      'WalletConnect failed to start. Please try again or use MetaMask/Coinbase Wallet.';
    showWalletMessage(message, 'error');
    throw error;
  }

  wcProvider = connectedProvider;
  const connectedAccount =
    connectedProvider?.accounts?.[0] ||
    null;

  if (wcProvider && connectedAccount) {
    wcProvider.accounts = [connectedAccount];
  }

  if (typeof window.connectWallet === 'function') {
    const result = await window.connectWallet({
      auto: Boolean(options.auto) || Boolean(connectedAccount),
      walletType: 'walletconnect',
      provider: wcProvider,
    });

    // The canonical connector is authoritative. Never infer success from
    // cached accounts or WalletConnect session metadata after a 4001 rejection.
    if (result?.connected !== true || !result.account || result.chainId !== '0x2105') {
      setWalletState(null, null, null);
      syncLegacyDashboard(null);
      return { connected: false, reason: result?.reason || 'connection_unverified' };
    }
    setWalletState(result.account, 'WalletConnect', createInjectedProvider(wcProvider));
    syncLegacyDashboard(result.account);
    return result;
  }

  const providerInstance = createInjectedProvider(wcProvider);
  const accounts = wcProvider?.accounts || [];
  const chainId = await wcProvider.request({ method: 'eth_chainId' });
  if (String(chainId).toLowerCase() !== '0x2105' || !accounts[0]) {
    setWalletState(null, null, null);
    syncLegacyDashboard(null);
    showWalletMessage('WalletConnect requires Base Mainnet (8453).', 'warning');
    return { connected: false, reason: 'wallet_not_on_base' };
  }
  setWalletState(accounts[0], 'WalletConnect', providerInstance);
  syncLegacyDashboard(walletAccount);
  dispatchWalletEvent('aetheron:wallet-connected', {
    account: walletAccount,
    walletType,
  });
}

function updateWalletUI() {
  if (!walletStatusText || !walletStatusIcon || !walletTypeEl) {
    return;
  }

  if (walletAccount) {
    walletStatusText.textContent = 'Wallet connected';
    walletStatusIcon.textContent = 'Connected';
    walletTypeEl.textContent = walletType;
    const accountEl = document.getElementById('accountAddress');
    if (accountEl) {
      accountEl.textContent = walletAccount;
    }
  } else {
    walletStatusText.textContent = 'Wallet not connected';
    walletStatusIcon.textContent = 'Disconnected';
    walletTypeEl.textContent = '-';
    const accountEl = document.getElementById('accountAddress');
    if (accountEl) {
      accountEl.textContent = '-';
    }
  }
}

window.addEventListener('aetheron:wallet-connected', (event) => {
  const detail = event.detail || {};
  setWalletState(detail.account || null, detail.walletType || walletType, walletProvider);
});

window.addEventListener('aetheron:wallet-disconnected', () => {
  setWalletState(null, null, null);
});

// --- DEX Aggregator Swap (1inch) ---
async function swapTokens(fromToken, toToken, amount) {
  throw new Error('Legacy Polygon swaps are disabled. No Base trading is authorized.');
  if (!walletProvider || !walletAccount) {
    alert('Connect a wallet first.');
    return;
  }
  const url = `${AGGREGATOR_API}/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`;
  await fetch(url).then((r) => r.json());
  const swapUrl = `${AGGREGATOR_API}/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${walletAccount}&slippage=1`;
  const swapData = await fetch(swapUrl).then((r) => r.json());
  const signer = await walletProvider.getSigner();
  const tx = await signer.sendTransaction({
    to: swapData.tx.to,
    data: swapData.tx.data,
    value: swapData.tx.value || 0,
  });
  alert('Swap submitted! Tx: ' + tx.hash);
}

function initWalletBindings() {
  if (walletBindingsInitialized) {
    return;
  }

  walletBindingsInitialized = true;

  if (connectBtn && typeof window.connectWallet !== 'function') {
    connectBtn.addEventListener('click', connectMetaMask);
  }

  if (walletConnectBtn) {
    if (!getWalletConnectProjectId()) {
      walletConnectBtn.title =
        'WalletConnect QR is not configured for this deployment. The button will fall back to browser wallets.';
    }

    walletConnectBtn.addEventListener('click', () => {
      connectWalletConnect().catch((error) => {
        console.error('WalletConnect failed:', error);
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWalletBindings, {
    once: true,
  });
} else {
  initWalletBindings();
}

window.connectMetaMask = connectMetaMask;
window.connectWalletConnect = connectWalletConnect;
window.swapTokens = swapTokens;
