const AETH_ADDRESS = '0x072091F554df794852E0A9d1c809F2B2bBda171E';
const STAKING_ADDRESS = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';

const POLYGON_CHAIN_ID = '0x89';

const POLYGON_PARAMS = {
  chainId: '0x89',
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

const AETH_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to,uint256 amount) returns(bool)',
];

const STAKING_ABI = [
  'function stake(uint256 poolId,uint256 amount)',
  'function pools(uint256) view returns(uint256,uint256,uint256,bool)',
];

let provider;
let signer;
let account;
let aethContract;
let stakingContract;
let dashboardMainInitialized = false;
let walletEventsBound = false;
let walletEventsProvider = null;
let activeInjectedProvider = null;
let activeWalletType = null;

function showGlobalLoading(show) {
  const spinner = document.getElementById('globalLoading');
  if (spinner) spinner.style.display = show ? 'flex' : 'none';
}

function showToast(message, options = {}) {
  if (typeof window.showToast === 'function') {
    window.showToast(message, options);
  } else if (window.Toastify) {
    window.Toastify({ text: message, duration: 3000 }).showToast();
  } else {
    try {
      console.log('Toast:', message, options);
    } catch {}
    alert(message);
  }
}

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

  if (typeof accountAddress === 'string' && accountAddress) {
    window.dashboard.walletAccount = accountAddress;
  } else if (!accountAddress) {
    window.dashboard.walletAccount = null;
  }
}

function normalizeConnectRequest(request = false) {
  if (typeof request === 'boolean') {
    return { auto: request };
  }

  if (typeof request === 'string') {
    return { auto: false, walletType: request };
  }

  if (typeof request === 'object' && request !== null) {
    return {
      auto: Boolean(request.auto),
      walletType: request.walletType || null,
      provider: request.provider || null,
    };
  }

  return { auto: false };
}

function getInjectedProviders() {
  if (!window.ethereum) {
    return [];
  }

  if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
    return window.ethereum.providers;
  }

  return [window.ethereum];
}

function getInjectedProviderLabel(injectedProvider) {
  if (!injectedProvider) {
    return 'Browser Wallet';
  }

  if (injectedProvider.isAetheronMetaMaskMultichain) {
    return 'MetaMask';
  }

  if (injectedProvider.isMetaMask && !injectedProvider.isCoinbaseWallet) {
    return 'MetaMask';
  }

  if (injectedProvider.isCoinbaseWallet) {
    return 'Coinbase Wallet';
  }

  if (injectedProvider.isRabby) {
    return 'Rabby';
  }

  return 'Browser Wallet';
}

function getWalletDisplayLabel(walletType, injectedProvider) {
  if (walletType === 'walletconnect') {
    return 'WalletConnect';
  }

  return getInjectedProviderLabel(injectedProvider);
}

function getWalletStorageKey(walletType, injectedProvider) {
  if (
    walletType === 'metamask' ||
    walletType === 'coinbase' ||
    walletType === 'browser' ||
    walletType === 'walletconnect'
  ) {
    return walletType;
  }

  const label = getInjectedProviderLabel(injectedProvider);
  if (label === 'MetaMask') {
    return 'metamask';
  }

  if (label === 'Coinbase Wallet') {
    return 'coinbase';
  }

  return 'browser';
}

function getPreferredInjectedProvider(walletType = null) {
  const injectedProviders = getInjectedProviders();
  if (injectedProviders.length === 0) {
    return null;
  }

  if (!walletType || walletType === 'browser') {
    return injectedProviders[0];
  }

  if (walletType === 'metamask') {
    return (
      injectedProviders.find(
        (providerOption) =>
          providerOption.isMetaMask && !providerOption.isCoinbaseWallet,
      ) || null
    );
  }

  if (walletType === 'coinbase') {
    return (
      injectedProviders.find((providerOption) => providerOption.isCoinbaseWallet) ||
      null
    );
  }

  return injectedProviders[0];
}

function getMetaMaskMultichainBridge() {
  const bridge = window.AetheronMetaMaskMultichain;

  if (!bridge || typeof bridge.getProvider !== 'function') {
    return null;
  }

  return bridge;
}

function isUsableWalletProvider(providerOption) {
  return Boolean(providerOption && typeof providerOption.request === 'function');
}

async function getMetaMaskMultichainProvider(auto) {
  const bridge = getMetaMaskMultichainBridge();

  if (!bridge || (typeof bridge.isReady === 'function' && !bridge.isReady())) {
    return null;
  }

  const providerOption = bridge.getProvider();
  if (!providerOption || typeof providerOption.request !== 'function') {
    return null;
  }

  if (auto) {
    const accounts = await providerOption.request({
      method: 'eth_accounts',
      params: [],
    });

    return Array.isArray(accounts) && accounts.length > 0 ? providerOption : null;
  }

  return bridge.connect({ forceRequest: true });
}

async function resolveWalletProvider(requestedProvider, walletType, auto) {
  if (isUsableWalletProvider(requestedProvider)) {
    return requestedProvider;
  }

  const preferredProvider = getPreferredInjectedProvider(walletType);
  if (isUsableWalletProvider(preferredProvider)) {
    return preferredProvider;
  }

  if (walletType === 'metamask') {
    return getMetaMaskMultichainProvider(auto);
  }

  return isUsableWalletProvider(window.ethereum) ? window.ethereum : null;
}

function ensureWalletChooser() {
  let modal = document.getElementById('walletChooserModal');
  if (modal) {
    return modal;
  }

  const chooserMarkup = `
    <div id="walletChooserModal" class="modal-bg" hidden>
      <div class="modal wallet-chooser-modal" role="dialog" aria-modal="true" aria-labelledby="walletChooserTitle">
        <button type="button" class="close-modal-btn" id="closeWalletChooserBtn" aria-label="Close Wallet Chooser">&times;</button>
        <h3 id="walletChooserTitle">Choose a wallet</h3>
        <p class="text-muted">Connect with an installed wallet or use WalletConnect.</p>
        <div id="walletChooserOptions" class="modal-actions wallet-chooser-options"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chooserMarkup);
  modal = document.getElementById('walletChooserModal');
  const closeButton = document.getElementById('closeWalletChooserBtn');

  if (closeButton) {
    closeButton.addEventListener('click', closeWalletChooser);
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeWalletChooser();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeWalletChooser();
    }
  });

  return modal;
}

function closeWalletChooser() {
  const modal = document.getElementById('walletChooserModal');
  if (modal) {
    modal.hidden = true;
  }
}

function renderWalletChooserOptions() {
  const optionsContainer = document.getElementById('walletChooserOptions');
  if (!optionsContainer) {
    return;
  }

  const injectedProviders = getInjectedProviders();
  const chooserOptions = [];
  const seenChoices = new Set();

  injectedProviders.forEach((providerOption) => {
    const label = getInjectedProviderLabel(providerOption);
    const choice =
      label === 'MetaMask'
        ? 'metamask'
        : label === 'Coinbase Wallet'
          ? 'coinbase'
          : 'browser';

    if (seenChoices.has(choice)) {
      return;
    }

    seenChoices.add(choice);
    chooserOptions.push({
      choice,
      label,
      helper:
        label === 'MetaMask'
          ? 'Connect with MetaMask extension or mobile app'
          : `Connect with ${label}`,
    });
  });

  chooserOptions.push({
    choice: 'walletconnect',
    label: 'WalletConnect',
    helper: 'Scan with a mobile wallet',
  });

  if (chooserOptions.length === 1 && chooserOptions[0].choice === 'walletconnect') {
    chooserOptions.unshift(
      {
        choice: 'install-metamask',
        label: 'Get MetaMask',
        helper: 'Install the MetaMask browser extension',
      },
      {
        choice: 'install-coinbase',
        label: 'Get Coinbase Wallet',
        helper: 'Install the Coinbase Wallet extension',
      },
    );
  }

  optionsContainer.innerHTML = chooserOptions
    .map(
      (option) => `
        <button
          type="button"
          class="btn wallet-choice-btn"
          data-wallet-choice="${option.choice}"
          aria-label="${option.label}"
        >
          <strong>${option.label}</strong>
          <span>${option.helper}</span>
        </button>
      `,
    )
    .join('');

  optionsContainer.querySelectorAll('[data-wallet-choice]').forEach((button) => {
    button.addEventListener('click', async () => {
      const { walletChoice } = button.dataset;
      closeWalletChooser();

      if (walletChoice === 'walletconnect') {
        if (typeof window.connectWalletConnect === 'function') {
          await window.connectWalletConnect();
        } else {
          showToast('WalletConnect is still loading. Please try again.', {
            type: 'error',
          });
        }
        return;
      }

      if (walletChoice === 'install-metamask') {
        window.open('https://metamask.io/download/', '_blank', 'noopener');
        return;
      }

      if (walletChoice === 'install-coinbase') {
        window.open('https://www.coinbase.com/wallet/downloads', '_blank', 'noopener');
        return;
      }

      await connectWallet({
        auto: false,
        walletType: walletChoice,
      });
    });
  });
}

function openWalletChooser() {
  ensureWalletChooser();
  renderWalletChooserOptions();
  const modal = document.getElementById('walletChooserModal');
  if (modal) {
    modal.hidden = false;
  }
}

async function switchToPolygon(injectedProvider) {
  try {
    await injectedProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await injectedProvider.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_PARAMS],
      });
    }
  }
}

async function connectWallet(request = false) {
  const { auto, walletType = null, provider: requestedProvider = null } =
    normalizeConnectRequest(request);
  const injectedProvider = await resolveWalletProvider(
    requestedProvider,
    walletType,
    auto,
  );

  if (!injectedProvider) {
    if (!auto) {
      const bridge = getMetaMaskMultichainBridge();
      showToast(
        walletType === 'metamask' && !bridge
          ? 'MetaMask Connect is still loading. Please try again in a moment.'
          : 'No browser wallet detected. Choose WalletConnect or install a wallet.',
        {
          type: 'error',
        },
      );
      openWalletChooser();
    }
    return;
  }

  if (
    typeof window.ethers === 'undefined' ||
    !window.ethers.providers ||
    !window.ethers.providers.Web3Provider
  ) {
    if (!auto) {
      showToast('Wallet libraries are still loading. Please try again.', {
        type: 'error',
      });
    }
    return;
  }

  let retries = 0;
  let success = false;
  showGlobalLoading(true);
  while (retries < 3 && !success) {
    try {
      const hasWalletConnectSession =
        walletType === 'walletconnect' &&
        Array.isArray(injectedProvider.accounts) &&
        injectedProvider.accounts.length > 0;

      if (!auto && !hasWalletConnectSession) {
        await injectedProvider.request({
          method: 'eth_requestAccounts',
        });
      }
      await switchToPolygon(injectedProvider);
      activeInjectedProvider = injectedProvider;
      activeWalletType = walletType || getWalletStorageKey(walletType, injectedProvider);
      bindWalletEvents(injectedProvider);
      provider = new ethers.providers.Web3Provider(injectedProvider);
      signer = provider.getSigner();
      account = await signer.getAddress();
      localStorage.setItem('aetheron_connected', account);
      localStorage.setItem(
        'aetheron_connected_wallet',
        getWalletStorageKey(walletType, injectedProvider),
      );
      aethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, signer);
      stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        STAKING_ABI,
        signer,
      );
      const walletInfo = document.getElementById('walletInfo');
      if (walletInfo) walletInfo.classList.add('active');
      const accountAddress = document.getElementById('accountAddress');
      if (accountAddress) {
        accountAddress.textContent = account.slice(0, 6) + '...' + account.slice(-4);
      }
      const walletTypeElement = document.getElementById('walletType');
      if (walletTypeElement) {
        walletTypeElement.textContent = getWalletDisplayLabel(
          activeWalletType,
          injectedProvider,
        );
      }
      syncLegacyDashboard(account);
      dispatchWalletEvent('aetheron:wallet-connected', {
        account,
        walletType: getWalletDisplayLabel(activeWalletType, injectedProvider),
      });
      await updateBalances();
      success = true;
    } catch (err) {
      retries++;
      console.error('Wallet/contract connection failed:', err);
      showToast('Connection failed. Retrying (' + retries + '/3)...', {
        type: 'error',
      });
      await new Promise((res) => setTimeout(res, 1500));
    }
  }
  if (!success) {
    showToast(
      'Unable to connect wallet or contracts. Please check your network and try again.',
      { type: 'error' },
    );
    // Fallback UI for stats
    const ethBalance = document.getElementById('ethBalance');
    const aethBalance = document.getElementById('aethBalance');
    if (ethBalance) ethBalance.textContent = '--';
    if (aethBalance) aethBalance.textContent = '--';
    // Add more fallback for holders, staked, market cap, health if needed
    syncLegacyDashboard(null);
    dispatchWalletEvent('aetheron:wallet-disconnected');
  }
  showGlobalLoading(false);
}

window.connectWallet = connectWallet;
window.updateDashboardBalances = updateBalances;

async function autoReconnect() {
  const saved = localStorage.getItem('aetheron_connected');
  const savedWalletType = localStorage.getItem('aetheron_connected_wallet');

  if (savedWalletType === 'walletconnect' && typeof window.connectWalletConnect === 'function') {
    window.connectWalletConnect({ auto: true }).catch((err) => {
      console.warn('WalletConnect auto reconnect failed:', err);
    });
    return;
  }

  if (saved && (window.ethereum || savedWalletType === 'metamask')) {
    connectWallet({
      auto: true,
      walletType: savedWalletType || 'browser',
    });
  }
}

async function updateBalances() {
  if (!account) {
    const ethBalance = document.getElementById('ethBalance');
    const aethBalance = document.getElementById('aethBalance');
    if (ethBalance) ethBalance.textContent = '--';
    if (aethBalance) aethBalance.textContent = '--';
    return;
  }
  try {
    const matic = await provider.getBalance(account);
    const ethBalance = document.getElementById('ethBalance');
    if (ethBalance) {
      ethBalance.textContent =
        parseFloat(ethers.utils.formatEther(matic)).toFixed(4) + ' MATIC';
    }
  } catch (err) {
    const ethBalance = document.getElementById('ethBalance');
    if (ethBalance) ethBalance.textContent = '--';
    console.error('Failed to fetch MATIC balance:', err);
  }
  try {
    const aeth = await aethContract.balanceOf(account);
    const aethBalance = document.getElementById('aethBalance');
    if (aethBalance) {
      aethBalance.textContent =
        parseFloat(ethers.utils.formatEther(aeth)).toFixed(2) + ' AETH';
    }
  } catch (err) {
    const aethBalance = document.getElementById('aethBalance');
    if (aethBalance) aethBalance.textContent = '--';
    console.error('Failed to fetch AETH balance:', err);
  }
}

function handleAccountsChanged(accounts) {
  if (Array.isArray(accounts) && accounts.length > 0) {
    account = accounts[0];
    const walletTypeElement = document.getElementById('walletType');
    if (walletTypeElement) {
      walletTypeElement.textContent = getWalletDisplayLabel(
        activeWalletType,
        activeInjectedProvider || window.ethereum,
      );
    }
    syncLegacyDashboard(account);
    dispatchWalletEvent('aetheron:wallet-connected', {
      account,
      walletType: getWalletDisplayLabel(
        activeWalletType,
        activeInjectedProvider || window.ethereum,
      ),
    });
    updateBalances();
    return;
  }

  account = null;
  provider = undefined;
  signer = undefined;
  aethContract = undefined;
  stakingContract = undefined;
  activeInjectedProvider = null;
  activeWalletType = null;
  localStorage.removeItem('aetheron_connected');
  localStorage.removeItem('aetheron_connected_wallet');

  const walletInfo = document.getElementById('walletInfo');
  if (walletInfo) {
    walletInfo.classList.remove('active');
  }

  const accountAddress = document.getElementById('accountAddress');
  if (accountAddress) {
    accountAddress.textContent = '-';
  }

  updateBalances();
  syncLegacyDashboard(null);
  dispatchWalletEvent('aetheron:wallet-disconnected');
}

function handleChainChanged() {
  if (account) {
    updateBalances();
  }
}

function bindWalletEvents(injectedProvider = activeInjectedProvider || window.ethereum) {
  if (!injectedProvider || typeof injectedProvider.on !== 'function') {
    return;
  }

  if (
    walletEventsProvider &&
    walletEventsProvider !== injectedProvider &&
    typeof walletEventsProvider.removeListener === 'function'
  ) {
    walletEventsProvider.removeListener('accountsChanged', handleAccountsChanged);
    walletEventsProvider.removeListener('chainChanged', handleChainChanged);
    walletEventsBound = false;
  }

  if (walletEventsBound && walletEventsProvider === injectedProvider) {
    return;
  }

  walletEventsBound = true;
  walletEventsProvider = injectedProvider;
  injectedProvider.on('accountsChanged', handleAccountsChanged);
  injectedProvider.on('chainChanged', handleChainChanged);
}

async function transferTokens() {
  const to = document.getElementById('transferTo').value;

  const amount = document.getElementById('transferAmount').value;

  if (!to || !amount) return;

  try {
    showGlobalLoading(true);

    const tx = await aethContract.transfer(to, ethers.utils.parseEther(amount));

    await tx.wait();

    showToast('Transfer successful', { type: 'success' });

    updateBalances();
  } catch (err) {
    console.error(err);

    showToast('Transfer failed', { type: 'error' });
  }

  showGlobalLoading(false);
}

async function stakeTokens() {
  const poolId = document.getElementById('poolId').value;

  const amount = document.getElementById('stakeAmount').value;

  try {
    showGlobalLoading(true);

    const tx = await stakingContract.stake(
      poolId,
      ethers.utils.parseEther(amount),
    );

    await tx.wait();

    showToast('Stake successful', { type: 'success' });

    updateBalances();
  } catch (err) {
    console.error(err);

    showToast('Stake failed', { type: 'error' });
  }

  showGlobalLoading(false);
}

function initDashboardMain() {
  if (dashboardMainInitialized) {
    return;
  }

  dashboardMainInitialized = true;
  bindWalletEvents();
  autoReconnect();

  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn)
    connectBtn.addEventListener('click', openWalletChooser);

  // Refresh balances
  const refreshBtn = document.getElementById('refreshBalancesBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', updateBalances);

  // Transfer
  const transferBtn = document.getElementById('transferBtn');
  if (transferBtn) transferBtn.addEventListener('click', transferTokens);

  // Stake
  const stakeBtn = document.getElementById('stakeBtn');
  if (stakeBtn) stakeBtn.addEventListener('click', stakeTokens);

  // Buy AETH
  const buyBtn = document.querySelector('.buy-btn');
  if (buyBtn)
    buyBtn.addEventListener('click', () => {
      window.open(
        'https://quickswap.exchange/#/swap?outputCurrency=' + AETH_ADDRESS,
        '_blank',
      );
    });

  // Coinbase
  const coinbaseBtn = document.querySelector('.coinbase-btn');
  if (coinbaseBtn)
    coinbaseBtn.addEventListener('click', () => {
      // Placeholder for Coinbase payment
      showToast('Coinbase payment integration coming soon!', { type: 'info' });
    });

  // Mobile menu logic
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobileMenuOverlay');
  const body = document.body;
  if (hamburger && overlay) {
    function toggleMenu() {
      const isActive = hamburger.classList.toggle('active');
      overlay.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive);
      body.style.overflow = isActive ? 'hidden' : '';
    }
    function closeMenu() {
      hamburger.classList.remove('active');
      overlay.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    }
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
  }
}

window.openWalletChooser = openWalletChooser;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardMain, {
    once: true,
  });
} else {
  initDashboardMain();
}
