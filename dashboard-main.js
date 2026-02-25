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

async function switchToPolygon() {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_PARAMS],
      });
    }
  }
}

async function connectWallet(auto = false) {
  if (!window.ethereum) {
    if (!auto) showToast('Install MetaMask', { type: 'error' });
    return;
  }

  let retries = 0;
  let success = false;
  showGlobalLoading(true);
  while (retries < 3 && !success) {
    try {
      if (!auto) {
        await ethereum.request({
          method: 'eth_requestAccounts',
        });
      }
      await switchToPolygon();
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      account = await signer.getAddress();
      localStorage.setItem('aetheron_connected', account);
      aethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, signer);
      stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        STAKING_ABI,
        signer,
      );
      document.getElementById('walletInfo').classList.add('active');
      document.getElementById('accountAddress').textContent =
        account.slice(0, 6) + '...' + account.slice(-4);
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
    document.getElementById('ethBalance').textContent = '--';
    document.getElementById('aethBalance').textContent = '--';
    // Add more fallback for holders, staked, market cap, health if needed
  }
  showGlobalLoading(false);
}

async function autoReconnect() {
  const saved = localStorage.getItem('aetheron_connected');

  if (saved && window.ethereum) {
    connectWallet(true);
  }
}

async function updateBalances() {
  if (!account) {
    document.getElementById('ethBalance').textContent = '--';
    document.getElementById('aethBalance').textContent = '--';
    return;
  }
  try {
    const matic = await provider.getBalance(account);
    document.getElementById('ethBalance').textContent =
      parseFloat(ethers.utils.formatEther(matic)).toFixed(4) + ' MATIC';
  } catch (err) {
    document.getElementById('ethBalance').textContent = '--';
    console.error('Failed to fetch MATIC balance:', err);
  }
  try {
    const aeth = await aethContract.balanceOf(account);
    document.getElementById('aethBalance').textContent =
      parseFloat(ethers.utils.formatEther(aeth)).toFixed(2) + ' AETH';
  } catch (err) {
    document.getElementById('aethBalance').textContent = '--';
    console.error('Failed to fetch AETH balance:', err);
  }
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

window.addEventListener('load', () => {
  autoReconnect();

  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn)
    connectBtn.addEventListener('click', () => connectWallet(false));

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
});
