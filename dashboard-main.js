const AETH_ADDRESS = '0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e';
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
  // Simple toast implementation
  alert(message);
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
    if (!auto) alert('Install MetaMask');

    return;
  }

  try {
    showGlobalLoading(true);

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

    stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

    document.getElementById('walletInfo').classList.add('active');

    document.getElementById('accountAddress').textContent =
      account.slice(0, 6) + '...' + account.slice(-4);

    updateBalances();
  } catch (err) {
    console.log(err);
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
  if (!account) return;

  const matic = await provider.getBalance(account);

  document.getElementById('ethBalance').textContent =
    parseFloat(ethers.utils.formatEther(matic)).toFixed(4) + ' MATIC';

  const aeth = await aethContract.balanceOf(account);

  document.getElementById('aethBalance').textContent =
    parseFloat(ethers.utils.formatEther(aeth)).toFixed(2) + ' AETH';
}

async function transferTokens() {
  const to = document.getElementById('transferTo').value;

  const amount = document.getElementById('transferAmount').value;

  if (!to || !amount) return;

  try {
    showGlobalLoading(true);

    const tx = await aethContract.transfer(to, ethers.utils.parseEther(amount));

    await tx.wait();

    alert('Transfer successful');

    updateBalances();
  } catch (err) {
    console.error(err);

    alert('Transfer failed');
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

    alert('Stake successful');

    updateBalances();
  } catch (err) {
    console.error(err);

    alert('Stake failed');
  }

  showGlobalLoading(false);
}

window.addEventListener('load', autoReconnect);

document
  .getElementById('connectBtn')
  .addEventListener('click', () => connectWallet(false));

// Add event listeners for other buttons
window.addEventListener('load', () => {
  // Refresh balances
  const refreshBtn = document.getElementById('refreshBalancesBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', updateBalances);

  // Transfer
  const transferBtn = document.querySelector('.card .action-btn');
  if (transferBtn && transferBtn.textContent.includes('Transfer'))
    transferBtn.addEventListener('click', transferTokens);

  // Stake
  const stakeBtn = document.querySelectorAll('.card .action-btn')[1];
  if (stakeBtn && stakeBtn.textContent.includes('Stake'))
    stakeBtn.addEventListener('click', stakeTokens);

  // Buy AETH
  const buyBtn = document.querySelector('.buy-btn');
  if (buyBtn)
    buyBtn.addEventListener('click', () => {
      window.open(
        'https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
        '_blank',
      );
    });

  // Coinbase
  const coinbaseBtn = document.querySelector('.coinbase-btn');
  if (coinbaseBtn)
    coinbaseBtn.addEventListener('click', () => {
      // Placeholder for Coinbase payment
      alert('Coinbase payment integration coming soon!');
    });
});
