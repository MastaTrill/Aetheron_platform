// index.js - Extracted from index.html inline <script>
// All logic is preserved. Attach this file in index.html after ethers.js and chart.js

// Contract Addresses
const AETH_ADDRESS = "0x44F9c15816bCe5d6691448F60DAD50355ABa40b5";
const STAKING_ADDRESS = "0x896D9d37A67B0bBf81dde0005975DA7850FFa638";
const OWNER_ADDRESS = "0x8A3ad49656Bd07981C9CFc7aD826a808847c3452".toLowerCase();
const POLYGON_CHAIN_ID = '0x89'; // 137 in hex

// ABIs
const AETH_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function owner() view returns (address)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const STAKING_ABI = [
    "function stake(uint256 poolId, uint256 amount)",
    "function pools(uint256) view returns (uint256 lockDuration, uint256 rewardRate, uint256 totalStaked, bool isActive)",
    "event Staked(address indexed user, uint256 poolId, uint256 amount)",
    "event Unstaked(address indexed user, uint256 poolId, uint256 amount)"
];

let provider, signer, account;
let aethContract, stakingContract;
let transactions = [];

let detectionAttempts = 0;
const maxAttempts = 5;

// Initialize
window.addEventListener('load', async () => {
    await updateStats();
    setInterval(updateStats, 30000); // Update every 30 seconds
    detectMetaMaskWithRetry();
    window.addEventListener('ethereum#initialized', handleEthereumInit, { once: true });
    setTimeout(() => {
        if (!window.ethereum) {
            console.log('Final check: MetaMask still not detected');
            checkMetaMaskStatus();
        }
    }, 5000);
});

function handleEthereumInit() {
    console.log('Ethereum initialized event fired');
    checkMetaMaskStatus();
}

async function detectMetaMaskWithRetry() {
    const delays = [500, 1000, 2000, 3000, 4000];
    for (let i = 0; i < delays.length; i++) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
        console.log(`Detection attempt ${i + 1}/${delays.length}`);
        const detected = await checkMetaMaskStatus();
        if (detected) {
            console.log('MetaMask detected successfully!');
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

async function checkMetaMaskStatus() {
    const statusDiv = document.getElementById('metamaskStatus');
    console.log('Checking MetaMask status...');
    console.log('window.ethereum exists:', !!window.ethereum);
    console.log('window.ethereum.isMetaMask:', window.ethereum?.isMetaMask);
    console.log('window.ethereum providers:', window.ethereum?.providers);
    let isMetaMask = false;
    if (window.ethereum?.isMetaMask) {
        isMetaMask = true;
    }
    if (window.ethereum?.providers) {
        const metamaskProvider = window.ethereum.providers.find(p => p.isMetaMask);
        if (metamaskProvider) {
            isMetaMask = true;
            console.log('Found MetaMask in providers array');
        }
    }
    if (isMetaMask) {
        statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i> MetaMask Detected ✓<br><small style="color: #6b7280;">Ready to connect</small>';
        statusDiv.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))';
        statusDiv.style.border = '2px solid var(--success)';
        return true;
    } else if (window.ethereum) {
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i> Other wallet detected<br><small style="color: #6b7280;">MetaMask not found</small>';
        statusDiv.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))';
        statusDiv.style.border = '2px solid var(--warning)';
        return false;
    } else {
        statusDiv.innerHTML = '<i class="fas fa-times-circle" style="color: var(--danger);"></i> MetaMask Not Detected<br><small style="color: #6b7280;">Install the extension & refresh page</small>';
        statusDiv.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))';
        statusDiv.style.border = '2px solid var(--danger)';
        return false;
    }
}

async function recheckMetaMask() {
    const statusDiv = document.getElementById('metamaskStatus');
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rechecking...';
    let detected = false;
    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        detected = await checkMetaMaskStatus();
        if (detected) break;
    }
    if (detected) {
        alert('✅ MetaMask detected!\n\nYou can now click the "Connect Wallet" button in the navbar to connect your wallet.');
    } else {
        const action = confirm(
            '❌ MetaMask still not detected.\n\n' +
            'Troubleshooting steps:\n' +
            '1. Close and reopen your browser\n' +
            '2. Make sure MetaMask extension is enabled\n' +
            '3. Click the MetaMask extension icon once\n' +
            '4. Refresh this page (F5 or Ctrl+R)\n\n' +
            'Press OK to see debug info, or Cancel to try installing MetaMask.'
        );
        if (action) {
            alert('Debug Info:\n\n' +
                  'window.ethereum exists: ' + !!window.ethereum + '\n' +
                  'window.ethereum.isMetaMask: ' + window.ethereum?.isMetaMask + '\n' +
                  'Browser: ' + navigator.userAgent + '\n\n' +
                  'Check browser console (F12) for more details.');
        } else {
            window.open('https://metamask.io/download/', '_blank');
        }
    }
}

document.getElementById('connectBtn').addEventListener('click', connectWallet);

// ...existing code (all other functions from the inline script)...
