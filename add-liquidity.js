// add-liquidity.js - Fixed for ethers v5 compatibility with improved UX
const AETH_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // Polygon USDC (new address)
const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";

let provider, signer, account;
let aethContract, usdcContract;

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const ROUTER_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",
  "function factory() view returns (address)"
];

function updateStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
}

function setLoading(loading) {
  const btn = document.getElementById('addLiquidityBtn');
  if (btn) {
    btn.disabled = loading;
    btn.textContent = loading ? '⏳ Processing...' : 'Add Liquidity to QuickSwap';
  }
}

function calculatePrice() {
  const aeth = parseFloat(document.getElementById('aethAmount')?.value) || 0;
  const usdc = parseFloat(document.getElementById('usdcAmount')?.value) || 0;
  const priceCalc = document.getElementById('priceCalc');
  if (!priceCalc) return;

  if (aeth > 0 && usdc > 0) {
    const pricePerAeth = usdc / aeth;
    const marketCap = pricePerAeth * 1000000000;
    priceCalc.innerHTML = `
      <strong>Price per AETH: $${pricePerAeth.toFixed(6)}</strong><br>
      <span>Est. Market Cap: $${marketCap.toLocaleString()}</span><br>
      <span>Pool Ratio: 1 AETH = ${pricePerAeth.toFixed(6)} USDC</span>
    `;
  } else {
    priceCalc.textContent = 'Enter amounts to calculate price';
  }
}

async function connectWallet() {
  try {
    if (typeof window.ethereum === 'undefined') {
      updateStatus('No wallet detected. Please install MetaMask.', 'error');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    updateStatus('Connecting to wallet...', 'info');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    account = accounts[0];

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== '0x89') {
      updateStatus('Switching to Polygon network...', 'info');
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com']
            }]
          });
        } else {
          throw switchError;
        }
      }
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    aethContract = new ethers.Contract(AETH_ADDRESS, ERC20_ABI, signer);
    usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);

    document.getElementById('connectBtn').style.display = 'none';
    document.getElementById('addLiquidityBtn').classList.remove('hidden');
    document.getElementById('addLiquidityBtn').style.display = 'inline-block';
    document.getElementById('walletInfo').classList.remove('hidden');
    document.getElementById('walletInfo').style.display = 'block';

    await updateBalances();
    updateStatus(`Connected: ${account.slice(0, 6)}...${account.slice(-4)}`, 'success');

  } catch (error) {
    console.error('Wallet connection error:', error);
    updateStatus('Error: ' + (error.message || 'Failed to connect'), 'error');
  }
}

async function updateBalances() {
  if (!account || !aethContract || !usdcContract) return;

  try {
    const [aethBal, usdcBal, maticBal] = await Promise.all([
      aethContract.balanceOf(account),
      usdcContract.balanceOf(account),
      provider.getBalance(account)
    ]);

    document.getElementById('aethBalance').textContent =
      parseFloat(ethers.utils.formatEther(aethBal)).toLocaleString() + ' AETH';
    document.getElementById('usdcBalance').textContent =
      parseFloat(ethers.utils.formatUnits(usdcBal, 6)).toLocaleString() + ' USDC';
    document.getElementById('maticBalance').textContent =
      parseFloat(ethers.utils.formatEther(maticBal)).toFixed(4) + ' MATIC';
  } catch (error) {
    console.error('Balance fetch error:', error);
  }
}

async function addLiquidity() {
  if (!signer) {
    alert('Please connect your wallet first');
    return;
  }

  const aethAmountInput = document.getElementById('aethAmount').value;
  const usdcAmountInput = document.getElementById('usdcAmount').value;

  if (!aethAmountInput || !usdcAmountInput || parseFloat(aethAmountInput) <= 0 || parseFloat(usdcAmountInput) <= 0) {
    alert('Please enter valid amounts for both tokens');
    return;
  }

  setLoading(true);
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';

  try {
    const aethWei = ethers.utils.parseEther(aethAmountInput);
    const usdcWei = ethers.utils.parseUnits(usdcAmountInput, 6);

    const [aethBal, usdcBal] = await Promise.all([
      aethContract.balanceOf(account),
      usdcContract.balanceOf(account)
    ]);

    if (aethBal.lt(aethWei)) {
      throw new Error(`Insufficient AETH balance. Have: ${ethers.utils.formatEther(aethBal)}, Need: ${aethAmountInput}`);
    }
    if (usdcBal.lt(usdcWei)) {
      throw new Error(`Insufficient USDC balance. Have: ${ethers.utils.formatUnits(usdcBal, 6)}, Need: ${usdcAmountInput}`);
    }

    updateStatus('Step 1/3: Approving AETH...', 'info');
    const aethAllowance = await aethContract.allowance(account, QUICKSWAP_ROUTER);
    if (aethAllowance.lt(aethWei)) {
      const approveTx1 = await aethContract.approve(QUICKSWAP_ROUTER, ethers.constants.MaxUint256);
      resultDiv.innerHTML = `<div class="info">Waiting for AETH approval... <a href="https://polygonscan.com/tx/${approveTx1.hash}" target="_blank">View</a></div>`;
      await approveTx1.wait();
    }
    updateStatus('AETH approved ✓', 'success');

    updateStatus('Step 2/3: Approving USDC...', 'info');
    const usdcAllowance = await usdcContract.allowance(account, QUICKSWAP_ROUTER);
    if (usdcAllowance.lt(usdcWei)) {
      const approveTx2 = await usdcContract.approve(QUICKSWAP_ROUTER, ethers.constants.MaxUint256);
      resultDiv.innerHTML = `<div class="info">Waiting for USDC approval... <a href="https://polygonscan.com/tx/${approveTx2.hash}" target="_blank">View</a></div>`;
      await approveTx2.wait();
    }
    updateStatus('USDC approved ✓', 'success');

    updateStatus('Step 3/3: Adding liquidity to QuickSwap...', 'info');
    const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippage = 5;
    const minAeth = aethWei.mul(100 - slippage).div(100);
    const minUsdc = usdcWei.mul(100 - slippage).div(100);

    const tx = await router.addLiquidity(
      AETH_ADDRESS,
      USDC_ADDRESS,
      aethWei,
      usdcWei,
      minAeth,
      minUsdc,
      account,
      deadline
    );

    resultDiv.innerHTML = `<div class="info">Waiting for confirmation... <a href="https://polygonscan.com/tx/${tx.hash}" target="_blank">View</a></div>`;
    const receipt = await tx.wait();

    resultDiv.innerHTML = `
      <div class="success">
        <h3>🎉 Liquidity Added Successfully!</h3>
        <p><strong>Transaction:</strong> <a href="https://polygonscan.com/tx/${receipt.transactionHash}" target="_blank" rel="noopener">${receipt.transactionHash.slice(0, 10)}...${receipt.transactionHash.slice(-8)}</a></p>
        <p><strong>Pair:</strong> AETH/USDC</p>
        <p><strong>DEX:</strong> QuickSwap V2</p>
        <h4>What's Next:</h4>
        <ul class="success-list">
          <li><a href="https://quickswap.exchange/#/swap?outputCurrency=${AETH_ADDRESS}" target="_blank" rel="noopener">Trade AETH on QuickSwap</a></li>
          <li><a href="https://quickswap.exchange/#/pool" target="_blank" rel="noopener">View your LP position</a></li>
          <li><a href="https://dexscreener.com/polygon/${receipt.transactionHash}" target="_blank" rel="noopener">Track on DexScreener</a></li>
        </ul>
      </div>
    `;
    updateStatus('Liquidity added successfully! 🎉', 'success');
    await updateBalances();

  } catch (error) {
    console.error('Add liquidity error:', error);
    let errorMsg = error.message || 'Unknown error';
    if (error.code === 'ACTION_REJECTED') {
      errorMsg = 'Transaction rejected by user';
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMsg = 'Insufficient MATIC for gas fees';
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      errorMsg = 'Transaction may fail. Check token approvals and balances.';
    }
    resultDiv.innerHTML = `<div class="error"><strong>Error:</strong> ${errorMsg}</div>`;
    updateStatus('Error: ' + errorMsg, 'error');
  } finally {
    setLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('aethAmount').addEventListener('input', calculatePrice);
  document.getElementById('usdcAmount').addEventListener('input', calculatePrice);
  document.getElementById('connectBtn').addEventListener('click', connectWallet);
  document.getElementById('addLiquidityBtn').addEventListener('click', addLiquidity);
  calculatePrice();
});
