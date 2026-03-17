// aetheron-advanced-init.js - extracted from inline <script> in aetheron-advanced.html
let aetheron, provider, signer, userAddress;
const AETH_ADDRESS = '0x44F9c15816bCe5d6691448F60DAD50355ABa40b5',
  STAKING_ADDRESS = '0x896D9d37A67B0bBf81dde0005975DA7850FFa638';
async function connectWallet() {
  if (void 0 === window.ethereum) {
    alert(
      'No Ethereum wallet detected! Please install MetaMask or Coinbase Wallet to use this application.',
    );
    window.open('https://metamask.io/download/', '_blank');
    return;
  }
  try {
    const e = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = e[0];
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    if ((await provider.getNetwork()).chainId !== 137) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }],
        });
      } catch (e) {
        if (e.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com'],
              },
            ],
          });
        }
      }
    }
    document.getElementById('connectBtn').innerHTML =
      `<i class="fas fa-wallet"></i> ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
    aetheron = new AetheronIntegration();
    await aetheron.initialize(AETH_ADDRESS, STAKING_ADDRESS);
    await loadAdvancedFeatures();
    alert('✅ Wallet connected successfully!');
  } catch (e) {
    console.error('Connection error:', e);
    alert('Failed to connect wallet: ' + e.message);
  }
}
async function loadAdvancedFeatures() {
  if (userAddress && aetheron) {
    try {
      const e = await aetheron.getPortfolioValue(userAddress);
      if (e) updatePortfolioDisplay(e);
      const t = await aetheron.getMarketStats();
      if (t) updateMarketDisplay(t);
    } catch (e) {
      console.error('Error loading features:', e);
    }
  }
}
function updatePortfolioDisplay(e) {
  document.getElementById('portfolioSummary').classList.remove('hidden');
  document.getElementById('portfolioValue').textContent =
    e.totalValue.toFixed(2) + ' AETH';
  const t = aetheron.analyzeRisk(e),
    o = document.getElementById('recommendations');
  o.innerHTML = '';
  t.recommendations.forEach((e) => {
    const t = document.createElement('div');
    t.className = 'recommendation-card';
    t.innerHTML = `<i class="fas fa-lightbulb"></i> ${e}`;
    o.appendChild(t);
  });
  const n =
    t.diversification === 'Low' ? 70 : t.volatilityRisk === 'Medium' ? 50 : 30;
  document.getElementById('riskLevel').style.width = n + '%';
  document.getElementById('riskDescription').textContent =
    `Diversification: ${t.diversification} | Volatility: ${t.volatilityRisk}`;
}
function updateMarketDisplay(e) {
  document.getElementById('marketAnalytics').classList.remove('hidden');
  document.getElementById('currentPrice').textContent =
    '$' + e.price.toFixed(6);
  document.getElementById('totalSupply').textContent =
    (e.totalSupply / 1e9).toFixed(2) + 'B AETH';
}
function openAnalytics() {
  document
    .getElementById('marketAnalytics')
    .scrollIntoView({ behavior: 'smooth' });
}
async function optimizePortfolio() {
  if (userAddress && aetheron) {
    try {
      const e = await aetheron.getPortfolioValue(userAddress);
      await aetheron.getStakingPools();
      let t = '🤖 AI Optimization Suggestions:\n\n';
      const o = e.tokens[0].balance;
      if (o > 1e3) {
        t += `• Stake ${(0.6 * o).toFixed(0)} AETH in 180-day pool (25% APY)\n`;
        t += `• Stake ${(0.3 * o).toFixed(0)} AETH in 90-day pool (12% APY)\n`;
        t += `• Keep ${(0.1 * o).toFixed(0)} AETH liquid for opportunities\n`;
      } else if (o > 100) {
        t += `• Stake ${(0.7 * o).toFixed(0)} AETH in 90-day pool (12% APY)\n`;
        t += `• Keep ${(0.3 * o).toFixed(0)} AETH for flexibility\n`;
      } else {
        t += '• Acquire more AETH to unlock higher yield opportunities\n';
        t += '• Current balance too small for optimal diversification\n';
      }
      alert(t);
    } catch (e) {
      console.error('Error optimizing:', e);
      alert('Error: ' + e.message);
    }
  } else {
    alert('Please connect your wallet first');
  }
}
async function analyzeRisk() {
  if (userAddress && aetheron) {
    try {
      const e = await aetheron.getPortfolioValue(userAddress),
        t = aetheron.analyzeRisk(e);
      document
        .getElementById('portfolioSummary')
        .scrollIntoView({ behavior: 'smooth' });
      alert(
        `🛡️ Risk Analysis:\n\nDiversification: ${t.diversification}\nVolatility: ${t.volatilityRisk}\nLiquidity: ${t.liquidityRisk}\n\nCheck the recommendations below!`,
      );
    } catch (e) {
      console.error('Error analyzing:', e);
      alert('Error: ' + e.message);
    }
  } else {
    alert('Please connect your wallet first');
  }
}
function openDeFi() {
  window.open(
    'https://quickswap.exchange/#/swap?outputCurrency=0xAb5ae0D8f569d7c2B27574319b864a5bA6F9671e',
    '_blank',
  );
}
window.addEventListener('load', async () => {
  if (void 0 !== window.ethereum) {
    (await window.ethereum.request({ method: 'eth_accounts' })).length > 0 &&
      (await connectWallet());
  }
});
if (void 0 !== window.ethereum) {
  window.ethereum.on('accountsChanged', (e) => {
    e.length > 0
      ? window.location.reload()
      : (document.getElementById('connectBtn').innerHTML =
          '<i class="fas fa-wallet"></i> Connect Wallet');
  });
  window.ethereum.on('chainChanged', () => {
    window.location.reload();
  });
}
