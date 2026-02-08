// index.js - Extracted from index.html inline <script>
// All logic is preserved. Attach this file in index.html after ethers.js and chart.js

// Contract Addresses - UPDATED February 8, 2026
const AETH_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const STAKING_ADDRESS = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
const LIQUIDITY_PAIR = "0xd57c5E33ebDC1b565F99d06809debbf86142705D";
const OWNER_ADDRESS = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452".toLowerCase();
const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
const POLYGON_RPC_URL = 'https://polygon-rpc.com/';

// ABIs
const AETH_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)",
    "function tradingEnabled() view returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const STAKING_ABI = [
    "function stake(uint256 poolId, uint256 amount)",
    "function unstake(uint256 stakeId)",
    "function claimRewards(uint256 stakeId)",
    "function calculateReward(address user, uint256 stakeId) view returns (uint256)",
    "function pools(uint256) view returns (uint256 lockDuration, uint256 rewardRate, uint256 totalStaked, bool isActive)",
    "function getUserStakesCount(address user) view returns (uint256)",
    "function getUserStake(address user, uint256 stakeId) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 poolId, uint256 pendingReward, uint256 unlockTime)",
    "function totalStaked() view returns (uint256)",
    "function rewardBalance() view returns (uint256)",
    "event Staked(address indexed user, uint256 poolId, uint256 amount)",
    "event Unstaked(address indexed user, uint256 stakeId, uint256 amount)",
    "event RewardClaimed(address indexed user, uint256 stakeId, uint256 reward)"
];

let provider, signer, account;
let aethContract, stakingContract;
let readOnlyProvider; // For reading data without wallet connection
let transactions = [];

let detectionAttempts = 0;
const maxAttempts = 5;

// Initialize read-only provider for live data
function initReadOnlyProvider() {
    try {
        readOnlyProvider = new ethers.providers.JsonRpcProvider(POLYGON_RPC_URL);
        console.log('✅ Read-only provider initialized for live data');
        
        // Initialize read-only contracts for displaying stats
        const readOnlyAethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, readOnlyProvider);
        const readOnlyStakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, readOnlyProvider);
        
        return { aethContract: readOnlyAethContract, stakingContract: readOnlyStakingContract };
    } catch (error) {
        console.error('Error initializing read-only provider:', error);
        return null;
    }
}

// Initialize
window.addEventListener('load', async () => {
    console.log('🚀 Aetheron Dashboard Loading...');
    
    // Initialize read-only provider first for live data
    const readOnlyContracts = initReadOnlyProvider();
    if (readOnlyContracts) {
        // Use read-only contracts initially for stats
        if (!aethContract) aethContract = readOnlyContracts.aethContract;
        if (!stakingContract) stakingContract = readOnlyContracts.stakingContract;
    }
    
    // Start updating stats immediately with live blockchain data
    await updateStats();
    setInterval(updateStats, 30000); // Update every 30 seconds
    
    // Then check for wallet
    detectWalletWithRetry();
    window.addEventListener('ethereum#initialized', handleEthereumInit, { once: true });
    setTimeout(() => {
        if (!window.ethereum) {
            console.log('Final check: Wallet still not detected');
            checkWalletStatus();
        }
    }, 5000);
    
    console.log('✅ Dashboard initialized with live data!');
});

function handleEthereumInit() {
    console.log('Ethereum initialized event fired');
    checkWalletStatus();
}

async function detectWalletWithRetry() {
    const delays = [500, 1000, 2000, 3000, 4000];
    for (let i = 0; i < delays.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
        console.log(`Detection attempt ${i + 1}/${delays.length}`);
        const detected = await checkWalletStatus();
        if (detected) {
            console.log('Wallet detected successfully!');
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await connectWallet();
                }
            } catch (error) {
                console.log('Could not check existing accounts:', error);
            }
            break;
        }
    }
}

async function checkWalletStatus() {
    const statusDiv = document.getElementById('walletStatus');
    console.log('Checking wallet status...');
    console.log('window.ethereum exists:', !!window.ethereum);
    console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask);
    console.log('window.ethereum.isCoinbaseWallet:', window.ethereum?.isCoinbaseWallet);
    console.log('window.ethereum providers:', window.ethereum?.providers);
    let isSupportedWallet = false;
    let walletName = '';
    
    if (window.ethereum?.isCoinbaseWallet) {
        isSupportedWallet = true;
        walletName = 'Coinbase Wallet';
    } else if (window.ethereum?.isMetaMask) {
        isSupportedWallet = true;
        walletName = 'MetaMask';
    }
    
    if (window.ethereum?.providers) {
        const coinbaseProvider = window.ethereum.providers.find(p => p.isCoinbaseWallet);
        const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask);
        if (coinbaseProvider) {
            isSupportedWallet = true;
            walletName = 'Coinbase Wallet';
            console.log('Found Coinbase Wallet in providers array');
        } else if (metamaskProvider) {
            isSupportedWallet = true;
            walletName = 'MetaMask';
            console.log('Found MetaMask in providers array');
        }
    }
    
    if (isSupportedWallet) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> ${walletName} Detected ✓<br><small style="color: #6b7280;">Ready to connect</small>`;
        statusDiv.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
        statusDiv.style.border = '2px solid var(--success)';
        return true;
    } else if (window.ethereum) {
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i> Other wallet detected<br><small style="color: #6b7280;">Coinbase Wallet or MetaMask not found</small>';
        statusDiv.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))';
        statusDiv.style.border = '2px solid var(--warning)';
        return false;
    } else {
        statusDiv.innerHTML = '<i class="fas fa-times-circle" style="color: var(--danger);"></i> Wallet Not Detected<br><small style="color: #6b7280;">Install Coinbase Wallet or MetaMask & refresh page</small>';
        statusDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))';
        statusDiv.style.border = '2px solid var(--danger)';
        return false;
    }
}

async function recheckWallet() {
    const statusDiv = document.getElementById('walletStatus');
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rechecking...';
    let detected = false;
    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        detected = await checkWalletStatus();
        if (detected) break;
    }
    if (detected) {
        alert('✅ Wallet detected!\n\nYou can now click the "Connect Wallet" button in the navbar to connect your wallet.');
    } else {
        const action = confirm(
            '❌ Wallet still not detected.\n\n' +
            'Troubleshooting steps:\n' +
            '1. Close and reopen your browser\n' +
            '2. Make sure your wallet extension is enabled\n' +
            '3. Click the wallet extension icon once\n' +
            '4. Refresh this page (F5 or Ctrl+R)\n\n' +
            'Press OK to see debug info, or Cancel to try installing Coinbase Wallet.'
        );
        if (action) {
            alert('Debug Info:\n\n' +
                'window.ethereum exists: ' + !!window.ethereum + '\n' +
                'window.ethereum.isCoinbaseWallet: ' + window.ethereum?.isCoinbaseWallet + '\n' +
                'window.ethereum.isMetaMask: ' + window.ethereum?.isMetaMask + '\n' +
                'Browser: ' + navigator.userAgent + '\n\n' +
                'Check browser console (F12) for more details.');
        } else {
            window.open('https://www.coinbase.com/wallet', '_blank');
        }
    }
}

document.getElementById('connectBtn').addEventListener('click', connectWallet);

// Staking function
async function stakeTokens(poolId) {
    if (!account) {
        showAlert('Please connect your wallet first', 'error', 'stakingAlert');
        return;
    }

    const amountInput = document.getElementById(`stakeAmount${poolId}`);
    const amount = amountInput.value;

    if (!amount || amount <= 0) {
        showAlert('Please enter a valid amount to stake', 'error', 'stakingAlert');
        return;
    }

    const stakeBtn = document.getElementById(`stakeBtn${poolId}`);
    const originalText = stakeBtn.innerHTML;
    stakeBtn.disabled = true;
    stakeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        showAlert('Approving tokens for staking...', 'info', 'stakingAlert');

        // Approve tokens
        const amountWei = ethers.utils.parseEther(amount);
        const approvalTx = await aethContract.approve(STAKING_ADDRESS, amountWei);
        await approvalTx.wait();

        showAlert('Staking tokens...', 'info', 'stakingAlert');

        // Stake tokens
        const stakeTx = await stakingContract.stake(poolId, amountWei);
        await stakeTx.wait();

        showAlert(`Successfully staked ${amount} AETH in pool ${poolId + 1}!`, 'success', 'stakingSuccess');
        amountInput.value = '';

        // Update stats
        await updateStats();

    } catch (error) {
        console.error('Staking error:', error);
        showAlert('Staking failed: ' + error.message, 'error', 'stakingAlert');
    } finally {
        stakeBtn.disabled = false;
        stakeBtn.innerHTML = originalText;
    }
}

// Helper function to show alerts
function showAlert(message, type, alertId) {
    const alertEl = document.getElementById(alertId);
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.classList.remove('hidden');
        setTimeout(() => {
            alertEl.classList.add('hidden');
        }, 5000);
    }
}

// Update stats function
async function updateStats() {
    try {
        // Update price from DexScreener
        await updatePrice();

        // Update contract stats if connected
        if (aethContract && account) {
            await updateBalances();
        }

        // Update staking pool stats
        if (stakingContract) {
            await updateStakingStats();
        }

        console.log('Stats updated successfully');
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update price from DexScreener
async function updatePrice() {
    try {
        console.log('📊 Fetching live price data...');
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            const price = parseFloat(pair.priceUsd) || 0;
            const priceChange = parseFloat(pair.priceChange?.h24 || 0);
            const volume24h = parseFloat(pair.volume?.h24 || 0);
            const liquidity = parseFloat(pair.liquidity?.usd || 0);
            const fdv = parseFloat(pair.fdv || 0);

            // Update price
            const priceEl = document.getElementById('priceValue');
            if (priceEl) {
                if (price > 0) {
                    priceEl.textContent = price >= 0.01 ? `$${price.toFixed(4)}` : `$${price.toFixed(8)}`;
                } else {
                    priceEl.textContent = '$0.00000001';
                }
            }
            
            // Update price change
            const changeEl = document.getElementById('priceChange');
            if (changeEl) {
                changeEl.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% (24h)`;
                changeEl.className = `change ${priceChange >= 0 ? 'positive' : 'negative'}`;
            }

            // Update market cap (using FDV or calculating from price)
            const marketCapEl = document.getElementById('marketCapValue');
            if (marketCapEl) {
                let marketCap = fdv;
                if (!marketCap && price > 0 && aethContract) {
                    try {
                        const totalSupply = await aethContract.totalSupply();
                        const supply = parseFloat(ethers.utils.formatEther(totalSupply));
                        marketCap = price * supply;
                    } catch (e) {
                        marketCap = price * 1000000000; // Fallback: use 1B tokens
                    }
                }
                
                if (marketCap >= 1000000) {
                    marketCapEl.textContent = `$${(marketCap / 1000000).toFixed(2)}M`;
                } else if (marketCap >= 1000) {
                    marketCapEl.textContent = `$${(marketCap / 1000).toFixed(1)}K`;
                } else {
                    marketCapEl.textContent = `$${marketCap.toFixed(0)}`;
                }
            }
            
            // Update market cap change
            const marketCapChangeEl = document.getElementById('marketCapChange');
            if (marketCapChangeEl) {
                marketCapChangeEl.textContent = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% (24h)`;
                marketCapChangeEl.className = `change ${priceChange >= 0 ? 'positive' : 'negative'}`;
            }

            // Update volume
            const volumeEl = document.getElementById('volumeValue');
            if (volumeEl) {
                if (volume24h >= 1000000) {
                    volumeEl.textContent = `$${(volume24h / 1000000).toFixed(2)}M`;
                } else if (volume24h >= 1000) {
                    volumeEl.textContent = `$${(volume24h / 1000).toFixed(1)}K`;
                } else {
                    volumeEl.textContent = `$${volume24h.toFixed(0)}`;
                }
            }
            
            // Update liquidity
            const liquidityEl = document.getElementById('liquidityValue');
            if (liquidityEl) {
                if (liquidity >= 1000000) {
                    liquidityEl.textContent = `$${(liquidity / 1000000).toFixed(2)}M`;
                } else if (liquidity >= 1000) {
                    liquidityEl.textContent = `$${(liquidity / 1000).toFixed(1)}K`;
                } else {
                    liquidityEl.textContent = `$${liquidity.toFixed(0)}`;
                }
            }
            
            console.log('✅ Live price updated:', price, '| Market Cap:', marketCap);
        } else {
            console.warn('⚠️  No price data available yet - showing defaults');
            // Show default values instead of "Loading..."
            const priceEl = document.getElementById('priceValue');
            if (priceEl && priceEl.textContent === 'Loading...') {
                priceEl.textContent = '$0.00000001';
            }
            const marketCapEl = document.getElementById('marketCapValue');
            if (marketCapEl && marketCapEl.textContent === 'Loading...') {
                marketCapEl.textContent = '$10';
            }
        }
    } catch (error) {
        console.error('❌ Error updating price:', error);
        // Show friendly error message
        const priceEl = document.getElementById('priceValue');
        if (priceEl && priceEl.textContent === 'Loading...') {
            priceEl.textContent = '$0.00000001';
        }
    }
}

// Update user balances
async function updateBalances() {
    try {
        if (!account || !aethContract) return;

        const aethBalance = await aethContract.balanceOf(account);
        const balance = parseFloat(ethers.utils.formatEther(aethBalance));

        const balanceEl = document.getElementById('userBalance');
        if (balanceEl) balanceEl.textContent = balance.toFixed(2) + ' AETH';

        // Calculate USD value (need current price)
        const priceResponse = await fetch('https://api.dexscreener.com/latest/dex/tokens/0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e');
        const priceData = await priceResponse.json();
        if (priceData.pairs && priceData.pairs.length > 0) {
            const price = parseFloat(priceData.pairs[0].priceUsd);
            const usdValue = balance * price;
            const usdEl = document.getElementById('userBalanceUSD');
            if (usdEl) usdEl.textContent = `$${usdValue.toFixed(2)} USD`;
        }
        
        console.log('✅ Balance updated:', balance, 'AETH');
    } catch (error) {
        console.error('❌ Error updating balances:', error);
    }
}

// Update staking pool statistics
async function updateStakingStats() {
    try {
        if (!stakingContract) {
            console.warn('⚠️  Staking contract not initialized yet');
            // Show default values
            const stakedEl = document.getElementById('stakedValue');
            if (stakedEl && stakedEl.textContent === 'Loading...') {
                stakedEl.textContent = '0 AETH';
            }
            return;
        }

        console.log('📊 Fetching live staking data...');
        
        // Update total staked
        const totalStaked = await stakingContract.totalStaked();
        const total = parseFloat(ethers.utils.formatEther(totalStaked));

        const stakedEl = document.getElementById('stakedValue');
        if (stakedEl) {
            if (total >= 1000000) {
                stakedEl.textContent = `${(total / 1000000).toFixed(2)}M AETH`;
            } else if (total >= 1000) {
                stakedEl.textContent = `${(total / 1000).toFixed(1)}K AETH`;
            } else {
                stakedEl.textContent = `${total.toFixed(0)} AETH`;
            }
        }
        
        // Update change text
        const stakedChangeEl = document.getElementById('stakedChange');
        if (stakedChangeEl) {
            stakedChangeEl.textContent = '150M AETH Pool';
        }

        // Get token total supply for percentage calculation
        if (aethContract) {
            try {
                const totalSupply = await aethContract.totalSupply();
                const supply = parseFloat(ethers.utils.formatEther(totalSupply));
                const stakedPercentage = (total / supply) * 100;
                
                const stakedPctEl = document.getElementById('stakedPercentage');
                if (stakedPctEl) stakedPctEl.textContent = `${stakedPercentage.toFixed(1)}% of supply`;
            } catch (e) {
                console.warn('Could not fetch total supply:', e);
            }
        }
        
        // Update holders count (approximate - would need indexer for exact count)
        const holdersEl = document.getElementById('holdersValue');
        if (holdersEl) {
            if (total > 0) {
                // Rough estimate based on staked amount
                const estimatedHolders = Math.max(1, Math.floor(total / 1000));
                holdersEl.textContent = estimatedHolders.toLocaleString();
            } else {
                holdersEl.textContent = '1';
            }
        }
        
        console.log('✅ Live staking stats updated:', total, 'AETH staked');

    } catch (error) {
        console.error('❌ Error updating staking stats:', error);
        // Show friendly defaults on error
        const stakedEl = document.getElementById('stakedValue');
        if (stakedEl && stakedEl.textContent === 'Loading...') {
            stakedEl.textContent = '0 AETH';
        }
    }
}
    if (typeof window.ethereum === 'undefined') {
        alert('No Ethereum wallet detected! Please:\n1. Install MetaMask or Coinbase Wallet\n2. Refresh this page\n3. Make sure you\'re using a compatible browser');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        account = await signer.getAddress();

        // Switch to Polygon network
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_CHAIN_ID }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: POLYGON_CHAIN_ID,
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        }],
                    });
                } catch (addError) {
                    console.error('Error adding Polygon network:', addError);
                }
            }
        }

        aethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, signer);
        stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
        
        console.log('\u2705 Wallet connected! Address:', account);
        console.log('\ud83d\udd17 Contracts initialized with wallet signer');

        document.getElementById('connectBtn').textContent = 'Connected ✓';
        document.getElementById('connectBtn').classList.add('connected');
        document.getElementById('walletConnected').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = account.slice(0, 6) + '...' + account.slice(-4);

        await updateStats();
        showAlert('Wallet connected successfully!', 'success', 'stakingSuccess');

    } catch (error) {
        console.error('Error connecting:', error);
        showAlert('Failed to connect: ' + error.message, 'error', 'stakingAlert');
    }
}

// Disconnect wallet function
async function disconnectWallet() {
    account = null;
    signer = null;
    aethContract = null;
    stakingContract = null;

    document.getElementById('connectBtn').textContent = 'Connect Wallet';
    document.getElementById('connectBtn').classList.remove('connected');
    document.getElementById('walletConnected').classList.add('hidden');
    document.getElementById('walletAddress').textContent = '';
    document.getElementById('userBalance').textContent = '0.00';
    document.getElementById('userBalanceUSD').textContent = '$0.00 USD';

    showAlert('Wallet disconnected', 'info', 'stakingAlert');
}

// Add token to wallet function
async function addTokenToWallet() {
    if (!window.ethereum) {
        alert('No Ethereum wallet detected!');
        return;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: AETH_ADDRESS,
                    symbol: 'AETH',
                    decimals: 18,
                    image: 'https://raw.githubusercontent.com/MastaTrill/Aetheron_platform/main/aetheron-logo.svg'
                },
            },
        });
        showAlert('AETH token added to wallet!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error adding token:', error);
        showAlert('Failed to add token: ' + error.message, 'error', 'stakingAlert');
    }
}

// Calculate rewards function
async function calculateRewards() {
    if (!account) {
        showAlert('Please connect your wallet first', 'error', 'stakingAlert');
        return;
    }

    const stakeId = document.getElementById('stakeId').value;
    if (!stakeId) {
        showAlert('Please enter a stake ID', 'error', 'stakingAlert');
        return;
    }

    try {
        const reward = await stakingContract.calculateReward(account, stakeId);
        document.getElementById('calculatedReward').textContent = ethers.utils.formatEther(reward) + ' AETH';
        showAlert('Reward calculated successfully!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error calculating reward:', error);
        showAlert('Failed to calculate reward: ' + error.message, 'error', 'stakingAlert');
    }
}

// Refresh transactions function
async function refreshTransactions() {
    await updateStats();
    showAlert('Transactions refreshed!', 'success', 'stakingSuccess');
}

// Owner functions (only work if connected wallet is owner)
async function updateTaxes() {
    if (!account || account.toLowerCase() !== OWNER_ADDRESS) {
        showAlert('Only contract owner can update taxes', 'error', 'stakingAlert');
        return;
    }

    const buyTax = document.getElementById('buyTax').value;
    const sellTax = document.getElementById('sellTax').value;

    try {
        const tx = await aethContract.updateTaxes(buyTax, sellTax);
        await tx.wait();
        showAlert('Taxes updated successfully!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error updating taxes:', error);
        showAlert('Failed to update taxes: ' + error.message, 'error', 'stakingAlert');
    }
}

async function pauseTrading() {
    if (!account || account.toLowerCase() !== OWNER_ADDRESS) {
        showAlert('Only contract owner can pause trading', 'error', 'stakingAlert');
        return;
    }

    try {
        const tx = await aethContract.pause();
        await tx.wait();
        showAlert('Trading paused successfully!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error pausing trading:', error);
        showAlert('Failed to pause trading: ' + error.message, 'error', 'stakingAlert');
    }
}

async function unpauseTrading() {
    if (!account || account.toLowerCase() !== OWNER_ADDRESS) {
        showAlert('Only contract owner can unpause trading', 'error', 'stakingAlert');
        return;
    }

    try {
        const tx = await aethContract.unpause();
        await tx.wait();
        showAlert('Trading unpaused successfully!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error unpausing trading:', error);
        showAlert('Failed to unpause trading: ' + error.message, 'error', 'stakingAlert');
    }
}

async function withdrawTreasury() {
    if (!account || account.toLowerCase() !== OWNER_ADDRESS) {
        showAlert('Only contract owner can withdraw treasury', 'error', 'stakingAlert');
        return;
    }

    try {
        const tx = await aethContract.withdrawTreasury();
        await tx.wait();
        showAlert('Treasury withdrawn successfully!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error withdrawing treasury:', error);
        showAlert('Failed to withdraw treasury: ' + error.message, 'error', 'stakingAlert');
    }
}

async function emergencyWithdraw() {
    if (!account || account.toLowerCase() !== OWNER_ADDRESS) {
        showAlert('Only contract owner can perform emergency withdraw', 'error', 'stakingAlert');
        return;
    }

    try {
        const tx = await stakingContract.emergencyWithdraw();
        await tx.wait();
        showAlert('Emergency withdraw completed!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error emergency withdraw:', error);
        showAlert('Failed emergency withdraw: ' + error.message, 'error', 'stakingAlert');
    }
}

async function rescueTokens() {
    if (!account || account.toLowerCase() !== OWNER_ADDRESS) {
        showAlert('Only contract owner can rescue tokens', 'error', 'stakingAlert');
        return;
    }

    const tokenAddress = document.getElementById('rescueToken').value;
    const amount = document.getElementById('rescueAmount').value;

    try {
        const tx = await aethContract.rescueTokens(tokenAddress, ethers.utils.parseEther(amount));
        await tx.wait();
        showAlert('Tokens rescued successfully!', 'success', 'stakingSuccess');
    } catch (error) {
        console.error('Error rescuing tokens:', error);
        showAlert('Failed to rescue tokens: ' + error.message, 'error', 'stakingAlert');
    }
}
