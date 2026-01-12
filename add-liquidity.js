// Extracted from add-liquidity.html
const AETH_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon USDC
const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";

let provider, signer, account;
let aethContract, usdcContract;

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const ROUTER_ABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)"
];

function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.style.background = type === 'error' ? '#ffebee' : type === 'success' ? '#e8f5e9' : '#f0f0f0';
}

function calculatePrice() {
    const aeth = parseFloat(document.getElementById('aethAmount').value) || 0;
    const usdc = parseFloat(document.getElementById('usdcAmount').value) || 0;
    if (aeth > 0 && usdc > 0) {
        const pricePerAeth = usdc / aeth;
        const marketCap = pricePerAeth * 1000000000;
        document.getElementById('priceCalc').innerHTML = `Price per AETH: <strong>$${pricePerAeth.toFixed(6)}</strong><br>Est. Market Cap: <strong>$${marketCap.toLocaleString()}</strong>`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('aethAmount').addEventListener('input', calculatePrice);
    document.getElementById('usdcAmount').addEventListener('input', calculatePrice);
    document.getElementById('connectBtn').addEventListener('click', connectWallet);
    document.getElementById('addLiquidityBtn').addEventListener('click', addLiquidity);
    calculatePrice();
});

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('MetaMask not installed! Please install MetaMask first.');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }
        updateStatus('Connecting to MetaMask...');
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        account = accounts[0];
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== 137) {
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
                }
            }
        }
        // Initialize contracts
        aethContract = new ethers.Contract(AETH_ADDRESS, ERC20_ABI, signer);
        usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
        // Get balances
        await updateBalances();
        document.getElementById('connectBtn').style.display = 'none';
        document.getElementById('addLiquidityBtn').style.display = 'block';
        document.getElementById('addLiquidityBtn').disabled = false;
        document.getElementById('walletInfo').style.display = 'block';
        updateStatus(`Connected: ${account.slice(0, 6)}...${account.slice(-4)}`, 'success');
    } catch (error) {
        console.error(error);
        updateStatus('Error: ' + error.message, 'error');
    }
}

async function updateBalances() {
    const aethBal = await aethContract.balanceOf(account);
    const usdcBal = await usdcContract.balanceOf(account);
    const maticBal = await provider.getBalance(account);
    document.getElementById('aethBalance').textContent = ethers.formatEther(aethBal) + ' AETH';
    document.getElementById('usdcBalance').textContent = ethers.formatUnits(usdcBal, 6) + ' USDC';
    document.getElementById('maticBalance').textContent = ethers.formatEther(maticBal) + ' MATIC';
}

async function addLiquidity() {
    try {
        const aethAmount = document.getElementById('aethAmount').value;
        const usdcAmount = document.getElementById('usdcAmount').value;
        if (!aethAmount || !usdcAmount) {
            alert('Please enter both amounts');
            return;
        }
        const aethWei = ethers.parseEther(aethAmount);
        const usdcWei = ethers.parseUnits(usdcAmount, 6);
        document.getElementById('addLiquidityBtn').disabled = true;
        // Step 1: Approve AETH
        updateStatus('Step 1/3: Approving AETH...');
        const aethAllowance = await aethContract.allowance(account, QUICKSWAP_ROUTER);
        if (aethAllowance < aethWei) {
            const approveTx1 = await aethContract.approve(QUICKSWAP_ROUTER, ethers.MaxUint256);
            await approveTx1.wait();
            updateStatus('AETH approved ✓');
        }
        // Step 2: Approve USDC
        updateStatus('Step 2/3: Approving USDC...');
        const usdcAllowance = await usdcContract.allowance(account, QUICKSWAP_ROUTER);
        if (usdcAllowance < usdcWei) {
            const approveTx2 = await usdcContract.approve(QUICKSWAP_ROUTER, ethers.MaxUint256);
            await approveTx2.wait();
            updateStatus('USDC approved ✓');
        }
        // Step 3: Add Liquidity
        updateStatus('Step 3/3: Adding liquidity to QuickSwap...');
        const router = new ethers.Contract(QUICKSWAP_ROUTER, ROUTER_ABI, signer);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        const tx = await router.addLiquidity(
            AETH_ADDRESS,
            USDC_ADDRESS,
            aethWei,
            usdcWei,
            (aethWei * 95n) / 100n, // 5% slippage - BigInt arithmetic
            (usdcWei * 95n) / 100n, // Note: For more precision, consider using basis points (e.g., 9500n/10000n)
            account,
            deadline
        );
        updateStatus('Waiting for confirmation...');
        const receipt = await tx.wait();
        document.getElementById('result').innerHTML = `<div class="success"><h3>🎉 Liquidity Added Successfully!</h3><p><strong>Transaction:</strong> <a href="https://polygonscan.com/tx/${receipt.transactionHash}" target="_blank" rel="noopener">${receipt.transactionHash.slice(0, 10)}...</a></p><p><strong>What's Next:</strong></p><ul class="success-list"><li>Test trading: <a href="https://quickswap.exchange/#/swap?outputCurrency=${AETH_ADDRESS}" target="_blank" rel="noopener">Buy AETH on QuickSwap</a></li><li>Your token is now tradeable!</li><li>Submit to CoinGecko and CoinMarketCap</li></ul></div>`;
        updateStatus('Liquidity added successfully! 🎉', 'success');
        await updateBalances();
    } catch (error) {
        console.error(error);
        document.getElementById('result').innerHTML = `<div class="error"><strong>Error:</strong> ${error.message}</div>`;
        updateStatus('Error: ' + error.message, 'error');
        document.getElementById('addLiquidityBtn').disabled = false;
    }
}
