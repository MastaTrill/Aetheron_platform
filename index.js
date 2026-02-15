// index.js - Extracted from index.html inline <script>
// All logic is preserved. Attach this file in index.html after ethers.js and chart.js

// Contract Addresses - UPDATED February 8, 2026
const AETH_ADDRESS = "0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e";
const STAKING_ADDRESS = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
const LIQUIDITY_PAIR = "0xd57c5E33ebDC1b565F99d06809debbf86142705D";
const OWNER_ADDRESS = "0x127C3a5A0922A0A952aDE71412E2DC651Aa7AF82".toLowerCase();
const POLYGON_CHAIN_ID = '0x89'; // 137 in hex
const POLYGON_RPC_URLS = [
    'https://polygon-rpc.com/',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
    'https://rpc-mainnet.maticvigil.com'
];

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
let priceWebSocket; // WebSocket for real-time price updates
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

let detectionAttempts = 0;
const maxAttempts = 5;

// Initialize read-only provider for live data
function initReadOnlyProvider() {
    // Try multiple RPC endpoints for reliability
    for (const rpcUrl of POLYGON_RPC_URLS) {
        try {
            readOnlyProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
            console.log('✅ Read-only provider initialized:', rpcUrl);
            
            // Initialize read-only contracts for displaying stats
            const readOnlyAethContract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, readOnlyProvider);
            const readOnlyStakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, readOnlyProvider);
            
            return { aethContract: readOnlyAethContract, stakingContract: readOnlyStakingContract, rpcUrl };
        } catch (error) {
            console.warn(`⚠️ Failed to connect to ${rpcUrl}:`, error.message);
            continue;
        }
    }
    
    console.error('❌ All RPC endpoints failed');
    return null;
}

// Initialize
window.addEventListener('load', async () => {
    console.log('🚀 Aetheron Dashboard Loading...');
    
    // Initialize theme first
    initTheme();
    
    // Set default values immediately to avoid "Loading..." stuck state
    setDefaultValues();
    
    // Hook up connect wallet button
    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
    }
    
    // Initialize read-only provider first for live data
    const readOnlyContracts = initReadOnlyProvider();
    if (readOnlyContracts) {
        // Use read-only contracts initially for stats
        if (!aethContract) aethContract = readOnlyContracts.aethContract;
        if (!stakingContract) stakingContract = readOnlyContracts.stakingContract;
        console.log('✅ Using RPC:', readOnlyContracts.rpcUrl);
    } else {
        console.warn('⚠️ Running without blockchain connection - showing defaults only');
    }
    
    // Start updating stats immediately with live blockchain data
    await updateStats();
    
    // Initialize WebSocket for real-time updates
    initializeWebSocket();
    
    // Fallback polling for blockchain data every 30 seconds
    setInterval(updateStats, 30000);
    
    // Then check for wallet
    detectWalletWithRetry();
    window.addEventListener('ethereum#initialized', handleEthereumInit, { once: true });
    setTimeout(() => {
        if (!window.ethereum) {
            console.log('Final check: Wallet still not detected');
            checkWalletStatus();
        }
    }, 5000);
    
    console.log('✅ Dashboard initialized!');
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize progressive features
    initProgressBar();
    
    // Add animation classes
    document.querySelectorAll('.stat-card, .feature-card, .card').forEach((el, i) => {
        setTimeout(() => el.classList.add('fade-in'), i * 100);
    });
});

// Set default values to avoid stuck "Loading..." states
function setDefaultValues() {
    const defaults = [
        { id: 'priceValue', value: '$0.00000001' },
        { id: 'priceChange', value: '+0.00% (24h)' },
        { id: 'marketCapValue', value: '$10' },
        { id: 'marketCapChange', value: '+0.00% (24h)' },
        { id: 'stakedValue', value: '0 AETH' },
        { id: 'stakedChange', value: '150M AETH Pool' },
        { id: 'holdersValue', value: '1+' },
        { id: 'holdersChange', value: 'Growing' }
    ];
    
    defaults.forEach(({ id, value }) => {
        const el = document.getElementById(id);
        if (el && (el.textContent === 'Loading...' || el.textContent === '--')) {
            el.textContent = value;
        }
    });
    
    console.log('✅ Default values set');
}

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
    if (!statusDiv) {
        console.warn('Wallet status element not found - page may not be fully loaded');
        return false;
    }
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
    if (!statusDiv) {
        console.warn('Wallet status element not found');
        return;
    }
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

        showToast('Success!', `${amount} AETH staked successfully!`, 'success');
        showAlert(`Successfully staked ${amount} AETH in pool ${poolId + 1}!`, 'success', 'stakingSuccess');
        amountInput.value = '';

        // Update stats
        await updateStats();
        await loadUserStakes();

    } catch (error) {
        console.error('Staking error:', error);
        showToast('Staking Failed', error.message || 'Failed to stake tokens', 'error');
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
            console.warn('⚠️  Staking contract not initialized - keeping defaults');
            return;
        }

        console.log('📊 Fetching live staking data...');
        
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        // Race between the blockchain call and timeout
        const totalStakedPromise = stakingContract.totalStaked();
        const totalStaked = await Promise.race([totalStakedPromise, timeout]);
        
        const total = parseFloat(ethers.utils.formatEther(totalStaked));

        const stakedEl = document.getElementById('stakedValue');
        if (stakedEl) {
            if (total >= 1000000) {
                stakedEl.textContent = `${(total / 1000000).toFixed(2)}M AETH`;
            } else if (total >= 1000) {
                stakedEl.textContent = `${(total / 1000).toFixed(1)}K AETH`;
            } else if (total > 0) {
                stakedEl.textContent = `${total.toFixed(0)} AETH`;
            } else {
                stakedEl.textContent = '0 AETH';
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
                const totalSupplyPromise = aethContract.totalSupply();
                const totalSupply = await Promise.race([totalSupplyPromise, timeout]);
                const supply = parseFloat(ethers.utils.formatEther(totalSupply));
                const stakedPercentage = (total / supply) * 100;
                
                const stakedPctEl = document.getElementById('stakedPercentage');
                if (stakedPctEl) stakedPctEl.textContent = `${stakedPercentage.toFixed(1)}% of supply`;
            } catch (e) {
                console.warn('⚠️  Could not fetch total supply:', e.message);
            }
        }
        
        // Update holders count (estimate)
        const holdersEl = document.getElementById('holdersValue');
        if (holdersEl) {
            if (total > 0) {
                const estimatedHolders = Math.max(1, Math.floor(total / 10000));
                holdersEl.textContent = `${estimatedHolders}+`;
            } else {
                holdersEl.textContent = '1+';
            }
        }
        
        console.log('✅ Staking stats updated:', total, 'AETH staked');

    } catch (error) {
        if (error.message === 'Timeout') {
            console.warn('⚠️  Blockchain call timed out - keeping previous values');
        } else {
            console.error('❌ Error updating staking stats:', error.message);
        }
        // Keep the default values that were already set - don't revert to "Loading..."
    }
}

// Connect wallet function
async function connectWallet() {
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
        document.getElementById('walletNotConnected').classList.add('hidden');
        document.getElementById('walletAddress').textContent = account.slice(0, 6) + '...' + account.slice(-4);

        // Update transaction history UI
        document.getElementById('txNotConnected').classList.add('hidden');
        document.getElementById('txConnected').classList.remove('hidden');

        // Load user data
        showProgress();
        await updateStats();
        await loadUserStakes();
        await loadTransactionHistory();
        hideProgress();
        
        showToast('Connected!', `Wallet ${account.slice(0, 6)}...${account.slice(-4)} connected`, 'success');

    } catch (error) {
        console.error('Error connecting:', error);
        hideProgress();
        showToast('Connection Failed', error.message || 'Failed to connect wallet', 'error');
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
    document.getElementById('walletNotConnected').classList.remove('hidden');
    document.getElementById('txConnected').classList.add('hidden');
    document.getElementById('txNotConnected').classList.remove('hidden');
    
    // Remove user stakes container if exists
    const stakesContainer = document.getElementById('userStakesContainer');
    if (stakesContainer) stakesContainer.remove();
    
    showToast('Disconnected', 'Wallet disconnected successfully', 'info');
    console.log('\ud83d\udd0c Wallet disconnected');
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

// ============================================
// NEW FEATURES - February 2026
// ============================================

// Add AETH to MetaMask
async function addToMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask first!');
        return;
    }

    try {
        const wasAdded = await window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: AETH_ADDRESS,
                    symbol: 'AETH',
                    decimals: 18,
                    image: 'https://raw.githubusercontent.com/MastaTrill/Aetheron_platform/main/assets/logo.png'
                }
            }
        });

        if (wasAdded) {
            showAlert('AETH added to MetaMask!', 'success');
        }
    } catch (error) {
        console.error('Error adding to MetaMask:', error);
        showAlert('Failed to add token to MetaMask', 'error');
    }
}

// Copy contract address
function copyContractAddress() {
    const contractAddress = AETH_ADDRESS;
    navigator.clipboard.writeText(contractAddress).then(() => {
        const btn = document.getElementById('copyBtnText');
        const copyBtn = document.getElementById('copyContractBtn');
        
        btn.textContent = 'Copied! ✓';
        copyBtn.classList.add('copied');

        setTimeout(() => {
            btn.textContent = '0xAb5a...71e';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy address');
    });
}

// Update live holder count
async function updateHolderCount() {
    try {
        // Estimate holders based on total supply and average holding
        // In production, you'd query this from a backend or indexer
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${AETH_ADDRESS}`);
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
            // Rough estimate: use transaction count or volume as proxy
            const txCount = data.pairs[0].txns?.h24?.total || 0;
            const estimatedHolders = Math.max(Math.floor(txCount / 2) + 50, 100);
            document.getElementById('liveHoldersCount').textContent = estimatedHolders + '+';
        }
    } catch (error) {
        console.log('Could not fetch holder count:', error);
        document.getElementById('liveHoldersCount').textContent = '100+';
    }
}

// Toggle FAQ accordion
function toggleFAQ(index) {
    const answer = document.getElementById(`faq-answer-${index}`);
    const toggle = document.getElementById(`faq-toggle-${index}`);
    
    answer.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Enhanced price update with change indicator
let lastPrice = null;

async function updatePriceWithChange() {
    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${AETH_ADDRESS}`);
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            const currentPrice = parseFloat(pair.priceUsd);
            const priceChange = parseFloat(pair.priceChange?.h24 || 0);
            
            // Update price value
            document.getElementById('priceValue').textContent = `$${currentPrice.toFixed(8)}`;
            
            // Update price change indicator
            const arrow = document.getElementById('priceArrow');
            const changePercent = document.getElementById('priceChangePercent');
            const changeDiv = document.getElementById('priceChange');
            
            if (priceChange >= 0) {
                arrow.className = 'fas fa-arrow-up';
                changeDiv.className = 'change positive';
                changePercent.textContent = `+${priceChange.toFixed(2)}%`;
            } else {
                arrow.className = 'fas fa-arrow-down';
                changeDiv.className = 'change negative';
                changePercent.textContent = `${priceChange.toFixed(2)}%`;
            }
            
            lastPrice = currentPrice;
        }
    } catch (error) {
        console.log('Could not update price with change:', error);
    }
}

// QR Code Modal Functions
function showQRCode() {
    const modal = document.getElementById('qrModal');
    const qrcodeContainer = document.getElementById('qrcode');
    
    // Clear previous QR code
    qrcodeContainer.innerHTML = '';
    
    // Generate new QR code
    new QRCode(qrcodeContainer, {
        text: AETH_ADDRESS,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    modal.style.display = 'block';
    
    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'show_qr_code', {
            'event_category': 'engagement',
            'event_label': 'contract_qr'
        });
    }
}

function closeQRModal() {
    document.getElementById('qrModal').style.display = 'none';
}

// Share Modal Functions
function showShareModal() {
    document.getElementById('shareModal').style.display = 'block';
    
    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'show_share_modal', {
            'event_category': 'engagement',
            'event_label': 'share_button'
        });
    }
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

function shareTwitter() {
    const text = encodeURIComponent('🚀 Join Aetheron (AETH) - Revolutionary DeFi platform with up to 50% APY staking rewards! 💎\n\n🎯 Features:\n✅ Gamified Leaderboards\n✅ Referral Rewards (5%)\n✅ Transparent Roadmap\n\n#Aetheron #DeFi #Crypto');
    const url = encodeURIComponent('https://mastatrill.github.io/Aetheron_platform/');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    trackShare('twitter');
}

function shareFacebook() {
    const url = encodeURIComponent('https://mastatrill.github.io/Aetheron_platform/');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    trackShare('facebook');
}

function shareTelegram() {
    const text = encodeURIComponent('🚀 Join Aetheron (AETH) - Revolutionary DeFi platform with up to 50% APY staking rewards!');
    const url = encodeURIComponent('https://mastatrill.github.io/Aetheron_platform/');
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    trackShare('telegram');
}

function shareLinkedIn() {
    const url = encodeURIComponent('https://mastatrill.github.io/Aetheron_platform/');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    trackShare('linkedin');
}

function copyShareLink() {
    const url = 'https://mastatrill.github.io/Aetheron_platform/';
    navigator.clipboard.writeText(url).then(() => {
        const btn = event.target.closest('.share-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'var(--success)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
        }, 2000);
        
        trackShare('copy_link');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy link');
    });
}

function trackShare(platform) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
            'event_category': 'social',
            'event_label': platform,
            'value': 1
        });
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const qrModal = document.getElementById('qrModal');
    const shareModal = document.getElementById('shareModal');
    
    if (event.target === qrModal) {
        closeQRModal();
    }
    if (event.target === shareModal) {
        closeShareModal();
    }
}

// Theme Toggle Functionality
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'theme_toggle', {
            'event_category': 'ui',
            'event_label': newTheme,
            'value': 1
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Initialize theme on load
initTheme();

// Newsletter Signup Handler
async function handleNewsletterSignup(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('emailInput');
    const messageDiv = document.getElementById('newsletterMessage');
    const email = emailInput.value.trim();
    
    if (!email) return;
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageDiv.textContent = '❌ Please enter a valid email address';
        messageDiv.className = 'newsletter-message error';
        return;
    }
    
    // Store in localStorage (in production, send to backend)
    const preferences = {
        email,
        governance: document.querySelector('.notification-options input:nth-child(1)').checked,
        features: document.querySelector('.notification-options input:nth-child(2)').checked,
        priceAlerts: document.querySelector('.notification-options input:nth-child(3)').checked,
        digest: document.querySelector('.notification-options input:nth-child(4)').checked,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('emailNotificationPrefs', JSON.stringify(preferences));
    
    // Request push notification permission
    if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Subscribe to push notifications
                const registration = await navigator.serviceWorker.ready;
                try {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Replace with real VAPID key
                    });
                    console.log('Push subscription:', subscription);
                } catch (err) {
                    console.log('Push subscription failed:', err);
                }
            }
        } catch (err) {
            console.log('Notification permission error:', err);
        }
    }
    
    messageDiv.textContent = '✅ Successfully subscribed! You\'ll receive notifications for selected topics.';
    messageDiv.className = 'newsletter-message success';
    emailInput.value = '';
    
    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'newsletter_signup', {
            'event_category': 'engagement',
            'event_label': email,
            'value': 1
        });
    }
    
    // Show test notification
    setTimeout(() => {
        if (Notification.permission === 'granted') {
            new Notification('Welcome to Aetheron! 🚀', {
                body: 'You\'ll now receive updates about governance votes and platform features.',
                icon: '/assets/icon-192.png',
                badge: '/assets/icon-72.png'
            });
        }
    }, 1000);
}

// Helper function for push notifications
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Initialize new features on page load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Hook up MetaMask button
        const addToMetaMaskBtn = document.getElementById('addToMetaMaskBtn');
        if (addToMetaMaskBtn) {
            addToMetaMaskBtn.addEventListener('click', addToMetaMask);
        }

        // Hook up copy button
        const copyBtn = document.getElementById('copyContractBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyContractAddress);
        }

        // Start holder count updates
        updateHolderCount();
        setInterval(updateHolderCount, 60000); // Update every minute

        // Enhanced price updates
        updatePriceWithChange();
        setInterval(updatePriceWithChange, 30000); // Update every 30 seconds
        
        // Hook up QR code and share buttons
        const qrBtn = document.getElementById('qrCodeBtn');
        if (qrBtn) {
            qrBtn.addEventListener('click', showQRCode);
        }
        
       const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', showShareModal);
        }
        
        // Hook up theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // Hook up newsletter form
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', handleNewsletterSignup);
        }
    });
    
// ============================================================================
// WebSocket Real-Time Updates
// ============================================================================

function initializeWebSocket() {
    console.log('🔌 Initializing WebSocket for real-time updates...');
    
    // Connect to Polygon mainnet via Alchemy WebSocket (fallback to polling if unavailable)
    try {
        // Use Alchemy's WebSocket for Polygon
        const wsProvider = new ethers.providers.WebSocketProvider(
            'wss://polygon-mainnet.g.alchemy.com/v2/demo' // Use your own key in production
        );
        
        wsProvider.on('error', (error) => {
            console.warn('⚠️ WebSocket error:', error.message);
            reconnectWebSocket();
        });
        
        wsProvider.on('close', () => {
            console.log('🔌 WebSocket connection closed');
            reconnectWebSocket();
        });
        
        // Listen for new blocks (real-time blockchain updates)
        wsProvider.on('block', async (blockNumber) => {
            console.log(`📦 New block: ${blockNumber}`);
            // Update stats when new block arrives (throttled)
            if (blockNumber % 10 === 0) { // Every 10 blocks (~20 seconds)
                await updateStakingStats();
                await updateLiveHolders();
            }
        });
        
        // Listen for Transfer events on AETH contract
        if (aethContract) {
            const filter = aethContract.filters.Transfer();
            wsProvider.on(filter, (log) => {
                console.log('💸 New AETH transfer detected');
                updateLiveHolders();
            });
        }
        
        console.log('✅ WebSocket connected for real-time updates');
        reconnectAttempts = 0;
        
    } catch (error) {
        console.warn('⚠️ WebSocket not available, using polling fallback:', error.message);
    }
    
    // Initialize DexScreener price updates via more frequent polling
    initializePriceStream();
}

function reconnectWebSocket() {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`🔄 Reconnecting WebSocket in ${delay/1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(initializeWebSocket, delay);
    } else {
        console.log('❌ Max WebSocket reconnection attempts reached. Using polling only.');
    }
}

function initializePriceStream() {
    // DexScreener doesn't provide WebSocket, so we'll use more frequent polling for price
    const priceUpdateInterval = setInterval(async () => {
        await updatePriceWithChange();
    }, 10000); // Update price every 10 seconds for near real-time experience
    
    console.log('📊 Real-time price updates initialized (10s interval)');
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        clearInterval(priceUpdateInterval);
        if (priceWebSocket) {
            priceWebSocket.close();
        }
    });
}

// ============================================================================
// Service Worker Registration (Progressive Web App)
// ============================================================================

// Register Service Worker (moved from inline script)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// ============================================================================
// Toast Notification System
// ============================================================================

function showToast(title, message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon" aria-hidden="true"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <i class="fas fa-times toast-close" aria-label="Close notification"></i>
    `;
    
    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ============================================================================
// Mobile Menu
// ============================================================================

function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.getElementById('mobileMenuOverlay');
    
    if (!hamburger || !navLinks || !overlay) return;
    
    function toggleMenu() {
        const isActive = hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        overlay.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    }
    
    function closeMenu() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
    
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);
    
    // Close menu when clicking nav links
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// ============================================================================
// Progress Bar
// ============================================================================

function initProgressBar() {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;
    
    // Show progress on page navigation
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.href && !link.href.startsWith('javascript:') && !link.target) {
                progressBar.classList.add('active');
            }
        });
    });
}

function showProgress() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.classList.add('active');
}

function hideProgress() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        setTimeout(() => progressBar.classList.remove('active'), 300);
    }
}

// ============================================================================
// Data Caching System
// ============================================================================

const cache = {
    set(key, value, ttl = 60000) { // Default 1 minute TTL
        const item = {
            value,
            expiry: Date.now() + ttl
        };
        try {
            localStorage.setItem(`aeth_cache_${key}`, JSON.stringify(item));
        } catch (e) {
            console.warn('Cache storage failed:', e);
        }
    },
    
    get(key) {
        try {
            const itemStr = localStorage.getItem(`aeth_cache_${key}`);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(`aeth_cache_${key}`);
                return null;
            }
            return item.value;
        } catch (e) {
            return null;
        }
    },
    
    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('aeth_cache_')) {
                localStorage.removeItem(key);
            }
        });
    }
};

// ============================================================================
// User Stakes Dashboard
// ============================================================================

async function loadUserStakes() {
    if (!account || !stakingContract) {
        console.log('No account connected for stakes');
        return;
    }
    
    try {
        showProgress();
        
        const stakesCount = await stakingContract.getUserStakesCount(account);
        const stakes = [];
        
        for (let i = 0; i < stakesCount; i++) {
            try {
                const stake = await stakingContract.getUserStake(account, i);
                stakes.push({
                    id: i,
                    amount: ethers.utils.formatEther(stake.amount),
                    poolId: stake.poolId.toNumber(),
                    startTime: new Date(stake.startTime.toNumber() * 1000),
                    unlockTime: new Date(stake.unlockTime.toNumber() * 1000),
                    pendingReward: ethers.utils.formatEther(stake.pendingReward)
                });
            } catch (error) {
                console.warn(`Failed to load stake ${i}:`, error);
            }
        }
        
        displayUserStakes(stakes);
        hideProgress();
        
        if (stakes.length > 0) {
            showToast('Stakes Loaded', `Found ${stakes.length} active stake(s)`, 'success');
        }
        
    } catch (error) {
        console.error('Error loading user stakes:', error);
        hideProgress();
        showToast('Error', 'Failed to load your stakes', 'error');
    }
}

function displayUserStakes(stakes) {
    // Find or create stakes container
    let container = document.getElementById('userStakesContainer');
    if (!container) {
        const walletCard = document.querySelector('.card.mb-2');
        if (walletCard) {
            container = document.createElement('div');
            container.id = 'userStakesContainer';
            container.className = 'card mb-2';
            container.innerHTML = `
                <div class="card-header">
                    <h2 class="card-title">Your Active Stakes</h2>
                    <button class="btn btn-outline btn-sm" onclick="loadUserStakes()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                <div class="user-stakes" id="userStakesList"></div>
            `;
            walletCard.parentNode.insertBefore(container, walletCard.nextSibling);
        }
    }
    
    const list = document.getElementById('userStakesList');
    if (!list) return;
    
    if (stakes.length === 0) {
        list.innerHTML = `
            <div class="wallet-section">
                <i class="fas fa-inbox empty-icon"></i>
                <p class="text-gray">No active stakes yet. Start staking to earn rewards!</p>
            </div>
        `;
        return;
    }
    
    const poolNames = ['30 Days (5% APY)', '90 Days (12% APY)', '180 Days (25% APY)'];
    
    list.innerHTML = stakes.map(stake => {
        const isUnlocked = new Date() >= stake.unlockTime;
        const status = isUnlocked ? 'completed' : 'active';
        const statusText = isUnlocked ? 'Unlocked' : 'Locked';
        
        return `
            <div class="stake-item slide-up">
                <div class="stake-header">
                    <div>
                        <div class="fw-600">${poolNames[stake.poolId] || 'Unknown Pool'}</div>
                        <div class="text-sm text-gray">Stake #${stake.id}</div>
                    </div>
                    <span class="stake-badge ${status}">${statusText}</span>
                </div>
                <div class="stake-details">
                    <div class="stake-detail-item">
                        <span class="stake-detail-label">Staked Amount</span>
                        <span class="stake-detail-value">${parseFloat(stake.amount).toFixed(2)} AETH</span>
                    </div>
                    <div class="stake-detail-item">
                        <span class="stake-detail-label">Pending Rewards</span>
                        <span class="stake-detail-value">${parseFloat(stake.pendingReward).toFixed(4)} AETH</span>
                    </div>
                    <div class="stake-detail-item">
                        <span class="stake-detail-label">Started</span>
                        <span class="stake-detail-value">${stake.startTime.toLocaleDateString()}</span>
                    </div>
                    <div class="stake-detail-item">
                        <span class="stake-detail-label">Unlock Date</span>
                        <span class="stake-detail-value">${stake.unlockTime.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="stake-actions">
                    ${parseFloat(stake.pendingReward) > 0 ? `
                        <button class="btn btn-success btn-sm" onclick="claimStakeRewards(${stake.id})" ${!isUnlocked ? 'disabled' : ''}>
                            <i class="fas fa-coins"></i> Claim Rewards
                        </button>
                    ` : ''}
                    ${isUnlocked ? `
                        <button class="btn btn-primary btn-sm" onclick="unstakeTokens(${stake.id})">
                            <i class="fas fa-unlock"></i> Unstake
                        </button>
                    ` : `
                        <button class="btn btn-warning btn-sm" onclick="emergencyUnstake(${stake.id})">
                            <i class="fas fa-exclamation-triangle"></i> Emergency Withdraw
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

// Claim rewards from specific stake
async function claimStakeRewards(stakeId) {
    if (!stakingContract || !account) {
        showToast('Error', 'Please connect your wallet first', 'error');
        return;
    }
    
    try {
        showProgress();
        showToast('Processing', 'Claiming rewards...', 'info');
        
        const tx = await stakingContract.claimRewards(stakeId);
        showToast('Transaction Sent', 'Waiting for confirmation...', 'warning');
        
        await tx.wait();
        
        hideProgress();
        showToast('Success!', 'Rewards claimed successfully!', 'success');
        
        // Refresh stakes display
        await loadUserStakes();
        await updateBalances();
        
    } catch (error) {
        console.error('Error claiming rewards:', error);
        hideProgress();
        showToast('Error', error.message || 'Failed to claim rewards', 'error');
    }
}

// Unstake tokens
async function unstakeTokens(stakeId) {
    if (!stakingContract || !account) {
        showToast('Error', 'Please connect your wallet first', 'error');
        return;
    }
    
    try {
        showProgress();
        showToast('Processing', 'Unstaking tokens...', 'info');
        
        const tx = await stakingContract.unstake(stakeId);
        showToast('Transaction Sent', 'Waiting for confirmation...', 'warning');
        
        await tx.wait();
        
        hideProgress();
        showToast('Success!', 'Tokens unstaked successfully!', 'success');
        
        // Refresh displays
        await loadUserStakes();
        await updateBalances();
        
    } catch (error) {
        console.error('Error unstaking:', error);
        hideProgress();
        showToast('Error', error.message || 'Failed to unstake', 'error');
    }
}

// Emergency unstake (forfeit rewards)
async function emergencyUnstake(stakeId) {
    const confirmed = confirm('Emergency withdraw will forfeit all rewards. Continue?');
    if (!confirmed) return;
    
    // Same as unstake but with warning
    await unstakeTokens(stakeId);
}

// ============================================================================
// Enhanced Transaction History
// ============================================================================

async function loadTransactionHistory() {
    if (!account) return;
    
    try {
        showProgress();
        
        // Check cache first
        const cacheKey = `tx_history_${account}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            displayTransactions(cached);
            hideProgress();
            return;
        }
        
        // Fetch from blockchain
        const provider = readOnlyProvider || new ethers.providers.JsonRpcProvider(POLYGON_RPC_URLS[0]);
        const contract = new ethers.Contract(AETH_ADDRESS, AETH_ABI, provider);
        
        // Get Transfer events
        const filterFrom = contract.filters.Transfer(account, null);
        const filterTo = contract.filters.Transfer(null, account);
        
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks
        
        const [sentEvents, receivedEvents] = await Promise.all([
            contract.queryFilter(filterFrom, fromBlock),
            contract.queryFilter(filterTo, fromBlock)
        ]);
        
        const allEvents = [...sentEvents, ...receivedEvents]
            .sort((a, b) => b.blockNumber - a.blockNumber)
            .slice(0, 20); // Latest 20 transactions
        
        const transactions = await Promise.all(allEvents.map(async event => {
            const block = await provider.getBlock(event.blockNumber);
            return {
                hash: event.transactionHash,
                from: event.args.from,
                to: event.args.to,
                value: ethers.utils.formatEther(event.args.value),
                timestamp: new Date(block.timestamp * 1000),
                type: event.args.from.toLowerCase() === account.toLowerCase() ? 'send' : 'receive'
            };
        }));
        
        // Cache for 2 minutes
        cache.set(cacheKey, transactions, 120000);
        
        displayTransactions(transactions);
        hideProgress();
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
        hideProgress();
        showToast('Error', 'Failed to load transaction history', 'error');
    }
}

function displayTransactions(transactions) {
    const list = document.getElementById('txList');
    if (!list) return;
    
    if (!transactions || transactions.length === 0) {
        document.getElementById('txEmpty').classList.remove('hidden');
        list.classList.add('hidden');
        return;
    }
    
    document.getElementById('txEmpty').classList.add('hidden');
    list.classList.remove('hidden');
    
    list.innerHTML = transactions.map(tx => `
        <div class="tx-item">
            <div>
                <span class="tx-type ${tx.type}">${tx.type === 'send' ? 'Sent' : 'Received'}</span>
                <div class="text-sm text-gray mt-05">${tx.timestamp.toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
                <div class="fw-600">${parseFloat(tx.value).toFixed(4)} AETH</div>
                <a href="https://polygonscan.com/tx/${tx.hash}" target="_blank" rel="noopener" class="text-sm" style="color: var(--primary);">
                    View <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `).join('');
}
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => console.log('✅ Service Worker registered:', registration.scope))
            .catch(error => console.error('❌ Service Worker registration failed:', error));
    }
}
